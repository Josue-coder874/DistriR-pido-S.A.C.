import { useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
  total_cost: 88.5,
  message: 'Ruta calculada con prioridad y distancia.',
};

const initialForm = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  priority: 1,
};

function App() {
  const [customers, setCustomers] = useState(fallbackCustomers);
  const [result, setResult] = useState(fallbackResult);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_URL}/customers`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setCustomers(data);
        setApiReady(true);
        return;
      }
    } catch (error) {
      // ignore and keep fallback data
    }

    setCustomers(fallbackCustomers);
    setResult(fallbackResult);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const metrics = useMemo(() => {
    const current = result || fallbackResult;
    return [
      { label: 'Clientes', value: customers.length, accent: 'cyan' },
      { label: 'Distancia', value: `${current.total_distance_km} km`, accent: 'green' },
      { label: 'Tiempo', value: `${current.estimated_time_minutes} min`, accent: 'amber' },
      { label: 'Costo', value: `S/. ${current.total_cost}`, accent: 'violet' },
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
      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('No se pudo guardar el cliente');
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

  const handleOptimize = async () => {
    setLoading(true);
    setMessage('');

    const payload = {
      stops: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        lat: Number(customer.latitude || -12.05),
        priority: Number(customer.priority || 1),
      })),
    };

    try {
      const response = await fetch(`${API_URL}/routes/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
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

        <button className="primary-btn" onClick={handleOptimize} disabled={loading}>
          {loading ? 'Optimizando...' : 'Optimizar ruta'}
        </button>
      </header>

      <main className="dashboard">
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
              <span className={`status ${apiReady ? 'online' : 'demo'}`}>
                {apiReady ? 'API conectada' : 'Modo demo'}
              </span>
            </div>

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

            {message && <p className="notice">{message}</p>}

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
              <small>{result.message}</small>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
