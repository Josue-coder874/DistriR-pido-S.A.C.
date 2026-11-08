import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import { callsTo, mockApi, signIn } from './test/mockApi';

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
    fireEvent.click(screen.getByRole('button', { name: 'Optimizar ruta' }));
    await screen.findByText('Ruta optimizada con éxito.');
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
