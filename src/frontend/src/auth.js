// Sesión del usuario: se guarda en sessionStorage (dura mientras la pestaña esté abierta).
const STORAGE_KEY = 'ecologistica.session';

const listeners = new Set();

export function loadSession() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const session = raw ? JSON.parse(raw) : null;
    return session?.token && session?.user ? session : null;
  } catch (error) {
    return null;
  }
}

export function saveSession(session) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    // sin almacenamiento la sesión dura hasta recargar la página
  }
}

export function clearSession() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // nada que limpiar
  }
}

// Avisa a la aplicación cuando la API rechaza el token (sesión expirada o revocada).
export function onSessionExpired(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifySessionExpired() {
  clearSession();
  listeners.forEach((listener) => listener());
}

export const ROLE_LABELS = {
  ADMINISTRADOR: 'Administrador',
  DESPACHADOR: 'Despachador',
  CONDUCTOR: 'Conductor',
  AUDITOR: 'Auditor externo',
};

// Matriz de control de acceso (docs/01 Inicio/08. Usuarios), la misma que aplica el backend.
const PERMISSIONS = {
  'customers:write': ['ADMINISTRADOR', 'DESPACHADOR'],
  'customers:purge': ['ADMINISTRADOR'],
  'fleet:write': ['ADMINISTRADOR'],
  'routes:create': ['ADMINISTRADOR', 'DESPACHADOR'],
};

export function can(user, permission) {
  return Boolean(user && PERMISSIONS[permission]?.includes(user.role));
}
