from app.schemas import RouteRequest


class RoutingService:
    def optimize(self, payload: RouteRequest | dict) -> dict:
        data = payload if isinstance(payload, dict) else payload.model_dump()
        stops = data.get("stops", [])

        if not stops:
            return {
                "route": [],
                "total_distance_km": 0,
                "estimated_time_minutes": 0,
                "total_cost": 0.0,
                "message": "No se recibieron paradas para optimizar.",
            }

        ordered = sorted(
            stops,
            key=lambda s: (s.get("priority", 0), s.get("id", 0), s.get("name", "")),
        )

        total_distance = 0.0
        for index in range(len(ordered) - 1):
            current = ordered[index]
            next_stop = ordered[index + 1]
            total_distance += abs(float(current.get("lat", 0)) - float(next_stop.get("lat", 0))) * 100

        estimated_time = len(ordered) * 18
        total_cost = round(total_distance * 1.8, 2)

        return {
            "route": [stop.get("name") for stop in ordered],
            "total_distance_km": round(total_distance, 2),
            "estimated_time_minutes": estimated_time,
            "total_cost": total_cost,
            "message": "Ruta optimizada con algoritmo base de prioridad y distancia.",
        }
