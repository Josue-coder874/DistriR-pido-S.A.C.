import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from '../App';
import { callsTo, mockApi, signIn } from '../test/mockApi';

const fleetPanel = () => screen.getByRole('heading', { name: 'Flota' }).closest('section');

const vehicleSelect = () => screen.getByRole('combobox', { name: 'Vehículo' });
const openRoutes = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Rutas' }));
  await screen.findByRole('heading', { name: 'Planificación de rutas' });
};

const fillVehicleForm = ({ plate, capacity, fuel, factor }) => {
  const panel = within(fleetPanel());
  fireEvent.change(panel.getByLabelText('Placa'), { target: { value: plate } });
  fireEvent.change(panel.getByLabelText('Capacidad (kg)'), { target: { value: capacity } });
  if (fuel) {
    fireEvent.change(panel.getByLabelText('Combustible'), { target: { value: fuel } });
  }
  if (factor !== undefined) {
    fireEvent.change(panel.getByLabelText('Factor de emisión (kg CO₂/km)'), { target: { value: factor } });
  }
};

async function renderApp(options) {
  const fetchMock = mockApi(options);
  render(<App user={signIn()} onLogout={vi.fn()} />);
  await screen.findByText('API conectada');
  return fetchMock;
}

describe('Gestión de flota', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  it('lista los vehículos registrados con sus datos y estado', async () => {
    await renderApp();

    const panel = within(fleetPanel());
    expect(await panel.findByText('ABC-123')).toBeTruthy();
    expect(panel.getByText('1000 kg · Diésel · 0.27 kg CO₂/km')).toBeTruthy();
    expect(panel.getByText('800 kg · GNV · 0.19 kg CO₂/km')).toBeTruthy();
    expect(panel.getByRole('combobox', { name: 'Estado de GNV-456' }).value).toBe('EN_MANTENIMIENTO');
    expect(panel.getByText('1 activos de 2')).toBeTruthy();
  });

  it('registra un vehículo nuevo como activo y lo ofrece para optimizar', async () => {
    const fetchMock = await renderApp();
    await within(fleetPanel()).findByText('ABC-123');

    fillVehicleForm({ plate: 'xyz-789', capacity: '1200', fuel: 'glp', factor: '0.21' });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar vehículo' }));

    expect(await screen.findByText('Vehículo XYZ-789 registrado como activo.')).toBeTruthy();
    const [[, options]] = callsTo(fetchMock, 'POST', /\/vehicles$/);
    expect(JSON.parse(options.body)).toEqual({
      plate: 'xyz-789',
      capacity_kg: 1200,
      fuel_type: 'glp',
      emission_factor_co2: 0.21,
    });
    expect(within(fleetPanel()).getByText('XYZ-789')).toBeTruthy();
    expect(within(fleetPanel()).getByLabelText('Placa').value).toBe('');
    await openRoutes();
    expect(within(vehicleSelect()).getByRole('option', { name: 'XYZ-789 · GLP' })).toBeTruthy();
  });

  it('sin factor de emisión envía null para usar el de referencia', async () => {
    const fetchMock = await renderApp();

    fillVehicleForm({ plate: 'XYZ-789', capacity: '900' });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar vehículo' }));

    await screen.findByText('Vehículo XYZ-789 registrado como activo.');
    const [[, options]] = callsTo(fetchMock, 'POST', /\/vehicles$/);
    expect(JSON.parse(options.body).emission_factor_co2).toBeNull();
  });

  it('muestra el error de placa duplicada y no agrega el vehículo', async () => {
    await renderApp();
    await within(fleetPanel()).findByText('ABC-123');

    fillVehicleForm({ plate: 'ABC-123', capacity: '500' });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar vehículo' }));

    expect(await screen.findByText('Ya existe un vehículo con la placa ABC-123.')).toBeTruthy();
    expect(within(fleetPanel()).getAllByText('ABC-123')).toHaveLength(1);
    expect(within(fleetPanel()).getByLabelText('Placa').value).toBe('ABC-123');
  });

  it('edita un vehículo existente', async () => {
    const fetchMock = await renderApp();
    fireEvent.click(await screen.findByRole('button', { name: 'Editar ABC-123' }));

    const panel = within(fleetPanel());
    expect(panel.getByLabelText('Placa').value).toBe('ABC-123');
    fireEvent.change(panel.getByLabelText('Capacidad (kg)'), { target: { value: '1500' } });
    fireEvent.click(panel.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Vehículo ABC-123 actualizado.')).toBeTruthy();
    const [[url, options]] = callsTo(fetchMock, 'PATCH', /\/vehicles\/1$/);
    expect(url).toBe('http://localhost:8000/api/vehicles/1');
    expect(JSON.parse(options.body).capacity_kg).toBe(1500);
    expect(panel.getByText('1500 kg · Diésel · 0.27 kg CO₂/km')).toBeTruthy();
    expect(panel.getByRole('button', { name: 'Registrar vehículo' })).toBeTruthy();
  });

  it('al cambiar el combustible en el formulario se limpia el factor de emisión', async () => {
    await renderApp();
    fireEvent.click(await screen.findByRole('button', { name: 'Editar ABC-123' }));

    const panel = within(fleetPanel());
    expect(panel.getByLabelText('Factor de emisión (kg CO₂/km)').value).toBe('0.27');
    fireEvent.change(panel.getByLabelText('Combustible'), { target: { value: 'gnv' } });

    expect(panel.getByLabelText('Factor de emisión (kg CO₂/km)').value).toBe('');
  });

  it('pasar un vehículo a mantenimiento lo quita del selector de optimización', async () => {
    await renderApp();
    await within(fleetPanel()).findByText('ABC-123');
    await openRoutes();
    fireEvent.change(vehicleSelect(), { target: { value: '1' } });
    expect(vehicleSelect().value).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Estado de ABC-123' }), {
      target: { value: 'EN_MANTENIMIENTO' },
    });

    expect(await screen.findByText('Vehículo ABC-123 ahora está en mantenimiento.')).toBeTruthy();
    await openRoutes();
    expect(within(vehicleSelect()).queryByRole('option', { name: 'ABC-123 · Diésel' })).toBeNull();
    expect(vehicleSelect().value).toBe('');
  });

  it('el selector solo ofrece vehículos activos', async () => {
    await renderApp();
    await within(fleetPanel()).findByText('ABC-123');

    await openRoutes();
    const options = within(vehicleSelect()).getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['Sin asignar (referencia diésel)', 'ABC-123 · Diésel']);
  });

  it('dar de baja pide confirmación y retira el vehículo de la lista', async () => {
    const fetchMock = await renderApp();
    fireEvent.click(await screen.findByRole('button', { name: 'Dar de baja ABC-123' }));

    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByText(/¿Deseas dar de baja el vehículo ABC-123\?/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Dar de baja' }));

    expect(await screen.findByText('Vehículo ABC-123 dado de baja.')).toBeTruthy();
    expect(callsTo(fetchMock, 'DELETE', /\/vehicles\/1$/)).toHaveLength(1);
    expect(within(fleetPanel()).queryByText('ABC-123')).toBeNull();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('cancelar la baja no llama a la API', async () => {
    const fetchMock = await renderApp();
    fireEvent.click(await screen.findByRole('button', { name: 'Dar de baja ABC-123' }));

    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancelar' }));

    expect(callsTo(fetchMock, 'DELETE', /\/vehicles\//)).toHaveLength(0);
    expect(within(fleetPanel()).getByText('ABC-123')).toBeTruthy();
  });

  it('optimiza con el vehículo seleccionado y muestra sus datos en el resultado', async () => {
    const fetchMock = await renderApp();
    await within(fleetPanel()).findByText('ABC-123');

    await openRoutes();
    fireEvent.change(vehicleSelect(), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Optimizar ruta' }));

    await screen.findByText('Ruta optimizada con éxito.');
    const [[, options]] = callsTo(fetchMock, 'POST', /\/routes\/optimize$/);
    expect(JSON.parse(options.body).vehicle_id).toBe(1);
    expect(screen.getByText(/ABC-123 · Diésel \(0\.27 kg CO₂\/km\)/)).toBeTruthy();
  });

  it('sin vehículo seleccionado no envía vehicle_id', async () => {
    const fetchMock = await renderApp();

    await openRoutes();
    fireEvent.click(screen.getByRole('button', { name: 'Optimizar ruta' }));

    await screen.findByText('Ruta optimizada con éxito.');
    const [[, options]] = callsTo(fetchMock, 'POST', /\/routes\/optimize$/);
    expect(JSON.parse(options.body)).not.toHaveProperty('vehicle_id');
    expect(screen.getByText(/Sin asignar · Diésel/)).toBeTruthy();
  });

  it('si la API rechaza la optimización muestra el motivo y conserva la ruta anterior', async () => {
    // Vehículo que pasó a mantenimiento desde otra sesión: la lista local aún lo muestra activo.
    const fetchMock = await renderApp();
    await within(fleetPanel()).findByText('ABC-123');
    await openRoutes();
    fireEvent.change(vehicleSelect(), { target: { value: '1' } });
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({ detail: 'El vehículo ABC-123 está en mantenimiento y no puede asignarse a rutas.' }),
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Optimizar ruta' }));

    expect(
      await screen.findByText('El vehículo ABC-123 está en mantenimiento y no puede asignarse a rutas.'),
    ).toBeTruthy();
    expect(screen.queryByText('Ruta optimizada con éxito.')).toBeNull();
  });

  it('sin API informa que la flota no está disponible', async () => {
    mockApi({ offline: true });
    render(<App user={signIn()} onLogout={vi.fn()} />);

    expect(await screen.findByText('No se pudo cargar la flota: la API no está disponible.')).toBeTruthy();
  });

  it('muestra el error de conexión al fallar el registro de un vehículo', async () => {
    const fetchMock = await renderApp();
    fillVehicleForm({ plate: 'XYZ-789', capacity: '900' });
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error('API caída')));

    fireEvent.click(screen.getByRole('button', { name: 'Registrar vehículo' }));

    expect(await screen.findByText('No se pudo conectar con la API.')).toBeTruthy();
  });

  it('usa el mensaje alternativo si la respuesta de error no contiene JSON', async () => {
    const fetchMock = await renderApp();
    fillVehicleForm({ plate: 'XYZ-789', capacity: '900' });
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve({ ok: false, json: () => Promise.reject(new Error('JSON inválido')) }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Registrar vehículo' }));

    expect(await screen.findByText('No se pudo registrar el vehículo.')).toBeTruthy();
  });

  it('informa el error de API cuando falla el cambio de estado', async () => {
    const fetchMock = await renderApp();
    await within(fleetPanel()).findByText('ABC-123');
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({ detail: 'Cambio rechazado.' }) }),
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Estado de ABC-123' }), {
      target: { value: 'EN_MANTENIMIENTO' },
    });

    expect(await screen.findByText('Cambio rechazado.')).toBeTruthy();
  });

  it('al dar de baja el vehículo editado limpia el formulario de edición', async () => {
    const fetchMock = await renderApp();
    fireEvent.click(await screen.findByRole('button', { name: 'Editar ABC-123' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dar de baja ABC-123' }));
    const dialog = screen.getByRole('alertdialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Dar de baja' }));

    expect(await screen.findByText('Vehículo ABC-123 dado de baja.')).toBeTruthy();
    expect(callsTo(fetchMock, 'DELETE', /\/vehicles\/1$/)).toHaveLength(1);
    expect(within(fleetPanel()).getByRole('button', { name: 'Registrar vehículo' })).toBeTruthy();
    expect(within(fleetPanel()).getByLabelText('Placa').value).toBe('');
  });

  it('informa el error de API al fallar la baja y mantiene el vehículo', async () => {
    const fetchMock = await renderApp();
    await within(fleetPanel()).findByText('ABC-123');
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({ detail: 'No se pudo dar de baja.' }) }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dar de baja ABC-123' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Dar de baja' }));

    expect(await screen.findByText('No se pudo dar de baja.')).toBeTruthy();
    expect(within(fleetPanel()).getByText('ABC-123')).toBeTruthy();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('con la flota vacía muestra el estado vacío', async () => {
    await renderApp({ vehicles: [] });

    expect(await screen.findByText('No hay vehículos registrados.')).toBeTruthy();
    expect(within(fleetPanel()).getByText('0 activos de 0')).toBeTruthy();
  });
});
