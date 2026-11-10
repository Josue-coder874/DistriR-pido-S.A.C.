import { useEffect, useState } from 'react';
import { apiErrorMessage, apiFetch, jsonRequest } from '../api';
import ConfirmDialog from './ConfirmDialog';
import PaginationControls from './PaginationControls';

export const FUEL_LABELS = {
  diesel: 'Diésel',
  gasolina: 'Gasolina',
  glp: 'GLP',
  gnv: 'GNV',
};

const STATUS_LABELS = {
  ACTIVO: 'activo',
  EN_MANTENIMIENTO: 'en mantenimiento',
};

const STATUS_TITLES = {
  ACTIVO: 'Activo',
  EN_MANTENIMIENTO: 'En mantenimiento',
};

const emptyForm = {
  plate: '',
  capacity_kg: '',
  fuel_type: 'diesel',
  emission_factor_co2: '',
};

async function request(path, options, fallbackError) {
  let response;
  try {
    response = await apiFetch(path, options);
  } catch (error) {
    throw new Error('No se pudo conectar con la API.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(apiErrorMessage(data, fallbackError));
  }
  return data;
}

function FleetPanel({ vehicles, available, canManage, onChanged }) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [retireTarget, setRetireTarget] = useState(null);
  const [retiring, setRetiring] = useState(false);
  const [pageData, setPageData] = useState(null);
  const [page, setPage] = useState(1);

  const loadPage = async (requestedPage) => {
    const data = await request(`/vehicles?page=${requestedPage}&page_size=12`, undefined, 'No se pudo cargar la flota.');
    if (data.items.length === 0 && requestedPage > 1) {
      return loadPage(requestedPage - 1);
    }
    setPageData(data);
    setPage(data.page);
  };

  const handlePageChange = async (requestedPage) => {
    try {
      await loadPage(requestedPage);
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    }
  };

  useEffect(() => {
    if (!available) {
      return;
    }
    loadPage(1).catch((error) => setNotice({ type: 'error', text: error.message }));
  }, [available]);

  const listedVehicles = pageData?.items ?? vehicles.slice(0, 12);
  const listedTotal = pageData?.total ?? vehicles.length;
  const listedTotalPages = pageData?.total_pages ?? Math.max(1, Math.ceil(vehicles.length / 12));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    // Al cambiar el combustible se vuelve al factor de referencia, salvo que se escriba otro.
    setForm((prev) =>
      name === 'fuel_type' ? { ...prev, fuel_type: value, emission_factor_co2: '' } : { ...prev, [name]: value },
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    const payload = {
      plate: form.plate,
      capacity_kg: Number(form.capacity_kg),
      fuel_type: form.fuel_type,
      emission_factor_co2: form.emission_factor_co2 === '' ? null : Number(form.emission_factor_co2),
    };

    try {
      const saved = editingId
        ? await request(`/vehicles/${editingId}`, jsonRequest('PATCH', payload), 'No se pudo actualizar el vehículo.')
        : await request('/vehicles', jsonRequest('POST', payload), 'No se pudo registrar el vehículo.');
      setNotice({
        type: 'success',
        text: editingId ? `Vehículo ${saved.plate} actualizado.` : `Vehículo ${saved.plate} registrado como activo.`,
      });
      resetForm();
      await onChanged();
      await loadPage(page);
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (vehicle) => {
    setEditingId(vehicle.id);
    setNotice(null);
    setForm({
      plate: vehicle.plate,
      capacity_kg: String(vehicle.capacity_kg),
      fuel_type: vehicle.fuel_type,
      emission_factor_co2: String(vehicle.emission_factor_co2),
    });
  };

  const handleStatusChange = async (vehicle, status) => {
    setNotice(null);
    try {
      const saved = await request(
        `/vehicles/${vehicle.id}`,
        jsonRequest('PATCH', { status }),
        'No se pudo cambiar el estado del vehículo.',
      );
      setNotice({ type: 'success', text: `Vehículo ${saved.plate} ahora está ${STATUS_LABELS[saved.status]}.` });
      await onChanged();
      await loadPage(page);
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    }
  };

  const handleRetire = async () => {
    setRetiring(true);
    setNotice(null);
    try {
      const saved = await request(
        `/vehicles/${retireTarget.id}`,
        { method: 'DELETE' },
        'No se pudo dar de baja el vehículo.',
      );
      if (editingId === retireTarget.id) {
        resetForm();
      }
      setNotice({ type: 'success', text: `Vehículo ${saved.plate} dado de baja.` });
      await onChanged();
      await loadPage(page);
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setRetiring(false);
      setRetireTarget(null);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Flota</h2>
        <span className="badge">
          {vehicles.filter((vehicle) => vehicle.status === 'ACTIVO').length} activos de {vehicles.length}
        </span>
      </div>

      <div className={canManage ? 'fleet-grid' : ''}>
        {canManage && (
          <form className="customer-form" onSubmit={handleSubmit} aria-label={editingId ? 'Editar vehículo' : 'Registrar vehículo'}>
            <div className="two-columns">
              <label>
                Placa
                <input name="plate" value={form.plate} onChange={handleChange} placeholder="Ej. ABC-123" maxLength={7} required />
              </label>
              <label>
                Capacidad (kg)
                <input
                  name="capacity_kg"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.capacity_kg}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>
            <div className="two-columns">
              <label>
                Combustible
                <select name="fuel_type" value={form.fuel_type} onChange={handleChange}>
                  {Object.entries(FUEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Factor de emisión (kg CO₂/km)
                <input
                  name="emission_factor_co2"
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={form.emission_factor_co2}
                  onChange={handleChange}
                  placeholder="Referencia del combustible"
                />
              </label>
            </div>
            <div className="form-actions">
              <button className="secondary-btn" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Registrar vehículo'}
              </button>
              {editingId && (
                <button className="link-btn" type="button" onClick={resetForm} disabled={saving}>
                  Cancelar edición
                </button>
              )}
            </div>
            {notice && <p className={`notice ${notice.type === 'error' ? 'error' : ''}`}>{notice.text}</p>}
          </form>
        )}

        <div>
          {!available && <p className="empty-state">No se pudo cargar la flota: la API no está disponible.</p>}
          {available && listedTotal === 0 && <p className="empty-state">No hay vehículos registrados.</p>}

          <ul className="vehicle-list">
            {listedVehicles.map((vehicle) => (
              <li key={vehicle.id} className={vehicle.status === 'ACTIVO' ? '' : 'inactive'}>
                <div>
                  <strong>{vehicle.plate}</strong>
                  <small>
                    {vehicle.capacity_kg} kg · {FUEL_LABELS[vehicle.fuel_type]} · {vehicle.emission_factor_co2} kg CO₂/km
                  </small>
                </div>
                {canManage ? (
                  <div className="vehicle-actions">
                    <select
                      aria-label={`Estado de ${vehicle.plate}`}
                      value={vehicle.status}
                      onChange={(event) => handleStatusChange(vehicle, event.target.value)}
                    >
                      <option value="ACTIVO">Activo</option>
                      <option value="EN_MANTENIMIENTO">En mantenimiento</option>
                    </select>
                    <button
                      type="button"
                      className="link-btn"
                      aria-label={`Editar ${vehicle.plate}`}
                      onClick={() => startEdit(vehicle)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      aria-label={`Dar de baja ${vehicle.plate}`}
                      onClick={() => setRetireTarget(vehicle)}
                    >
                      Dar de baja
                    </button>
                  </div>
                ) : (
                  <span className={`status ${vehicle.status === 'ACTIVO' ? 'online' : 'demo'}`}>
                    {STATUS_TITLES[vehicle.status]}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <PaginationControls page={page} totalPages={listedTotalPages} total={listedTotal} onPageChange={handlePageChange} />
        </div>
      </div>

      {retireTarget && (
        <ConfirmDialog
          title="Dar de baja vehículo"
          description={`¿Deseas dar de baja el vehículo ${retireTarget.plate}? Dejará de estar disponible para la asignación de rutas.`}
          confirmLabel="Dar de baja"
          busyLabel="Procesando..."
          busy={retiring}
          onConfirm={handleRetire}
          onCancel={() => setRetireTarget(null)}
        />
      )}
    </section>
  );
}

export default FleetPanel;
