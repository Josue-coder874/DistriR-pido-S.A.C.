import { useState } from 'react';

function OrdersView({ customers, canEdit, onAddCustomer, submitting, message }) {
  const [form, setForm] = useState({ name: '', address: '', latitude: '', longitude: '', priority: 1 });
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.name === 'priority' ? Number(event.target.value) : event.target.value }));
  const submit = (event) => { event.preventDefault(); onAddCustomer({ ...form, latitude: Number(form.latitude), longitude: Number(form.longitude), priority: Number(form.priority) }); setForm({ name: '', address: '', latitude: '', longitude: '', priority: 1 }); };

  return (
    <section className="module-page" aria-labelledby="orders-title">
      <div className="panel-header"><h2 id="orders-title">Clientes y pedidos</h2><span className="badge">{customers.length} registros</span></div>
      <div className="content-grid">
        {canEdit && <form className="panel customer-form" onSubmit={submit}>
          <h3>Registrar entrega</h3>
          <label>Cliente<input name="name" value={form.name} onChange={change} required /></label>
          <label>Dirección<input name="address" value={form.address} onChange={change} required /></label>
          <div className="two-columns"><label>Latitud<input name="latitude" type="number" step="any" value={form.latitude} onChange={change} required /></label><label>Longitud<input name="longitude" type="number" step="any" value={form.longitude} onChange={change} required /></label></div>
          <label>Prioridad<input name="priority" type="number" min="1" max="10" value={form.priority} onChange={change} required /></label>
          <button className="secondary-btn" disabled={submitting}>{submitting ? 'Guardando...' : 'Registrar pedido'}</button>
        </form>}
        <div className="panel"><h3>Listado</h3>{message && <p className="notice" role="status">{message}</p>}<ul className="customer-list">{customers.map((customer) => <li key={customer.id}><div className="dot"/><div><strong>{customer.name}</strong><small>{customer.address}</small></div></li>)}</ul></div>
      </div>
    </section>
  );
}

export default OrdersView;
