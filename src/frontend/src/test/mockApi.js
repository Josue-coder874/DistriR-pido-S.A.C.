import { vi } from 'vitest';
import { saveSession } from '../auth';

export const TEST_PASSWORD = 'Segura2026';

export const apiUsers = {
  ADMINISTRADOR: { id: 1, name: 'Ana Admin', email: 'admin@distrirapido.pe', role: 'ADMINISTRADOR', status: 'ACTIVO' },
  DESPACHADOR: { id: 2, name: 'Diego Despacho', email: 'despacho@distrirapido.pe', role: 'DESPACHADOR', status: 'ACTIVO' },
  CONDUCTOR: { id: 3, name: 'Carla Conductora', email: 'conductor@distrirapido.pe', role: 'CONDUCTOR', status: 'ACTIVO' },
  AUDITOR: { id: 4, name: 'Aldo Auditor', email: 'auditor@distrirapido.pe', role: 'AUDITOR', status: 'ACTIVO' },
};

export const tokenFor = (user) => `token-${user.id}`;

// Guarda una sesión como si el usuario ya hubiera iniciado sesión.
export function signIn(role = 'ADMINISTRADOR') {
  const user = apiUsers[role];
  saveSession({ token: tokenFor(user), user });
  return user;
}

export const apiCustomers = [
  { id: 1, name: 'Cliente A', address: 'Av. Central 100', latitude: -12.0464, longitude: -77.0428, priority: 1 },
  { id: 2, name: 'Cliente B', address: 'Jr. Los Pinos 220', latitude: -12.0526, longitude: -77.045, priority: 2 },
];

export const apiVehicles = [
  { id: 1, plate: 'ABC-123', capacity_kg: 1000, fuel_type: 'diesel', emission_factor_co2: 0.27, status: 'ACTIVO' },
  { id: 2, plate: 'GNV-456', capacity_kg: 800, fuel_type: 'gnv', emission_factor_co2: 0.19, status: 'EN_MANTENIMIENTO' },
];

export const optimizedResult = {
  route: ['Cliente A', 'Cliente B'],
  total_distance_km: 0.73,
  estimated_time_minutes: 22,
  total_cost: 1.21,
  total_co2_kg: 0.2,
  fuel_type: 'diesel',
  emission_factor_kg_km: 0.27,
  vehicle: null,
  message: 'Ruta optimizada con OR-Tools (distancia y prioridad).',
};

const reply = (body, ok = true, status = ok ? 200 : 400) =>
  Promise.resolve({ ok, status, json: () => Promise.resolve(body) });

// Simula la API de EcoLogística en memoria, con las mismas reglas que el backend.
export function mockApi({
  customers = apiCustomers,
  vehicles = apiVehicles,
  deleteFails = false,
  offline = false,
  lockedEmails = [],
  validResetToken = 'token-de-recuperacion',
} = {}) {
  let storedCustomers = [...customers];
  let storedVehicles = vehicles.map((vehicle) => ({ ...vehicle }));
  let nextVehicleId = Math.max(0, ...storedVehicles.map((vehicle) => vehicle.id)) + 1;
  const state = { revoked: false };

  const fetchMock = vi.fn((url, options = {}) => {
    if (offline) {
      return Promise.reject(new Error('API caída'));
    }
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : null;
    const path = url.replace(/^.*\/api/, '');
    const vehicleMatch = path.match(/^\/vehicles\/(\d+)$/);

    if (path === '/auth/login') {
      const user = Object.values(apiUsers).find((item) => item.email === body.email.trim().toLowerCase());
      if (user && lockedEmails.includes(user.email)) {
        return reply(
          { detail: 'Cuenta bloqueada por 3 intentos fallidos. Intenta nuevamente en 15 minutos.' },
          false,
          423,
        );
      }
      if (!user || body.password !== TEST_PASSWORD) {
        return reply({ detail: 'Correo o contraseña incorrectos.' }, false, 401);
      }
      return reply({ access_token: tokenFor(user), token_type: 'bearer', expires_in: 28800, user });
    }
    if (path === '/auth/password-reset/request') {
      return reply({ message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.' }, true, 202);
    }
    if (path === '/auth/password-reset/confirm') {
      if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(body.new_password)) {
        return reply(
          {
            detail: [
              { msg: 'Value error, La contraseña debe tener al menos 8 caracteres e incluir letras y números.' },
            ],
          },
          false,
          422,
        );
      }
      if (body.token !== validResetToken) {
        return reply({ detail: 'El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo.' }, false, 400);
      }
      return reply({ message: 'Tu contraseña se actualizó. Ya puedes iniciar sesión.' });
    }

    // El resto de endpoints exige un token válido.
    const token = (options.headers?.Authorization || '').replace('Bearer ', '');
    const currentUser = Object.values(apiUsers).find((item) => tokenFor(item) === token);
    if (!currentUser || state.revoked) {
      return reply({ detail: 'Sesión no válida o expirada. Inicia sesión nuevamente.' }, false, 401);
    }
    if (path === '/auth/me') {
      return reply(currentUser);
    }

    if (path === '/customers' && method === 'GET') {
      return reply(storedCustomers);
    }
    if (path === '/customers' && method === 'DELETE') {
      if (deleteFails) {
        return reply({ detail: 'error' }, false);
      }
      const deleted = storedCustomers.length;
      storedCustomers = [];
      return reply({ deleted });
    }
    if (path === '/vehicles' && method === 'GET') {
      return reply(storedVehicles.filter((vehicle) => vehicle.status !== 'DE_BAJA'));
    }
    if (path === '/vehicles' && method === 'POST') {
      const plate = body.plate.toUpperCase();
      if (storedVehicles.some((vehicle) => vehicle.plate === plate)) {
        return reply({ detail: `Ya existe un vehículo con la placa ${plate}.` }, false);
      }
      const created = {
        id: nextVehicleId++,
        ...body,
        plate,
        emission_factor_co2: body.emission_factor_co2 ?? 0.27,
        status: 'ACTIVO',
      };
      storedVehicles.push(created);
      return reply(created);
    }
    if (vehicleMatch) {
      const vehicle = storedVehicles.find((item) => item.id === Number(vehicleMatch[1]));
      if (method === 'PATCH') {
        Object.assign(vehicle, body);
      } else if (method === 'DELETE') {
        vehicle.status = 'DE_BAJA';
      }
      return reply({ ...vehicle });
    }
    if (path === '/routes/optimize') {
      const vehicle = storedVehicles.find((item) => item.id === body.vehicle_id);
      if (vehicle && vehicle.status !== 'ACTIVO') {
        return reply({ detail: `El vehículo ${vehicle.plate} está en mantenimiento y no puede asignarse a rutas.` }, false);
      }
      return reply(
        vehicle
          ? {
              ...optimizedResult,
              fuel_type: vehicle.fuel_type,
              emission_factor_kg_km: vehicle.emission_factor_co2,
              vehicle: { id: vehicle.id, plate: vehicle.plate },
            }
          : optimizedResult,
      );
    }
    return Promise.reject(new Error(`URL no simulada: ${method} ${url}`));
  });

  // Simula que el backend invalida la sesión (expiración, cambio de contraseña, usuario desactivado).
  fetchMock.revokeSession = () => {
    state.revoked = true;
  };
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export const callsTo = (fetchMock, method, pathPattern) =>
  fetchMock.mock.calls.filter(([url, options = {}]) => (options.method || 'GET') === method && pathPattern.test(url));
