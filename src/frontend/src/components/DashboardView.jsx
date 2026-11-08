import { FUEL_LABELS } from './FleetPanel';

function DashboardView({ customers, result, vehicles }) {
  const activeVehicles = vehicles.filter((vehicle) => vehicle.status === 'ACTIVO').length;
  const metrics = [
    ['Clientes registrados', customers.length],
    ['Vehículos activos', activeVehicles],
    ['Distancia', `${result.total_distance_km || 0} km`],
    ['Costo estimado', `S/ ${result.total_cost || 0}`],
    ['CO₂ estimado', `${result.total_co2_kg || 0} kg`],
  ];

  return (
    <section className="module-page" aria-labelledby="dashboard-title">
      <div className="panel-header"><h2 id="dashboard-title">Panel operativo</h2></div>
      <div className="stats-grid">
        {metrics.map(([label, value], index) => <article key={label} className={`stat-card accent-${index}`}><span>{label}</span><strong>{value}</strong></article>)}
      </div>
      <article className="panel result-box">
        <h3>Último resultado</h3>
        <p>{result.message}</p>
        {result.fuel_type && <p>Vehículo: {result.vehicle?.plate || 'Sin asignar'} · {FUEL_LABELS[result.fuel_type]}</p>}
      </article>
    </section>
  );
}

export default DashboardView;
