import math
from datetime import time

from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from app.schemas import RouteRequest

EARTH_RADIUS_KM = 6371.0
AVERAGE_SPEED_KMH = 25.0  # velocidad urbana promedio en Lima
SERVICE_TIME_MINUTES = 10  # tiempo de atención por parada
MAX_ROUTE_MINUTES = 24 * 60
LITERS_PER_GALLON = 3.785411784
# RN-006: costo = consumo de combustible × precio + mantenimiento por km.
MAINTENANCE_COST_PER_KM = 1.20  # S/ por km (supuesto A-05)
# Rendimiento típico de una camioneta de reparto (L/km; m³/km para GNV).
FUEL_CONSUMPTION_PER_KM = {
    "diesel": 0.10,
    "gasolina": 0.11,
    "glp": 0.13,
    "gnv": 0.10,
}
# Precio por litro (por m³ para GNV). Diésel según supuesto A-05 (S/ 17.50/galón);
# los demás son referencias de mercado en Lima a validar con Osinergmin.
FUEL_PRICE_PER_UNIT = {
    "diesel": 17.50 / LITERS_PER_GALLON,
    "gasolina": 16.00 / LITERS_PER_GALLON,
    "glp": 2.10,
    "gnv": 1.90,
}
# Factores de emisión de referencia (kg CO₂/km) para una camioneta de reparto,
# estimados como rendimiento típico (L/km) × factor de combustión IPCC (kg CO₂/L o m³).
# RN-007: se usan cuando la ruta no tiene un vehículo de la flota con su propio factor.
EMISSION_FACTORS_KG_PER_KM = {
    "diesel": 0.27,  # ~10 L/100 km × 2.68 kg CO₂/L
    "gasolina": 0.25,  # ~11 L/100 km × 2.31 kg CO₂/L
    "glp": 0.21,  # ~13 L/100 km × 1.61 kg CO₂/L
    "gnv": 0.19,  # ~10 m³/100 km × 1.89 kg CO₂/m³
}
DEFAULT_FUEL_TYPE = "diesel"
# Penalidad (en metros) por cada posición que una parada se atrasa respecto
# del orden que le corresponde según su prioridad (1 = más urgente).
PRIORITY_PENALTY_METERS = 1000
SOLVER_TIME_LIMIT_SECONDS = 1
MULTI_VEHICLE_SOLVER_TIME_LIMIT_SECONDS = 2
UNASSIGNED_PENALTY = 1_000_000_000


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def minutes_since_midnight(value: time | str) -> int:
    clock = value if isinstance(value, time) else time.fromisoformat(value)
    return clock.hour * 60 + clock.minute


class RoutingService:
    def optimize(self, payload: RouteRequest | dict, vehicles: list | None = None) -> dict:
        data = payload if isinstance(payload, dict) else payload.model_dump()
        stops = data.get("stops", [])
        fuel_type = data.get("fuel_type") or DEFAULT_FUEL_TYPE
        if fuel_type not in EMISSION_FACTORS_KG_PER_KM:
            raise ValueError(f"Tipo de combustible no soportado: {fuel_type}")
        emission_factor = data.get("emission_factor_kg_km") or EMISSION_FACTORS_KG_PER_KM[fuel_type]

        if not stops:
            return {
                "route": [],
                "route_stops": [],
                "total_distance_km": 0,
                "estimated_time_minutes": 0,
                "total_cost": 0.0,
                "fuel_cost": 0.0,
                "maintenance_cost": 0.0,
                "total_co2_kg": 0.0,
                "fuel_type": fuel_type,
                "emission_factor_kg_km": emission_factor,
                "message": "No se recibieron paradas para optimizar.",
            }

        if vehicles is not None:
            return self._optimize_fleet(stops, vehicles)

        ordered = self._solve(stops)
        if ordered is None:
            if any(stop.get("window_start") is not None for stop in stops):
                raise ValueError(
                    "No se encontró una ruta factible que cumpla todas las ventanas de entrega "
                    "dentro del tiempo de optimización."
                )
            ordered = sorted(stops, key=lambda s: (s.get("priority", 1), s.get("id", 0)))
            message = "OR-Tools no encontró solución; se usó el orden por prioridad."
        else:
            message = "Ruta optimizada con OR-Tools (distancia y prioridad)."

        total_distance = sum(
            haversine_km(a.get("lat", 0), a.get("lng", 0), b.get("lat", 0), b.get("lng", 0))
            for a, b in zip(ordered, ordered[1:])
        )
        travel_minutes = total_distance / AVERAGE_SPEED_KMH * 60
        estimated_time = round(travel_minutes + len(ordered) * SERVICE_TIME_MINUTES)
        fuel_cost = total_distance * FUEL_CONSUMPTION_PER_KM[fuel_type] * FUEL_PRICE_PER_UNIT[fuel_type]
        maintenance_cost = total_distance * MAINTENANCE_COST_PER_KM

        return {
            "route": [stop.get("name") for stop in ordered],
            "route_stops": [
                {
                    "id": stop["id"],
                    "name": stop["name"],
                    "lat": stop["lat"],
                    "lng": stop["lng"],
                }
                for stop in ordered
            ],
            "total_distance_km": round(total_distance, 2),
            "estimated_time_minutes": estimated_time,
            "total_cost": round(fuel_cost + maintenance_cost, 2),
            "fuel_cost": round(fuel_cost, 2),
            "maintenance_cost": round(maintenance_cost, 2),
            # RN-007: emisiones = factor de emisión del combustible × distancia recorrida.
            "total_co2_kg": round(total_distance * emission_factor, 2),
            "fuel_type": fuel_type,
            "emission_factor_kg_km": emission_factor,
            "message": message,
        }

    def _optimize_fleet(self, stops: list[dict], vehicles: list) -> dict:
        vehicle_data = [
            {
                "id": self._value(vehicle, "id"),
                "plate": self._value(vehicle, "plate"),
                "capacity_kg": float(self._value(vehicle, "capacity_kg")),
                "fuel_type": self._value(vehicle, "fuel_type"),
                "emission_factor_co2": float(self._value(vehicle, "emission_factor_co2")),
            }
            for vehicle in vehicles
        ]
        if not vehicle_data:
            unassigned = [
                self._unassigned(
                    stop,
                    "SIN_VEHICULOS_DISPONIBLES",
                    "No hay vehículos activos disponibles para asignar este pedido.",
                )
                for stop in stops
            ]
            return {
                "route": [],
                "route_stops": [],
                "routes": [],
                "unassigned": unassigned,
                "total_distance_km": 0,
                "estimated_time_minutes": 0,
                "total_cost": 0.0,
                "fuel_cost": 0.0,
                "maintenance_cost": 0.0,
                "total_co2_kg": 0.0,
                "vehicle": None,
                "fuel_type": None,
                "emission_factor_kg_km": None,
                "message": f"No hay vehículos activos; {len(unassigned)} pedidos quedaron sin asignar.",
            }

        unassigned = []
        eligible = []
        for stop in stops:
            demand = stop.get("demand_kg")
            if demand is None:
                unassigned.append(self._unassigned(stop, "DEMANDA_NO_REGISTRADA",
                                                   "El pedido no tiene demanda registrada en kg."))
            elif demand > max(vehicle["capacity_kg"] for vehicle in vehicle_data):
                unassigned.append(self._unassigned(
                    stop,
                    "DEMANDA_SUPERA_CAPACIDAD_VEHICULO",
                    "La demanda supera la capacidad de todos los vehículos disponibles.",
                ))
            else:
                eligible.append(stop)

        total_demand = sum(float(stop["demand_kg"]) for stop in eligible)
        total_capacity = sum(vehicle["capacity_kg"] for vehicle in vehicle_data)
        capacity_shortfall = total_demand > total_capacity
        assignments, skipped = self._solve_fleet(eligible, vehicle_data)
        for stop in skipped:
            if capacity_shortfall:
                code = "CAPACIDAD_COMBINADA_INSUFICIENTE"
                detail = "La demanda total supera la capacidad combinada disponible."
            elif any(stop.get("window_start") is not None for stop in eligible):
                code = "VENTANA_HORARIA_INFACTIBLE_O_TIEMPO_AGOTADO"
                detail = "No se encontró una asignación factible con las ventanas de entrega."
            else:
                code = "NO_ASIGNADO_DENTRO_DEL_LIMITE_DE_OPTIMIZACION"
                detail = "No se pudo asignar el pedido dentro de las restricciones y tiempo de optimización."
            unassigned.append(self._unassigned(stop, code, detail))

        routes = []
        for vehicle, assigned_stops in zip(vehicle_data, assignments):
            if not assigned_stops:
                continue
            metrics = self._calculate_route_metrics(
                assigned_stops,
                vehicle["fuel_type"],
                vehicle["emission_factor_co2"],
            )
            routes.append({
                "vehicle": {"id": vehicle["id"], "plate": vehicle["plate"]},
                "capacity_kg": vehicle["capacity_kg"],
                "load_kg": round(sum(float(stop["demand_kg"]) for stop in assigned_stops), 3),
                **metrics,
            })

        totals = {
            key: round(sum(route[key] for route in routes), 2)
            for key in ("total_distance_km", "total_cost", "fuel_cost", "maintenance_cost", "total_co2_kg")
        }
        totals["estimated_time_minutes"] = sum(route["estimated_time_minutes"] for route in routes)
        assigned_stops = [stop for route in routes for stop in route["route_stops"]]
        single_vehicle = vehicle_data[0] if len(vehicle_data) == 1 else None
        return {
            **totals,
            "route": [stop["name"] for stop in assigned_stops],
            "route_stops": assigned_stops,
            "routes": routes,
            "unassigned": unassigned,
            "vehicle": (
                {"id": single_vehicle["id"], "plate": single_vehicle["plate"]}
                if single_vehicle
                else None
            ),
            "fuel_type": single_vehicle["fuel_type"] if single_vehicle else None,
            "emission_factor_kg_km": (
                single_vehicle["emission_factor_co2"] if single_vehicle else None
            ),
            "message": (
                f"Se asignaron {len(assigned_stops)} de {len(stops)} pedidos a "
                f"{len(routes)} vehículos."
                if not unassigned
                else f"Se asignaron {len(assigned_stops)} de {len(stops)} pedidos; "
                f"{len(unassigned)} quedaron sin asignar. Revisa los motivos."
            ),
        }

    @staticmethod
    def _value(item, key: str):
        return item.get(key) if isinstance(item, dict) else getattr(item, key)

    @staticmethod
    def _unassigned(stop: dict, reason: str, detail: str) -> dict:
        return {
            "id": stop.get("id"),
            "name": stop.get("name"),
            "demand_kg": stop.get("demand_kg"),
            "reason": reason,
            "detail": detail,
        }

    def _calculate_route_metrics(self, ordered: list[dict], fuel_type: str, emission_factor: float) -> dict:
        total_distance = sum(
            haversine_km(a.get("lat", 0), a.get("lng", 0), b.get("lat", 0), b.get("lng", 0))
            for a, b in zip(ordered, ordered[1:])
        )
        travel_minutes = total_distance / AVERAGE_SPEED_KMH * 60
        estimated_time = round(travel_minutes + len(ordered) * SERVICE_TIME_MINUTES)
        fuel_cost = total_distance * FUEL_CONSUMPTION_PER_KM[fuel_type] * FUEL_PRICE_PER_UNIT[fuel_type]
        maintenance_cost = total_distance * MAINTENANCE_COST_PER_KM
        return {
            "route": [stop.get("name") for stop in ordered],
            "route_stops": [
                {
                    "id": stop["id"],
                    "name": stop["name"],
                    "lat": stop["lat"],
                    "lng": stop["lng"],
                    "demand_kg": stop.get("demand_kg"),
                }
                for stop in ordered
            ],
            "total_distance_km": round(total_distance, 2),
            "estimated_time_minutes": estimated_time,
            "total_cost": round(fuel_cost + maintenance_cost, 2),
            "fuel_cost": round(fuel_cost, 2),
            "maintenance_cost": round(maintenance_cost, 2),
            "total_co2_kg": round(total_distance * emission_factor, 2),
            "fuel_type": fuel_type,
            "emission_factor_kg_km": emission_factor,
        }

    def _solve_fleet(self, stops: list[dict], vehicles: list[dict]) -> tuple[list[list[dict]], list[dict]]:
        if not stops:
            return [[] for _ in vehicles], []

        size = len(stops) + 1
        matrix = [[0] * size for _ in range(size)]
        for i, a in enumerate(stops, start=1):
            for j, b in enumerate(stops, start=1):
                if i != j:
                    matrix[i][j] = round(
                        haversine_km(a.get("lat", 0), a.get("lng", 0), b.get("lat", 0), b.get("lng", 0)) * 1000
                    )

        vehicle_count = len(vehicles)
        manager = pywrapcp.RoutingIndexManager(
            size,
            vehicle_count,
            [0] * vehicle_count,
            [0] * vehicle_count,
        )
        routing = pywrapcp.RoutingModel(manager)

        def distance_callback(from_index: int, to_index: int) -> int:
            return matrix[manager.IndexToNode(from_index)][manager.IndexToNode(to_index)]

        distance_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(distance_index)

        demands_grams = [round(float(stop["demand_kg"]) * 1000) for stop in stops]

        def demand_callback(from_index: int) -> int:
            node = manager.IndexToNode(from_index)
            return demands_grams[node - 1] if node else 0

        demand_index = routing.RegisterUnaryTransitCallback(demand_callback)
        capacities_grams = [round(vehicle["capacity_kg"] * 1000) for vehicle in vehicles]
        routing.AddDimensionWithVehicleCapacity(
            demand_index,
            0,
            capacities_grams,
            True,
            "Capacity",
        )
        for node in range(1, size):
            routing.AddDisjunction([manager.NodeToIndex(node)], UNASSIGNED_PENALTY)

        priorities = [stop.get("priority", 1) for stop in stops]
        routing.AddConstantDimension(1, size, True, "Order")
        order_dimension = routing.GetDimensionOrDie("Order")
        for node, priority in enumerate(priorities, start=1):
            target = 1 + sum(1 for other_priority in priorities if other_priority < priority)
            order_dimension.SetCumulVarSoftUpperBound(
                manager.NodeToIndex(node),
                target,
                PRIORITY_PENALTY_METERS,
            )

        if any(stop.get("window_start") is not None for stop in stops):
            def time_callback(from_index: int, to_index: int) -> int:
                from_node = manager.IndexToNode(from_index)
                to_node = manager.IndexToNode(to_index)
                travel_minutes = math.ceil(matrix[from_node][to_node] / 1000 / AVERAGE_SPEED_KMH * 60)
                service_minutes = SERVICE_TIME_MINUTES if from_node else 0
                return travel_minutes + service_minutes

            time_index = routing.RegisterTransitCallback(time_callback)
            routing.AddDimension(time_index, MAX_ROUTE_MINUTES, MAX_ROUTE_MINUTES, False, "Time")
            time_dimension = routing.GetDimensionOrDie("Time")
            for vehicle_index in range(vehicle_count):
                time_dimension.CumulVar(routing.Start(vehicle_index)).SetRange(0, MAX_ROUTE_MINUTES)
            for node, stop in enumerate(stops, start=1):
                index = manager.NodeToIndex(node)
                if stop.get("window_start") is not None:
                    time_dimension.CumulVar(index).SetRange(
                        minutes_since_midnight(stop["window_start"]),
                        minutes_since_midnight(stop["window_end"]),
                    )
                else:
                    time_dimension.CumulVar(index).SetRange(0, MAX_ROUTE_MINUTES)

        params = pywrapcp.DefaultRoutingSearchParameters()
        params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        params.time_limit.seconds = MULTI_VEHICLE_SOLVER_TIME_LIMIT_SECONDS
        solution = routing.SolveWithParameters(params)
        if solution is None:
            return [[] for _ in vehicles], list(stops)

        assignments = []
        assigned_ids = set()
        for vehicle_index in range(vehicle_count):
            route = []
            index = solution.Value(routing.NextVar(routing.Start(vehicle_index)))
            while not routing.IsEnd(index):
                stop = stops[manager.IndexToNode(index) - 1]
                route.append(stop)
                assigned_ids.add(stop["id"])
                index = solution.Value(routing.NextVar(index))
            assignments.append(route)

        skipped = [stop for stop in stops if stop["id"] not in assigned_ids]
        return assignments, skipped

    def _solve(self, stops: list[dict]) -> list[dict] | None:
        if len(stops) == 1:
            return list(stops)

        # El nodo 0 es un depósito ficticio a distancia cero de todas las paradas:
        # permite que la ruta sea abierta (empieza y termina en cualquier parada).
        size = len(stops) + 1
        matrix = [[0] * size for _ in range(size)]
        for i, a in enumerate(stops, start=1):
            for j, b in enumerate(stops, start=1):
                if i != j:
                    km = haversine_km(a.get("lat", 0), a.get("lng", 0), b.get("lat", 0), b.get("lng", 0))
                    matrix[i][j] = round(km * 1000)

        manager = pywrapcp.RoutingIndexManager(size, 1, 0)
        routing = pywrapcp.RoutingModel(manager)

        def distance_callback(from_index: int, to_index: int) -> int:
            return matrix[manager.IndexToNode(from_index)][manager.IndexToNode(to_index)]

        transit = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit)

        # Dimensión que cuenta la posición de cada parada en la ruta.
        routing.AddConstantDimension(1, size, True, "Order")
        order_dimension = routing.GetDimensionOrDie("Order")
        priorities = [stop.get("priority", 1) for stop in stops]
        for node, priority in enumerate(priorities, start=1):
            # Posición objetivo: después de todas las paradas más urgentes que ella.
            target = 1 + sum(1 for p in priorities if p < priority)
            order_dimension.SetCumulVarSoftUpperBound(
                manager.NodeToIndex(node), target, PRIORITY_PENALTY_METERS
            )

        params = pywrapcp.DefaultRoutingSearchParameters()
        params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        params.time_limit.seconds = SOLVER_TIME_LIMIT_SECONDS

        if any(stop.get("window_start") is not None for stop in stops):
            def time_callback(from_index: int, to_index: int) -> int:
                from_node = manager.IndexToNode(from_index)
                to_node = manager.IndexToNode(to_index)
                travel_minutes = math.ceil(matrix[from_node][to_node] / 1000 / AVERAGE_SPEED_KMH * 60)
                service_minutes = SERVICE_TIME_MINUTES if from_node != 0 else 0
                return travel_minutes + service_minutes

            time_transit = routing.RegisterTransitCallback(time_callback)
            routing.AddDimension(time_transit, MAX_ROUTE_MINUTES, MAX_ROUTE_MINUTES, False, "Time")
            time_dimension = routing.GetDimensionOrDie("Time")
            time_dimension.CumulVar(routing.Start(0)).SetRange(0, MAX_ROUTE_MINUTES)
            for node, stop in enumerate(stops, start=1):
                if stop.get("window_start") is not None:
                    time_dimension.CumulVar(manager.NodeToIndex(node)).SetRange(
                        minutes_since_midnight(stop["window_start"]),
                        minutes_since_midnight(stop["window_end"]),
                    )
                else:
                    time_dimension.CumulVar(manager.NodeToIndex(node)).SetRange(0, MAX_ROUTE_MINUTES)

        solution = routing.SolveWithParameters(params)
        if solution is None:
            return None

        ordered = []
        index = solution.Value(routing.NextVar(routing.Start(0)))
        while not routing.IsEnd(index):
            ordered.append(stops[manager.IndexToNode(index) - 1])
            index = solution.Value(routing.NextVar(index))
        return ordered
