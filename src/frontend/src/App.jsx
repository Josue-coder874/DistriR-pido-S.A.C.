import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { apiErrorMessage, apiFetch, jsonRequest } from './api';
import { can, ROLE_LABELS } from './auth';
import ConfirmDialog from './components/ConfirmDialog';
import FleetPanel, { FUEL_LABELS } from './components/FleetPanel';
import UserBar from './components/UserBar';

const DashboardView = lazy(() => import('./components/DashboardView'));
const OrdersView = lazy(() => import('./components/OrdersView'));
const RouteView = lazy(() => import('./components/RouteView'));

const fallbackCustomers = [
  { id: 1, name: 'Cliente A', address: 'Av. Central 100', latitude: -12.0464, longitude: -77.0428, priority: 1 },
  { id: 2, name: 'Cliente B', address: 'Jr. Los Pinos 220', latitude: -12.0526, longitude: -77.0450, priority: 2 },
  { id: 3, name: 'Cliente C', address: 'Calle San Martín 35', latitude: -12.0589, longitude: -77.0472, priority: 3 },
  { id: 4, name: 'Cliente D', address: 'Av. Brasil 480', latitude: -12.0748, longitude: -77.0532, priority: 4 },
];

const fallbackResult = {
  route: ['Cliente A', 'Cliente B', 'Cliente C', 'Cliente D'],
  total_distance_km: 18.4,
  estimated_time_minutes: 74,
  total_cost: 30.59,
  total_co2_kg: 4.97,
  message: 'Ruta calculada con prioridad y distancia.',
};

const emptyResult = {
  route: [],
  total_distance_km: 0,
  estimated_time_minutes: 0,
  total_cost: 0,
  total_co2_kg: 0,
  message: 'Sin ruta calculada. Registra clientes y presiona "Optimizar ruta".',
};

const initialForm = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  priority: 1,
};

function App({ user, onLogout }) {
  const canEditCustomers = can(user, 'customers:write');
  const canClearCustomers = can(user, 'customers:purge');
  const canOptimize = can(user, 'routes:create');
  const canManageFleet = can(user, 'fleet:write');
  const [customers, setCustomers] = useState(fallbackCustomers);
  const [result, setResult] = useState(fallbackResult);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [fleetAvailable, setFleetAvailable] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [activeModule, setActiveModule] = useState('dashboard');

  const fetchCustomers = async () => {
    try {
      const response = await apiFetch('/customers');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setCustomers(data);
        setApiReady(true);
        // Con la API disponible no se muestran los valores de demostración.
        setResult((current) => (data.length === 0 || current === fallbackResult ? emptyResult : current));
        return;
      }
    } catch (error) {
      // ignore and keep fallback data
    }

    setCustomers(fallbackCustomers);
    setResult(fallbackResult);
  };

  const fetchVehicles = async () => {
    try {
      const response = await apiFetch('/vehicles');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setVehicles(data);
        setFleetAvailable(true);
        return;
      }
    } catch (error) {
      // la flota solo existe en la API; no hay datos de demostración
    }

    setVehicles([]);
    setFleetAvailable(false);
  };

  useEffect(() => {
    fetchCustomers();
    fetchVehicles();
  }, []);

  const activeVehicles = useMemo(() => vehicles.filter((vehicle) => vehicle.status === 'ACTIVO'), [vehicles]);

  useEffect(() => {
    // Un vehículo que pasa a mantenimiento o baja deja de poder seleccionarse.
    if (selectedVehicleId && !activeVehicles.some((vehicle) => String(vehicle.id) === selectedVehicleId)) {
      setSelectedVehicleId('');
    }
  }, [activeVehicles, selectedVehicleId]);

  const metrics = useMemo(() => {
    const current = result || fallbackResult;
    return [
      { label: 'Clientes', value: customers.length, accent: 'cyan' },
      { label: 'Distancia', value: `${current.total_distance_km} km`, accent: 'green' },
      { label: 'Tiempo', value: `${current.estimated_time_minutes} min`, accent: 'amber' },
      { label: 'Costo', value: `S/. ${current.total_cost}`, accent: 'violet' },
      { label: 'CO₂', value: `${current.total_co2_kg} kg`, accent: 'teal' },
    ];
  }, [customers, result]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: name === 'priority' ? Number(value) : value }));
  };

  const handleSubmitCustomer = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    const payload = {
      name: form.name,
      address: form.address,
      latitude: Number(form.latitude || 0),
      longitude: Number(form.longitude || 0),
      priority: Number(form.priority || 1),
    };

    try {
      const response = await apiFetch('/customers', jsonRequest('POST', payload));

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setMessage(apiErrorMessage(data, 'No se pudo guardar el cliente.'));
        return;
      }

      setForm(initialForm);
      setMessage('Cliente agregado correctamente.');
      await fetchCustomers();
    } catch (error) {
      setMessage('No se pudo conectar con la API. Se conserva el modo demo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitCustomerPayload = async (payload) => {
    setSubmitting(true);
    setMessage('');
    try {
      const response = await apiFetch('/customers', jsonRequest('POST', payload));
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setMessage(apiErrorMessage(data, 'No se pudo guardar el pedido.'));
        return;
      }
      setMessage('Pedido registrado correctamente.');
      await fetchCustomers();
    } catch (error) {
      setMessage('No se pudo conectar con la API.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearCustomers = async () => {
    setClearing(true);
    setMessage('');

    try {
      const response = await apiFetch('/customers', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('No se pudieron eliminar los clientes');
      }

      setCustomers([]);
      setResult(emptyResult);
      setApiReady(true);
      setMessage('Se eliminaron todos los clientes registrados.');
    } catch (error) {
      setMessage('No se pudo conectar con la API. No se eliminó ningún cliente.');
    } finally {
      setClearing(false);
      setConfirmOpen(false);
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    setMessage('');

    const payload = {
      stops: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        lat: Number(customer.latitude || -12.05),
        lng: Number(customer.longitude || -77.04),
        priority: Number(customer.priority || 1),
      })),
      vehicle_id: selectedVehicleId ? Number(selectedVehicleId) : undefined,
    };

    try {
      const response = await apiFetch('/routes/optimize', jsonRequest('POST', payload));

      const data = await response.json();
      if (!response.ok) {
        setMessage(apiErrorMessage(data, 'No se pudo optimizar la ruta.'));
        return;
      }
      if (data && data.route) {
        setResult(data);
        setApiReady(true);
        setMessage('Ruta optimizada con éxito.');
      }
    } catch (error) {
      setResult(fallbackResult);
      setMessage('La API no respondió; se usó la ruta de demostración.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">E</div>
          <div>
            <p className="eyebrow">EcoLogística Lima</p>
            <h1>Planificador de rutas</h1>
          </div>
        </div>

        <div className="topbar-actions">
          {canOptimize ? (
            <>
              <label className="vehicle-select">
                Vehículo
                <select value={selectedVehicleId} onChange={(event) => setSelectedVehicleId(event.target.value)}>
                  <option value="">Sin asignar (referencia diésel)</option>
                  {activeVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={String(vehicle.id)}>
                      {vehicle.plate} · {FUEL_LABELS[vehicle.fuel_type]}
                    </option>
                  ))}
                </select>
              </label>
              <button className="primary-btn" onClick={handleOptimize} disabled={loading}>
                {loading ? 'Optimizando...' : 'Optimizar ruta'}
              </button>
            </>
          ) : (
            <span className="badge">Solo lectura · {ROLE_LABELS[user.role]}</span>
          )}
          <UserBar user={user} onLogout={onLogout} />
        </div>
      </header>

      <main className="dashboard">
        <nav className="module-nav" aria-label="Módulos del sistema">
          <button className={activeModule === 'dashboard' ? 'active' : ''} onClick={() => setActiveModule('dashboard')}>Dashboard</button>
          <button className={activeModule === 'orders' ? 'active' : ''} onClick={() => setActiveModule('orders')}>Pedidos</button>
          <button className={activeModule === 'routes' ? 'active' : ''} onClick={() => setActiveModule('routes')}>Rutas</button>
          <button className={activeModule === 'fleet' ? 'active' : ''} onClick={() => setActiveModule('fleet')}>Flota</button>
        </nav>
        <Suspense fallback={<p className="loading" role="status">Cargando módulo...</p>}>
          {activeModule === 'orders' && <OrdersView customers={customers} canEdit={canEditCustomers} onAddCustomer={handleSubmitCustomerPayload} submitting={submitting} message={message} />}
          {activeModule === 'routes' && <RouteView result={result} customers={customers} vehicles={vehicles} selectedVehicleId={selectedVehicleId} onVehicleChange={setSelectedVehicleId} onOptimize={handleOptimize} loading={loading} canOptimize={canOptimize} />}
        </Suspense>

        {activeModule === 'fleet' && <section className="module-page"><p>Gestión de flota disponible en el panel del sistema.</p></section>}

        {activeModule === 'dashboard' && <>
          <section className="stats-grid">
            {metrics.map((metric) => (
              <div key={metric.label} className={`stat-card ${metric.accent}`}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </section>

          <section className="content-grid">
            <div className="panel">
              <div className="panel-header">
                <h2>Clientes</h2>
                <div className="panel-actions">
                  <span className={`status ${apiReady ? 'online' : 'demo'}`}>
                    {apiReady ? 'API conectada' : 'Modo demo'}
                  </span>
                  {canClearCustomers && (
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => setConfirmOpen(true)}
                      disabled={customers.length === 0 || clearing}
                    >
                      Limpiar clientes
                    </button>
                  )}
                </div>
              </div>

              {canEditCustomers && (
                <form className="customer-form" onSubmit={handleSubmitCustomer}>
                  <label>
                    Nombre
                    <input name="name" value={form.name} onChange={handleChange} placeholder="Ej. Cliente X" required />
                  </label>
                  <label>
                    Dirección
                    <input name="address" value={form.address} onChange={handleChange} placeholder="Ej. Av. ..." required />
                  </label>
                  <div className="two-columns">
                    <label>
                      Latitud
                      <input name="latitude" type="number" step="0.0001" value={form.latitude} onChange={handleChange} required />
                    </label>
                    <label>
                      Longitud
                      <input name="longitude" type="number" step="0.0001" value={form.longitude} onChange={handleChange} required />
                    </label>
                  </div>
                  <label>
                    Prioridad
                    <input name="priority" type="number" min="1" max="10" value={form.priority} onChange={handleChange} required />
                  </label>
                  <button className="secondary-btn" type="submit" disabled={submitting}>
                    {submitting ? 'Guardando...' : 'Agregar cliente'}
                  </button>
                </form>
              )}

              {message && <p className="notice">{message}</p>}

              {customers.length === 0 && <p className="empty-state">No hay clientes registrados.</p>}

              <ul className="customer-list">
                {customers.map((customer) => (
                  <li key={customer.id}>
                    <div className="dot" />
                    <div>
                      <strong>{customer.name}</strong>
                      <small>{customer.address}</small>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h2>Ruta sugerida</h2>
                <span className="badge">Sprint 1</span>
              </div>

              <div className="route-track">
                {result.route.map((stop, index) => (
                  <div key={`${stop}-${index}`} className="route-stop-wrap">
                    <span className="route-stop">{index + 1}</span>
                    <span>{stop}</span>
                    {index < result.route.length - 1 && <span className="route-line" />}
                  </div>
                ))}
              </div>

              <div className="result-box">
                <p>
                  <strong>Ruta:</strong> {result.route.join(' → ')}
                </p>
                <p>
                  <strong>Distancia:</strong> {result.total_distance_km} km
                </p>
                <p>
                  <strong>Tiempo:</strong> {result.estimated_time_minutes} min
                </p>
                <p>
                  <strong>Costo:</strong> S/. {result.total_cost}
                </p>
                <p>
                  <strong>CO₂:</strong> {result.total_co2_kg} kg
                </p>
                {result.fuel_type && (
                  <p>
                    <strong>Vehículo:</strong> {result.vehicle ? result.vehicle.plate : 'Sin asignar'} ·{' '}
                    {FUEL_LABELS[result.fuel_type]} ({result.emission_factor_kg_km} kg CO₂/km)
                  </p>
                )}
                <small>{result.message}</small>
              </div>
            </div>
          </section>

          <FleetPanel vehicles={vehicles} available={fleetAvailable} canManage={canManageFleet} onChanged={fetchVehicles} />
        </>}
      </main>

      {confirmOpen && (
        <ConfirmDialog
          title="Limpiar clientes"
          description="¿Estás seguro de que deseas eliminar todos los clientes registrados?"
          confirmLabel="Eliminar"
          busyLabel="Eliminando..."
          busy={clearing}
          onConfirm={handleClearCustomers}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
