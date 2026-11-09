import { FUEL_LABELS } from './FleetPanel';

function RouteView({ result, customers, vehicles, selectedVehicleId, onVehicleChange, onOptimize, loading, canOptimize, message }) {
  return (
    <section className="module-page" aria-labelledby="routes-title">
      <div className="panel-header"><h2 id="routes-title">Planificación de rutas</h2><span className="badge">{customers.length} paradas</span></div>
      {canOptimize && <div className="route-controls"><label>Vehículo<select value={selectedVehicleId} onChange={(event) => onVehicleChange(event.target.value)}><option value="">Sin asignar (referencia diésel)</option>{vehicles.filter(v => v.status === 'ACTIVO').map(v => <option key={v.id} value={String(v.id)}>{v.plate} · {FUEL_LABELS[v.fuel_type]}</option>)}</select></label><button className="primary-btn" onClick={onOptimize} disabled={loading}>{loading ? 'Optimizando...' : 'Optimizar ruta'}</button></div>}
      {message && <p className="notice" role="status">{message}</p>}
      <div className="panel result-box">
        <h3>Ruta sugerida</h3><ol className="route-list">{(result.route || []).map((stop, index) => <li key={`${stop}-${index}`}>{stop}</li>)}</ol>
        <div className="two-columns"><p><strong>Distancia:</strong> {result.total_distance_km || 0} km</p><p><strong>Tiempo:</strong> {result.estimated_time_minutes || 0} min</p><p><strong>Costo:</strong> S/ {result.total_cost || 0}</p><p><strong>CO₂:</strong> {result.total_co2_kg || 0} kg</p></div>
        {result.fuel_type && <p><strong>Vehículo:</strong> {result.vehicle?.plate || 'Sin asignar'} · {FUEL_LABELS[result.fuel_type]}{result.emission_factor_kg_km ? ` (${result.emission_factor_kg_km} kg CO₂/km)` : ''}</p>}
      </div>
    </section>
  );
}
export default RouteView;
