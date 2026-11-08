import { loadSession, notifySessionExpired } from './auth';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// fetch hacia la API con el token de sesión. Un 401 con token significa sesión expirada o revocada.
export async function apiFetch(path, options = {}) {
  const token = loadSession()?.token;
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (response.status === 401 && token) {
    notifySessionExpired();
  }
  return response;
}

export const jsonRequest = (method, body) => ({
  method,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

// Devuelve el mensaje de error de una respuesta de FastAPI (detail como texto o lista de validaciones).
export function apiErrorMessage(data, fallback) {
  const detail = data?.detail;
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => String(item.msg).replace(/^Value error, /, '')).join(' ');
  }
  return fallback;
}
