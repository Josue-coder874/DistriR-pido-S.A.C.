import UserBar from './UserBar';

// Panel del Conductor. La matriz RBAC no le da acceso a clientes, flota ni generación de rutas;
// su vista de ruta asignada llegará con RF-006 (mapa interactivo).
function DriverPanel({ user, onLogout }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">E</div>
          <div>
            <p className="eyebrow">EcoLogística Lima</p>
            <h1>Mi ruta</h1>
          </div>
        </div>
        <UserBar user={user} onLogout={onLogout} />
      </header>

      <main className="dashboard">
        <section className="panel">
          <div className="panel-header">
            <h2>Ruta asignada</h2>
          </div>
          <p className="empty-state">Aún no tienes una ruta asignada. Aquí verás tus paradas cuando el despachador te asigne una.</p>
        </section>
      </main>
    </div>
  );
}

export default DriverPanel;
