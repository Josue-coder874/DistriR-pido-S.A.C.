import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import { apiCustomers, callsTo, mockApi, signIn } from './test/mockApi';

const deleteWasCalled = (fetchMock) => fetchMock.mock.calls.some(([, options]) => options?.method === 'DELETE');

const metricValue = (label) =>
  screen.getByText(label, { selector: '.stat-card span' }).nextElementSibling.textContent;

const openDialog = () => fireEvent.click(screen.getByRole('button', { name: 'Limpiar clientes' }));

describe('Limpiar clientes', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  it('muestra el diálogo de confirmación con Cancelar y Eliminar', async () => {
    mockApi();
    render(<App user={signIn()} onLogout={vi.fn()} />);
    await screen.findByText('API conectada');

    openDialog();

    const dialog = screen.getByRole('alertdialog');
    expect(
      within(dialog).getByText('¿Estás seguro de que deseas eliminar todos los clientes registrados?'),
    ).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'Eliminar' })).toBeTruthy();
  });

  it('Cancelar cierra el diálogo sin llamar a la API ni borrar clientes', async () => {
    const fetchMock = mockApi();
    render(<App user={signIn()} onLogout={vi.fn()} />);
    await screen.findByText('API conectada');

    openDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(deleteWasCalled(fetchMock)).toBe(false);
    expect(screen.getByText('Av. Central 100')).toBeTruthy();
  });

  it('Escape también cierra el diálogo', async () => {
    mockApi();
    render(<App user={signIn()} onLogout={vi.fn()} />);
    await screen.findByText('API conectada');

    openDialog();
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('Eliminar borra los clientes vía API y reinicia ruta e indicadores', async () => {
    const fetchMock = mockApi();
    render(<App user={signIn()} onLogout={vi.fn()} />);
    await screen.findByText('API conectada');
    fireEvent.click(screen.getByRole('button', { name: 'Rutas' }));
    await screen.findByRole('heading', { name: 'Planificación de rutas' });
    fireEvent.click(screen.getByRole('button', { name: 'Optimizar ruta' }));
    await screen.findByText('Ruta optimizada con éxito.');
    fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
    expect(metricValue('Distancia')).toBe('0.73 km');

    openDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await screen.findByText('Se eliminaron todos los clientes registrados.');
    const [[url, options]] = callsTo(fetchMock, 'DELETE', /\/customers$/);
    expect(url).toBe('http://localhost:8000/api/customers');
    expect(options.headers.Authorization).toBe('Bearer token-1');
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByText('No hay clientes registrados.')).toBeTruthy();
    expect(screen.queryByText('Av. Central 100')).toBeNull();
    expect(document.querySelectorAll('.route-stop')).toHaveLength(0);
    expect(metricValue('Clientes')).toBe('0');
    expect(metricValue('Distancia')).toBe('0 km');
    expect(metricValue('Tiempo')).toBe('0 min');
    expect(metricValue('Costo')).toBe('S/. 0');
    expect(metricValue('CO₂')).toBe('0 kg');
    expect(screen.getByRole('button', { name: 'Limpiar clientes' }).disabled).toBe(true);
  });

  it('con la lista vacía el botón está deshabilitado y la app no falla', async () => {
    const fetchMock = mockApi({ customers: [] });
    render(<App user={signIn()} onLogout={vi.fn()} />);
    await screen.findByText('API conectada');

    const button = screen.getByRole('button', { name: 'Limpiar clientes' });
    expect(button.disabled).toBe(true);
    fireEvent.click(button);

    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(deleteWasCalled(fetchMock)).toBe(false);
    expect(screen.getByText('No hay clientes registrados.')).toBeTruthy();
    expect(metricValue('Distancia')).toBe('0 km');
  });

  it('si la API responde con error, conserva los clientes e informa', async () => {
    mockApi({ deleteFails: true });
    render(<App user={signIn()} onLogout={vi.fn()} />);
    await screen.findByText('API conectada');

    openDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await screen.findByText('No se pudo conectar con la API. No se eliminó ningún cliente.');
    expect(screen.getByText('Av. Central 100')).toBeTruthy();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('en modo demo (API caída) no borra los datos de demostración', async () => {
    mockApi({ offline: true });
    render(<App user={signIn()} onLogout={vi.fn()} />);
    await screen.findByText('Modo demo');

    openDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await screen.findByText('No se pudo conectar con la API. No se eliminó ningún cliente.');
    expect(screen.getByText('Av. Central 100')).toBeTruthy();
  });
});

describe('Gestión de clientes y pedidos', () => {
  it('pagina los pedidos y conserva el total de registros', async () => {
    const customers = Array.from({ length: 13 }, (_, index) => ({
      ...apiCustomers[index % apiCustomers.length],
      id: index + 1,
      name: `Cliente ${index + 1}`,
    }));
    mockApi({ customers });
    render(<App user={signIn()} onLogout={vi.fn()} />);
    await screen.findByText('API conectada');
    fireEvent.click(screen.getByRole('button', { name: 'Pedidos' }));

    expect(await screen.findByText('Cliente 1')).toBeTruthy();
    expect(screen.getByText('Página 1 de 2 · 13 registros')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Cliente 13')).toBeTruthy();
    expect(screen.queryByText('Cliente 1')).toBeNull();
    expect(screen.getByText('Página 2 de 2 · 13 registros')).toBeTruthy();
  });

  it('permite completar el peso de un pedido antiguo antes de asignarlo', async () => {
    const fetchMock = mockApi({
      customers: [{ ...apiCustomers[0], demand_kg: null }],
    });
    render(<App user={signIn()} onLogout={vi.fn()} />);
    await screen.findByText('API conectada');
    fireEvent.click(screen.getByRole('button', { name: 'Pedidos' }));

    fireEvent.change(screen.getByLabelText('Peso del pedido 1 en kg'), { target: { value: '38.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar peso' }));

    expect(await screen.findByText('Peso del pedido actualizado.')).toBeTruthy();
    expect(screen.getByText('Demanda: 38.5 kg')).toBeTruthy();
    const [[url, options]] = callsTo(fetchMock, 'PATCH', /\/customers\/1$/);
    expect(url).toBe('http://localhost:8000/api/customers/1');
    expect(JSON.parse(options.body)).toEqual({ demand_kg: 38.5 });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  it('registra un cliente desde el panel y envía coordenadas numéricas', async () => {
    const fetchMock = mockApi();
    const defaultFetch = fetchMock.getMockImplementation();
    fetchMock.mockImplementation((url, options = {}) => {
      if (url.endsWith('/api/customers') && options.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 3 }) });
      }
      return defaultFetch(url, options);
    });
    render(<App user={signIn()} onLogout={vi.fn()} />);
    await screen.findByText('API conectada');

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Cliente nuevo' } });
    fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Av. Nueva 10' } });
    fireEvent.change(screen.getByLabelText('Latitud'), { target: { value: '-12.1' } });
    fireEvent.change(screen.getByLabelText('Longitud'), { target: { value: '-77.1' } });
    fireEvent.change(screen.getByLabelText('Prioridad'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Demanda del pedido (kg)'), { target: { value: '45' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar cliente' }));

    expect(await screen.findByText('Cliente agregado correctamente.')).toBeTruthy();
    const [[, options]] = callsTo(fetchMock, 'POST', /\/customers$/);
    expect(JSON.parse(options.body)).toEqual({
      name: 'Cliente nuevo',
      address: 'Av. Nueva 10',
      latitude: -12.1,
      longitude: -77.1,
      priority: 3,
      demand_kg: 45,
      window_start: null,
      window_end: null,
    });
    expect(screen.getByLabelText('Nombre').value).toBe('');
  });

  it('muestra el error de API al fallar el registro de un cliente', async () => {
    const fetchMock = mockApi();
    const defaultFetch = fetchMock.getMockImplementation();
    fetchMock.mockImplementation((url, options = {}) => {
      if (url.endsWith('/api/customers') && options.method === 'POST') {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ detail: 'Dirección inválida.' }) });
      }
      return defaultFetch(url, options);
    });
    render(<App user={signIn()} onLogout={vi.fn()} />);
    await screen.findByText('API conectada');

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Cliente nuevo' } });
    fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Dirección' } });
    fireEvent.change(screen.getByLabelText('Latitud'), { target: { value: '-12' } });
    fireEvent.change(screen.getByLabelText('Longitud'), { target: { value: '-77' } });
    fireEvent.change(screen.getByLabelText('Demanda del pedido (kg)'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar cliente' }));

    expect(await screen.findByText('Dirección inválida.')).toBeTruthy();
  });

  it('registra un pedido desde su módulo y conserva el mensaje de resultado', async () => {
    const fetchMock = mockApi();
    const defaultFetch = fetchMock.getMockImplementation();
    fetchMock.mockImplementation((url, options = {}) => {
      if (url.endsWith('/api/customers') && options.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 3 }) });
      }
      return defaultFetch(url, options);
    });
    render(<App user={signIn()} onLogout={vi.fn()} />);
    await screen.findByText('API conectada');
    fireEvent.click(screen.getByRole('button', { name: 'Pedidos' }));
    await screen.findByRole('heading', { name: 'Clientes y pedidos' });

    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'Pedido nuevo' } });
    fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Jr. Pedido 25' } });
    fireEvent.change(screen.getByLabelText('Latitud'), { target: { value: '-12.2' } });
    fireEvent.change(screen.getByLabelText('Longitud'), { target: { value: '-77.2' } });
    fireEvent.change(screen.getByLabelText('Demanda del pedido (kg)'), { target: { value: '17.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));

    expect(await screen.findByText('Pedido registrado correctamente.')).toBeTruthy();
    const [[, options]] = callsTo(fetchMock, 'POST', /\/customers$/);
    expect(JSON.parse(options.body)).toEqual({
      name: 'Pedido nuevo',
      address: 'Jr. Pedido 25',
      latitude: -12.2,
      longitude: -77.2,
      priority: 1,
      demand_kg: 17.5,
      window_start: null,
      window_end: null,
    });
  });

  it('deja que la API optimice todos los clientes, no solo la página visible', async () => {
    const customers = Array.from({ length: 13 }, (_, index) => ({
      ...apiCustomers[index % apiCustomers.length],
      id: index + 1,
      name: `Cliente ${index + 1}`,
    }));
    const fetchMock = mockApi({ customers });
    render(<App user={signIn()} onLogout={vi.fn()} />);
    await screen.findByText('API conectada');
    fireEvent.click(screen.getByRole('button', { name: 'Rutas' }));
    await screen.findByRole('heading', { name: 'Planificación de rutas' });
    fireEvent.click(screen.getByRole('button', { name: 'Optimizar ruta' }));

    await screen.findByText('Ruta optimizada con éxito.');
    const [[, options]] = callsTo(fetchMock, 'POST', /\/routes\/optimize$/);
    expect(JSON.parse(options.body)).not.toHaveProperty('stops');
  });

  it('informa si la API se desconecta durante el envío de un pedido', async () => {
    const fetchMock = mockApi();
    render(<App user={signIn()} onLogout={vi.fn()} />);
    await screen.findByText('API conectada');
    fireEvent.click(screen.getByRole('button', { name: 'Pedidos' }));
    await screen.findByRole('heading', { name: 'Clientes y pedidos' });
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error('API caída')));

    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'Pedido sin conexión' } });
    fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Jr. Sin conexión' } });
    fireEvent.change(screen.getByLabelText('Latitud'), { target: { value: '-12' } });
    fireEvent.change(screen.getByLabelText('Longitud'), { target: { value: '-77' } });
    fireEvent.change(screen.getByLabelText('Demanda del pedido (kg)'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));

    expect(await screen.findByText('No se pudo conectar con la API.')).toBeTruthy();
  });

  it('conserva los datos del formulario e informa si falla la API al agregar cliente', async () => {
    const fetchMock = mockApi();
    render(<App user={signIn()} onLogout={vi.fn()} />);
    await screen.findByText('API conectada');
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error('API caída')));

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Cliente pendiente' } });
    fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Av. Pendiente' } });
    fireEvent.change(screen.getByLabelText('Latitud'), { target: { value: '-12.3' } });
    fireEvent.change(screen.getByLabelText('Longitud'), { target: { value: '-77.3' } });
    fireEvent.change(screen.getByLabelText('Demanda del pedido (kg)'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar cliente' }));

    expect(await screen.findByText('No se pudo conectar con la API. Se conserva el modo demo.')).toBeTruthy();
    expect(screen.getByLabelText('Nombre').value).toBe('Cliente pendiente');
  });

  it('usa el mensaje alternativo si falla el registro de un pedido y su respuesta no es JSON', async () => {
    const fetchMock = mockApi();
    const defaultFetch = fetchMock.getMockImplementation();
    fetchMock.mockImplementation((url, options = {}) => {
      if (url.endsWith('/api/customers') && options.method === 'POST') {
        return Promise.resolve({ ok: false, json: () => Promise.reject(new Error('JSON inválido')) });
      }
      return defaultFetch(url, options);
    });
    render(<App user={signIn()} onLogout={vi.fn()} />);
    await screen.findByText('API conectada');
    fireEvent.click(screen.getByRole('button', { name: 'Pedidos' }));
    await screen.findByRole('heading', { name: 'Clientes y pedidos' });

    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'Pedido rechazado' } });
    fireEvent.change(screen.getByLabelText('Dirección'), { target: { value: 'Jr. Rechazado' } });
    fireEvent.change(screen.getByLabelText('Latitud'), { target: { value: '-12' } });
    fireEvent.change(screen.getByLabelText('Longitud'), { target: { value: '-77' } });
    fireEvent.change(screen.getByLabelText('Demanda del pedido (kg)'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pedido' }));

    expect(await screen.findByText('No se pudo guardar el pedido.')).toBeTruthy();
  });

  it('usa la ruta de demostración si falla la petición de optimización', async () => {
    const fetchMock = mockApi();
    render(<App user={signIn()} onLogout={vi.fn()} />);
    await screen.findByText('API conectada');
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error('API caída')));

    fireEvent.click(screen.getByRole('button', { name: 'Rutas' }));
    await screen.findByRole('heading', { name: 'Planificación de rutas' });
    fireEvent.click(screen.getByRole('button', { name: 'Optimizar ruta' }));

    expect(await screen.findByText('La API no respondió; se usó la ruta de demostración.')).toBeTruthy();
    expect(screen.getByText('Cliente D')).toBeTruthy();
  });
});
