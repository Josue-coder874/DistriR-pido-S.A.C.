import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiErrorMessage, apiFetch, jsonRequest } from './api';
import { clearSession, onSessionExpired, saveSession } from './auth';

describe('api helpers', () => {
  beforeEach(() => {
    clearSession();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    clearSession();
  });

  it('envía solicitudes sin token y conserva las opciones y cabeceras', async () => {
    const response = { status: 200 };
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);
    const options = { method: 'GET', headers: { Accept: 'application/json' } };

    await expect(apiFetch('/customers', options)).resolves.toBe(response);

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/api/customers', {
      ...options,
      headers: { Accept: 'application/json' },
    });
  });

  it('añade la sesión guardada y mantiene las cabeceras existentes', async () => {
    saveSession({ token: 'access-token', user: { id: 1 } });
    const fetchMock = vi.fn().mockResolvedValue({ status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/auth/me', { headers: { Accept: 'application/json' } });

    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      Accept: 'application/json',
      Authorization: 'Bearer access-token',
    });
  });

  it('notifica y limpia la sesión al recibir 401 con token', async () => {
    saveSession({ token: 'expired', user: { id: 1 } });
    const onExpired = vi.fn();
    const unsubscribe = onSessionExpired(onExpired);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 401 }));

    await apiFetch('/auth/me');

    expect(onExpired).toHaveBeenCalledOnce();
    expect(sessionStorage.getItem('ecologistica.session')).toBeNull();
    unsubscribe();
  });

  it('crea una solicitud JSON con método, cabecera y cuerpo serializado', () => {
    expect(jsonRequest('POST', { name: 'Cliente' })).toEqual({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"Cliente"}',
    });
  });

  it('extrae detalles textuales y mensajes de validación de FastAPI', () => {
    expect(apiErrorMessage({ detail: 'No autorizado.' }, 'Fallback')).toBe('No autorizado.');
    expect(
      apiErrorMessage(
        { detail: [{ msg: 'Value error, Campo requerido.' }, { msg: 'Formato inválido.' }] },
        'Fallback',
      ),
    ).toBe('Campo requerido. Formato inválido.');
  });

  it('usa el fallback cuando no hay detalles utilizables', () => {
    expect(apiErrorMessage(null, 'Fallback')).toBe('Fallback');
    expect(apiErrorMessage({ detail: [] }, 'Fallback')).toBe('Fallback');
    expect(apiErrorMessage({ detail: 400 }, 'Fallback')).toBe('Fallback');
  });
});
