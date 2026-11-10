import { FUEL_LABELS } from './FleetPanel';
import RouteMap, { getOrderedRouteStops } from './RouteMap';

const displayTime = (value) => value?.slice(0, 5);

function RouteView({ result, customers, vehicles, selectedVehicleId, onVehicleChange, onOptimize, loading, canOptimize, message }) {
  const routeGroups = result.routes?.length
    ? result.routes
    : result.route?.length
      ? [{ vehicle: result.vehicle, route: result.route, route_stops: result.route_stops, ...result }]
      : [];
  const routeCount = result.routes?.length ? result.routes.length : routeGroups.length;
  const stopCount = (result.route_stops?.length ?? customers.length) + (result.unassigned?.length ?? 0);
  return (
    <section className="module-page" aria-labelledby="routes-title">
      <div className="panel-header"><h2 id="routes-title">Planificación de rutas</h2><span className="badge">{stopCount} paradas</span>{routeCount > 0 && <span className="badge">{routeCount} {routeCount === 1 ? 'ruta' : 'rutas'}</span>}</div>
      {canOptimize && <div className="route-controls"><label>Vehículo<select value={selectedVehicleId} onChange={(event) => onVehicleChange(event.target.value)}><option value="">Asignación automática (vehículos activos)</option>{vehicles.filter(v => v.status === 'ACTIVO').map(v => <option key={v.id} value={String(v.id)}>{v.plate} · {FUEL_LABELS[v.fuel_type]}</option>)}</select></label><button className="primary-btn" onClick={onOptimize} disabled={loading}>{loading ? 'Optimizando...' : 'Optimizar ruta'}</button></div>}
      {message && <p className="notice" role="status">{message}</p>}
      <div className="panel result-box">
        <h3>Rutas asignadas</h3>
        {routeGroups.map((route, routeIndex) => {
          const routeStops = getOrderedRouteStops(route, customers);
          return (
            <section className="assigned-route" key={route.vehicle?.id ?? routeIndex} aria-label={`Ruta ${routeIndex + 1}`}>
              <h4>{route.vehicle?.plate ? `Vehículo ${route.vehicle.plate}` : 'Ruta sugerida'}</h4>
              {route.capacity_kg != null && <p>Carga: {route.load_kg} / {route.capacity_kg} kg</p>}
              <ol className="route-list">{(route.route || []).map((stop, index) => {
                const customer = customers.find((item) => item.name === stop);
                const window = customer?.window_start && customer?.window_end
                  ? ` · Entrega ${displayTime(customer.window_start)}–${displayTime(customer.window_end)}`
                  : '';
                return <li key={`${stop}-${index}`}>{stop}{window && <small>{window}</small>}</li>;
              })}</ol>
              {(route.route || []).length > 0 && <RouteMap stops={routeStops} />}
            </section>
          );
        })}
        {result.unassigned?.length > 0 && (
          <section aria-labelledby="unassigned-title">
            <h4 id="unassigned-title">Pedidos sin asignar ({result.unassigned.length})</h4>
            <ul className="unassigned-list">
              {result.unassigned.map((order) => (
                <li key={order.id ?? order.name}>
                  <strong>{order.name}</strong> — {order.detail}
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="two-columns"><p><strong>Distancia:</strong> {result.total_distance_km || 0} km</p><p><strong>Tiempo:</strong> {result.estimated_time_minutes || 0} min</p><p><strong>Costo:</strong> S/ {result.total_cost || 0}</p><p><strong>CO₂:</strong> {result.total_co2_kg || 0} kg</p></div>
        {!result.routes?.length && result.fuel_type && <p><strong>Vehículo:</strong> {result.vehicle?.plate || 'Sin asignar'} · {FUEL_LABELS[result.fuel_type]}{result.emission_factor_kg_km ? ` (${result.emission_factor_kg_km} kg CO₂/km)` : ''}</p>}
      </div>
    </section>
  );
}
export default RouteView;
