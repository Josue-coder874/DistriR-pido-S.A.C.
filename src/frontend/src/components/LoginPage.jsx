import { useState } from 'react';
import { apiErrorMessage, apiFetch, jsonRequest } from '../api';

function AuthCard({ title, children }) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand-wrap">
          <div className="brand-mark">E</div>
          <div>
            <p className="eyebrow">EcoLogística Lima</p>
            <h1 className="auth-title">{title}</h1>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function LoginPage({ onLogin, notice }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(notice || '');

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setInfo('');
    setPassword('');
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setInfo('');
    try {
      const response = await apiFetch('/auth/login', jsonRequest('POST', { email, password }));
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(apiErrorMessage(data, 'No se pudo iniciar sesión.'));
        setPassword('');
        return;
      }
      onLogin(data);
    } catch (requestError) {
      setError('No se pudo conectar con la API. Verifica que el backend esté en ejecución.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await apiFetch('/auth/password-reset/request', jsonRequest('POST', { email }));
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(apiErrorMessage(data, 'No se pudo procesar la solicitud.'));
        return;
      }
      setInfo(data.message);
    } catch (requestError) {
      setError('No se pudo conectar con la API. Verifica que el backend esté en ejecución.');
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'forgot') {
    return (
      <AuthCard title="Recuperar contraseña">
        <form className="customer-form" onSubmit={handleForgot}>
          <p className="auth-help">Ingresa tu correo y te enviaremos un enlace válido por 30 minutos.</p>
          <label>
            Correo electrónico
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          </label>
          <button className="primary-btn" type="submit" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar enlace'}
          </button>
          {info && (
            <p className="notice" role="status">
              {info}
            </p>
          )}
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          <button className="link-btn" type="button" onClick={() => switchMode('login')}>
            Volver a iniciar sesión
          </button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Iniciar sesión">
      <form className="customer-form" onSubmit={handleLogin}>
        {info && (
          <p className="notice" role="status">
            {info}
          </p>
        )}
        <label>
          Correo electrónico
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-btn" type="submit" disabled={submitting}>
          {submitting ? 'Ingresando...' : 'Ingresar'}
        </button>
        <button className="link-btn" type="button" onClick={() => switchMode('forgot')}>
          ¿Olvidaste tu contraseña?
        </button>
      </form>
    </AuthCard>
  );
}

export function ResetPasswordPage({ token, onDone }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await apiFetch(
        '/auth/password-reset/confirm',
        jsonRequest('POST', { token, new_password: password }),
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(apiErrorMessage(data, 'No se pudo restablecer la contraseña.'));
        return;
      }
      onDone(data.message);
    } catch (requestError) {
      setError('No se pudo conectar con la API. Verifica que el backend esté en ejecución.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Nueva contraseña">
      <form className="customer-form" onSubmit={handleSubmit}>
        <p className="auth-help">Usa al menos 8 caracteres, con letras y números.</p>
        <label>
          Nueva contraseña
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Repite la contraseña
          <input
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-btn" type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar contraseña'}
        </button>
        <button className="link-btn" type="button" onClick={() => onDone('')}>
          Volver a iniciar sesión
        </button>
      </form>
    </AuthCard>
  );
}
