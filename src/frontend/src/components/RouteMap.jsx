import { useState } from 'react';

const MAP_WIDTH = 800;
const MAP_HEIGHT = 360;
const TILE_SIZE = 256;
const MIN_ZOOM = 3;
const MAX_ZOOM = 18;

const projectCoordinates = (latitude, longitude, zoom) => {
  const scale = 2 ** zoom;
  const clampedLatitude = Math.max(-85.05112878, Math.min(85.05112878, latitude));
  const sin = Math.sin((clampedLatitude * Math.PI) / 180);
  return {
    x: ((longitude + 180) / 360) * scale * TILE_SIZE,
    y: ((0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale) * TILE_SIZE,
  };
};

export function getOrderedRouteStops(result, customers) {
  if (result.route_stops?.length) {
    return result.route_stops;
  }

  const remainingCustomers = [...customers];
  return (result.route || [])
    .map((name) => {
      const index = remainingCustomers.findIndex((customer) => customer.name === name);
      if (index === -1) {
        return null;
      }

      const [customer] = remainingCustomers.splice(index, 1);
      return {
        id: customer.id,
        name: customer.name,
        lat: customer.lat ?? customer.latitude,
        lng: customer.lng ?? customer.longitude,
      };
    })
    .filter(Boolean);
}

function RouteMap({ stops }) {
  const mappedStops = stops.filter(
    (stop) => Number.isFinite(Number(stop.lat)) && Number.isFinite(Number(stop.lng))
      && Math.abs(Number(stop.lat)) <= 90 && Math.abs(Number(stop.lng)) <= 180,
  );
  if (mappedStops.length === 0) {
    return <p className="empty-state">No hay coordenadas válidas para mostrar esta ruta en el mapa.</p>;
  }

  const projectedAtZero = mappedStops.map((stop) =>
    projectCoordinates(Number(stop.lat), Number(stop.lng), 0),
  );
  const bounds = {
    minX: Math.min(...projectedAtZero.map((point) => point.x)),
    maxX: Math.max(...projectedAtZero.map((point) => point.x)),
    minY: Math.min(...projectedAtZero.map((point) => point.y)),
    maxY: Math.max(...projectedAtZero.map((point) => point.y)),
  };
  const fittedZoom = mappedStops.length === 1
    ? 15
    : Math.max(
        MIN_ZOOM,
        Math.min(
          MAX_ZOOM,
          Math.floor(Math.min(
            Math.log2((MAP_WIDTH * 0.72) / Math.max((bounds.maxX - bounds.minX) * TILE_SIZE, 1)),
            Math.log2((MAP_HEIGHT * 0.72) / Math.max((bounds.maxY - bounds.minY) * TILE_SIZE, 1)),
          )),
        ),
      );
  const [zoomOffset, setZoomOffset] = useState(0);
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fittedZoom + zoomOffset));
  const projectedStops = mappedStops.map((stop) => ({
    ...stop,
    ...projectCoordinates(Number(stop.lat), Number(stop.lng), zoom),
  }));
  const center = {
    x: (Math.min(...projectedStops.map((point) => point.x)) + Math.max(...projectedStops.map((point) => point.x))) / 2,
    y: (Math.min(...projectedStops.map((point) => point.y)) + Math.max(...projectedStops.map((point) => point.y))) / 2,
  };
  const toScreen = (point) => ({
    x: MAP_WIDTH / 2 + point.x - center.x,
    y: MAP_HEIGHT / 2 + point.y - center.y,
  });
  const screenStops = projectedStops.map(toScreen);
  const firstTileX = Math.floor((center.x - MAP_WIDTH / 2) / TILE_SIZE);
  const lastTileX = Math.floor((center.x + MAP_WIDTH / 2) / TILE_SIZE);
  const firstTileY = Math.floor((center.y - MAP_HEIGHT / 2) / TILE_SIZE);
  const lastTileY = Math.floor((center.y + MAP_HEIGHT / 2) / TILE_SIZE);
  const tileCount = 2 ** zoom;
  const tiles = [];
  for (let tileY = firstTileY; tileY <= lastTileY; tileY += 1) {
    if (tileY < 0 || tileY >= tileCount) continue;
    for (let tileX = firstTileX; tileX <= lastTileX; tileX += 1) {
      const wrappedTileX = ((tileX % tileCount) + tileCount) % tileCount;
      tiles.push({
        key: `${zoom}/${wrappedTileX}/${tileY}`,
        url: `https://tile.openstreetmap.org/${zoom}/${wrappedTileX}/${tileY}.png`,
        x: tileX * TILE_SIZE - center.x + MAP_WIDTH / 2,
        y: tileY * TILE_SIZE - center.y + MAP_HEIGHT / 2,
      });
    }
  }
  const routeLine = screenStops.map(({ x, y }) => `${x},${y}`).join(' ');

  return (
    <div className="route-map" role="region" aria-label="Mapa de la ruta sugerida">
      <div className="route-map-controls" aria-label="Controles del mapa">
        <button type="button" aria-label="Acercar mapa" onClick={() => setZoomOffset((current) => Math.min(current + 1, MAX_ZOOM - fittedZoom))}>+</button>
        <button type="button" aria-label="Alejar mapa" onClick={() => setZoomOffset((current) => Math.max(current - 1, MIN_ZOOM - fittedZoom))}>−</button>
      </div>
      <svg
        className="route-map-canvas"
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        role="img"
        aria-label={`Mapa con ${mappedStops.length} paradas. La línea conecta las entregas en el orden de la ruta.`}
      >
        <title>Ruta sugerida con paradas en orden de entrega</title>
        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#e8f0ed" />
        {tiles.map((tile) => (
          <image key={tile.key} href={tile.url} x={tile.x} y={tile.y} width={TILE_SIZE} height={TILE_SIZE} />
        ))}
        {screenStops.length > 1 && (
          <polyline points={routeLine} fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {screenStops.length > 1 && (
          <polyline points={routeLine} fill="none" stroke="#07866d" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {screenStops.map((point, index) => (
          <g key={`${mappedStops[index].id}-${index}`} transform={`translate(${point.x} ${point.y})`}>
            <title>
              {`${index + 1}. ${mappedStops[index].name}${
                mappedStops[index].window_start && mappedStops[index].window_end
                  ? `; entrega ${mappedStops[index].window_start.slice(0, 5)}–${mappedStops[index].window_end.slice(0, 5)}`
                  : ''
              }`}
            </title>
            <circle r="16" fill="#fff" />
            <circle r="12" fill="#07866d" />
            <text y="4" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">{index + 1}</text>
          </g>
        ))}
      </svg>
      <p className="map-attribution">
        Mosaicos © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors
      </p>
      <p className="map-note">Trazado estimado en línea recta entre coordenadas; no representa calles ni tráfico en tiempo real.</p>
    </div>
  );
}

export default RouteMap;
