import { useState } from 'react';
import PaginationControls from './PaginationControls';

const emptyForm = { name: '', address: '', latitude: '', longitude: '', priority: 1, demand_kg: '', window_start: '', window_end: '' };
const displayTime = (value) => value?.slice(0, 5);

function OrdersView({
  customers,
  total = customers.length,
  page = 1,
  totalPages = 1,
  onPageChange = () => {},
  canEdit,
  onAddCustomer,
  onUpdateDemand,
  submitting,
  message,
}) {
  const [form, setForm] = useState(emptyForm);
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.name === 'priority' ? Number(event.target.value) : event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    onAddCustomer({
      ...form,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      priority: Number(form.priority),
      demand_kg: Number(form.demand_kg),
      window_start: form.window_start || null,
      window_end: form.window_end || null,
    });
    setForm(emptyForm);
  };

  return (
    <section className="module-page" aria-labelledby="orders-title">
      <div className="panel-header"><h2 id="orders-title">Clientes y pedidos</h2><span className="badge">{total} registros</span></div>
      <div className="content-grid">
        {canEdit && <form className="panel customer-form" onSubmit={submit}>
          <h3>Registrar entrega</h3>
          <label>Cliente<input name="name" value={form.name} onChange={change} required /></label>
          <label>Dirección<input name="address" value={form.address} onChange={change} required /></label>
          <div className="two-columns"><label>Latitud<input name="latitude" type="number" step="any" value={form.latitude} onChange={change} required /></label><label>Longitud<input name="longitude" type="number" step="any" value={form.longitude} onChange={change} required /></label></div>
          <label>Prioridad<input name="priority" type="number" min="1" max="10" value={form.priority} onChange={change} required /></label>
          <label>Demanda del pedido (kg)<input name="demand_kg" type="number" min="0.001" step="0.001" value={form.demand_kg} onChange={change} required /></label>
          <div className="two-columns">
            <label>Entrega desde<input name="window_start" type="time" value={form.window_start} onChange={change} required={Boolean(form.window_end)} /></label>
            <label>Entrega hasta<input name="window_end" type="time" value={form.window_end} onChange={change} required={Boolean(form.window_start)} /></label>
          </div>
          <button className="secondary-btn" disabled={submitting}>{submitting ? 'Guardando...' : 'Registrar pedido'}</button>
        </form>}
        <div className="panel"><h3>Listado</h3>{message && <p className="notice" role="status">{message}</p>}<ul className="customer-list">{customers.map((customer) => <li key={customer.id}><div className="dot"/><div><strong>{customer.name}</strong><small>{customer.address}</small><small>{customer.demand_kg == null ? 'Peso del pedido pendiente' : `Demanda: ${customer.demand_kg} kg`}</small>{customer.window_start && customer.window_end && <small>Entrega: {displayTime(customer.window_start)}–{displayTime(customer.window_end)}</small>}{canEdit && customer.demand_kg == null && <DemandForm customerId={customer.id} onSave={onUpdateDemand} />}</div></li>)}</ul><PaginationControls page={page} totalPages={totalPages} total={total} onPageChange={onPageChange} /></div>
      </div>
    </section>
  );
}

function DemandForm({ customerId, onSave }) {
  const [demand, setDemand] = useState('');
  return (
    <form
      className="demand-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(customerId, Number(demand));
      }}
    >
      <label>
        Completar peso (kg)
        <input
          aria-label={`Peso del pedido ${customerId} en kg`}
          type="number"
          min="0.001"
          step="0.001"
          value={demand}
          onChange={(event) => setDemand(event.target.value)}
          required
        />
      </label>
      <button className="secondary-btn" type="submit">Guardar peso</button>
    </form>
  );
}

export default OrdersView;
