import math

from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from app.schemas import RouteRequest

EARTH_RADIUS_KM = 6371.0
AVERAGE_SPEED_KMH = 25.0  # velocidad urbana promedio en Lima
SERVICE_TIME_MINUTES = 10  # tiempo de atención por parada
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


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


class RoutingService:
    def optimize(self, payload: RouteRequest | dict) -> dict:
        data = payload if isinstance(payload, dict) else payload.model_dump()
        stops = data.get("stops", [])
        fuel_type = data.get("fuel_type") or DEFAULT_FUEL_TYPE
        if fuel_type not in EMISSION_FACTORS_KG_PER_KM:
            raise ValueError(f"Tipo de combustible no soportado: {fuel_type}")
        emission_factor = data.get("emission_factor_kg_km") or EMISSION_FACTORS_KG_PER_KM[fuel_type]

        if not stops:
            return {
                "route": [],
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

        ordered = self._solve(stops)
        if ordered is None:
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

        solution = routing.SolveWithParameters(params)
        if solution is None:
            return None

        ordered = []
        index = solution.Value(routing.NextVar(routing.Start(0)))
        while not routing.IsEnd(index):
            ordered.append(stops[manager.IndexToNode(index) - 1])
            index = solution.Value(routing.NextVar(index))
        return ordered
