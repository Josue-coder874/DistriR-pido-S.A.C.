import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import Root from './Root';
import { loadSession, saveSession } from './auth';
import { apiUsers, callsTo, mockApi, signIn, TEST_PASSWORD, tokenFor } from './test/mockApi';

const fillLogin = (email, password = TEST_PASSWORD) => {
  fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
};

async function loginAs(role) {
  render(<Root />);
  fillLogin(apiUsers[role].email);
  await screen.findByRole('button', { name: `Opciones de usuario: ${apiUsers[role].name}` });
}

const fleetPanel = () => screen.getByRole('heading', { name: 'Flota' }).closest('section');
const openRoutes = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Rutas' }));
  await screen.findByRole('heading', { name: 'Planificación de rutas' });
};
const openUserMenu = (name = apiUsers.ADMINISTRADOR.name) =>
  fireEvent.click(screen.getByRole('button', { name: `Opciones de usuario: ${name}` }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('Inicio de sesión (RF-001)', () => {
  it('sin sesión muestra el formulario de inicio de sesión', () => {
    mockApi();
    render(<Root />);

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy();
    expect(screen.queryByText('Planificador de rutas')).toBeNull();
  });

  it('con credenciales correctas entra al panel y guarda la sesión', async () => {
    const fetchMock = mockApi();
    await loginAs('ADMINISTRADOR');

    expect(screen.getByText('Planificador de rutas')).toBeTruthy();
    expect(screen.getByText('Administrador')).toBeTruthy();
    expect(loadSession()).toEqual({ token: 'token-1', user: apiUsers.ADMINISTRADOR });
    const [[, options]] = callsTo(fetchMock, 'POST', /\/auth\/login$/);
    expect(JSON.parse(options.body)).toEqual({ email: 'admin@distrirapido.pe', password: TEST_PASSWORD });
    // Las peticiones posteriores llevan el token.
    const [[, customersOptions]] = callsTo(fetchMock, 'GET', /\/customers(?:\?|$)/);
    expect(customersOptions.headers.Authorization).toBe('Bearer token-1');
  });

  it('con credenciales incorrectas muestra el error y limpia la contraseña', async () => {
    mockApi();
    render(<Root />);

    fillLogin('admin@distrirapido.pe', 'Incorrecta1');

    expect((await screen.findByRole('alert')).textContent).toBe('Correo o contraseña incorrectos.');
    expect(screen.getByLabelText('Contraseña').value).toBe('');
    expect(loadSession()).toBeNull();
  });

  it('una cuenta bloqueada muestra el tiempo restante (RN-001)', async () => {
    mockApi({ lockedEmails: ['admin@distrirapido.pe'] });
    render(<Root />);

    fillLogin('admin@distrirapido.pe');

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Cuenta bloqueada por 3 intentos fallidos. Intenta nuevamente en 15 minutos.',
    );
  });

  it('sin conexión con la API lo informa', async () => {
    mockApi({ offline: true });
    render(<Root />);

    fillLogin('admin@distrirapido.pe');

    expect((await screen.findByRole('alert')).textContent).toMatch(/No se pudo conectar con la API/);
  });

  it('cerrar sesión vuelve al inicio de sesión y borra la sesión', async () => {
    mockApi();
    await loginAs('ADMINISTRADOR');

    openUserMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Cerraste sesión correctamente.');
    expect(loadSession()).toBeNull();
  });
});

describe('Sesión guardada', () => {
  it('al recargar valida el token y actualiza los datos del usuario', async () => {
    const fetchMock = mockApi();
    // Sesión guardada con datos desactualizados: el rol vigente lo decide la API.
    saveSession({ token: tokenFor(apiUsers.ADMINISTRADOR), user: { ...apiUsers.ADMINISTRADOR, role: 'AUDITOR' } });

    render(<Root />);

    await screen.findByText('Planificador de rutas');
    await openRoutes();
    expect(await screen.findByRole('button', { name: 'Optimizar ruta' })).toBeTruthy();
    expect(callsTo(fetchMock, 'GET', /\/auth\/me$/).length).toBeGreaterThan(0);
    expect(loadSession().user.role).toBe('ADMINISTRADOR');
  });

  it('si el token guardado ya no es válido pide iniciar sesión de nuevo', async () => {
    const fetchMock = mockApi();
    fetchMock.revokeSession();
    signIn('ADMINISTRADOR');

    render(<Root />);

    expect(await screen.findByText('Tu sesión expiró. Inicia sesión nuevamente.')).toBeTruthy();
    expect(loadSession()).toBeNull();
  });

  it('mantiene la sesión guardada si la validación falla por desconexión', async () => {
    mockApi({ offline: true });
    signIn('ADMINISTRADOR');

    render(<Root />);

    expect(await screen.findByText('Modo demo')).toBeTruthy();
    expect(loadSession().user.role).toBe('ADMINISTRADOR');
  });

  it('si la sesión expira durante el uso vuelve al inicio de sesión', async () => {
    const fetchMock = mockApi();
    await loginAs('ADMINISTRADOR');

    fetchMock.revokeSession();
    await openRoutes();
    fireEvent.click(screen.getByRole('button', { name: 'Optimizar ruta' }));

    expect(await screen.findByText('Tu sesión expiró. Inicia sesión nuevamente.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy();
  });
});

describe('Panel según el rol (RF-010)', () => {
  it('Administrador: gestiona clientes, flota y rutas', async () => {
    mockApi();
    await loginAs('ADMINISTRADOR');

    expect(screen.queryByRole('button', { name: 'Optimizar ruta' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Agregar cliente' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Limpiar clientes' })).toBeTruthy();
    expect(within(fleetPanel()).getByRole('button', { name: 'Registrar vehículo' })).toBeTruthy();
    expect(await within(fleetPanel()).findByRole('button', { name: 'Editar ABC-123' })).toBeTruthy();
    await openRoutes();
    expect(screen.getByRole('button', { name: 'Optimizar ruta' })).toBeTruthy();
  });

  it('Despachador: optimiza y registra clientes, pero la flota es de solo lectura', async () => {
    mockApi();
    await loginAs('DESPACHADOR');

    expect(screen.queryByRole('button', { name: 'Optimizar ruta' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Agregar cliente' })).toBeTruthy();
    // La eliminación física de registros es exclusiva del Administrador.
    expect(screen.queryByRole('button', { name: 'Limpiar clientes' })).toBeNull();
    const panel = within(fleetPanel());
    expect(await panel.findByText('ABC-123')).toBeTruthy();
    expect(panel.queryByRole('button', { name: 'Registrar vehículo' })).toBeNull();
    expect(panel.queryByRole('button', { name: 'Editar ABC-123' })).toBeNull();
    expect(panel.queryByRole('button', { name: 'Dar de baja ABC-123' })).toBeNull();
    expect(panel.getByText('En mantenimiento')).toBeTruthy();
    await openRoutes();
    expect(screen.getByRole('button', { name: 'Optimizar ruta' })).toBeTruthy();
  });

  it('Auditor: solo lectura, sin opciones de crear, modificar ni eliminar (RN-010)', async () => {
    mockApi();
    await loginAs('AUDITOR');

    openUserMenu(apiUsers.AUDITOR.name);
    expect(screen.getByText('Auditor externo')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Rutas' }));
    expect(screen.queryByRole('button', { name: 'Optimizar ruta' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
    expect(screen.queryByRole('button', { name: 'Agregar cliente' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Limpiar clientes' })).toBeNull();
    expect(await screen.findByText('Av. Central 100')).toBeTruthy();
    const panel = within(fleetPanel());
    expect(await panel.findByText('ABC-123')).toBeTruthy();
    expect(panel.queryByRole('button', { name: 'Registrar vehículo' })).toBeNull();
    expect(panel.queryAllByRole('button')).toHaveLength(0);
  });

  it('Conductor: va a su propio panel y no consulta clientes ni flota', async () => {
    const fetchMock = mockApi();
    await loginAs('CONDUCTOR');

    expect(screen.getByRole('heading', { name: 'Mi ruta' })).toBeTruthy();
    expect(screen.getByText(/Aún no tienes una ruta asignada/)).toBeTruthy();
    expect(screen.queryByText('Planificador de rutas')).toBeNull();
    expect(callsTo(fetchMock, 'GET', /\/(customers|vehicles)(?:\?|$)/)).toHaveLength(0);
  });
});

describe('Recuperación de contraseña (RF-001)', () => {
  it('solicita el enlace y muestra un mensaje genérico', async () => {
    const fetchMock = mockApi();
    render(<Root />);

    fireEvent.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }));
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'admin@distrirapido.pe' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }));

    expect((await screen.findByRole('status')).textContent).toBe(
      'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
    );
    const [[, options]] = callsTo(fetchMock, 'POST', /\/password-reset\/request$/);
    expect(JSON.parse(options.body)).toEqual({ email: 'admin@distrirapido.pe' });

    fireEvent.click(screen.getByRole('button', { name: 'Volver a iniciar sesión' }));
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy();
  });

  it('muestra errores de la API al solicitar un enlace de recuperación', async () => {
    const fetchMock = mockApi();
    render(<Root />);
    fireEvent.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }));
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'admin@distrirapido.pe' } });
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({ detail: 'Solicitud rechazada.' }) }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Solicitud rechazada.');
  });

  it('informa la desconexión al solicitar el enlace de recuperación', async () => {
    const fetchMock = mockApi();
    render(<Root />);
    fireEvent.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }));
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'admin@distrirapido.pe' } });
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error('API caída')));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/No se pudo conectar con la API/);
  });

  describe('desde el enlace del correo', () => {
    const openResetLink = (token = 'token-de-recuperacion') => {
      window.history.replaceState(null, '', `/?reset_token=${token}`);
      render(<Root />);
    };

    const submitNewPassword = (password, confirmation = password) => {
      fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: password } });
      fireEvent.change(screen.getByLabelText('Repite la contraseña'), { target: { value: confirmation } });
      fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    };

    it('muestra el formulario de nueva contraseña', () => {
      mockApi();
      openResetLink();

      expect(screen.getByRole('heading', { name: 'Nueva contraseña' })).toBeTruthy();
    });

    it('valida que las contraseñas coincidan sin llamar a la API', () => {
      const fetchMock = mockApi();
      openResetLink();

      submitNewPassword('NuevaClave2026', 'OtraClave2026');

      expect(screen.getByRole('alert').textContent).toBe('Las contraseñas no coinciden.');
      expect(callsTo(fetchMock, 'POST', /\/password-reset\/confirm$/)).toHaveLength(0);
    });

    it('muestra el error de política de contraseñas de la API', async () => {
      mockApi();
      openResetLink();

      submitNewPassword('corta');

      expect((await screen.findByRole('alert')).textContent).toBe(
        'La contraseña debe tener al menos 8 caracteres e incluir letras y números.',
      );
    });

    it('con un enlace inválido o expirado lo informa', async () => {
      mockApi();
      openResetLink('enlace-viejo');

      submitNewPassword('NuevaClave2026');

      expect((await screen.findByRole('alert')).textContent).toMatch(/no es válido o ha expirado/);
    });

    it('al guardar vuelve al inicio de sesión, limpia la URL y cierra la sesión anterior', async () => {
      const fetchMock = mockApi();
      signIn('ADMINISTRADOR');
      openResetLink();

      submitNewPassword('NuevaClave2026');

      expect((await screen.findByRole('status')).textContent).toBe(
        'Tu contraseña se actualizó. Ya puedes iniciar sesión.',
      );
      expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy();
      expect(window.location.search).toBe('');
      expect(loadSession()).toBeNull();
      const [[, options]] = callsTo(fetchMock, 'POST', /\/password-reset\/confirm$/);
      expect(JSON.parse(options.body)).toEqual({ token: 'token-de-recuperacion', new_password: 'NuevaClave2026' });
    });

    it('mantiene la sesión previa si falla la petición de cambio de contraseña', async () => {
      const fetchMock = mockApi();
      const session = signIn('ADMINISTRADOR');
      openResetLink();
      fetchMock.mockImplementationOnce(() => Promise.reject(new Error('API caída')));

      submitNewPassword('NuevaClave2026');

      expect((await screen.findByRole('alert')).textContent).toMatch(/No se pudo conectar con la API/);
      expect(loadSession().user).toEqual(session);
    });

    it('volver al inicio sin guardar no invalida una sesión existente', async () => {
      mockApi();
      const session = signIn('ADMINISTRADOR');
      openResetLink();

      fireEvent.click(screen.getByRole('button', { name: 'Volver a iniciar sesión' }));

      expect(await screen.findByRole('heading', { name: 'Planificador de rutas' })).toBeTruthy();
      expect(loadSession().user).toEqual(session);
      expect(window.location.search).toBe('');
    });
  });
});
