import { lazy, Suspense, useEffect, useState } from 'react';
import { apiFetch } from './api';
import { clearSession, loadSession, onSessionExpired, saveSession } from './auth';
import { LoginPage, ResetPasswordPage } from './components/LoginPage';

const App = lazy(() => import('./App'));
const DriverPanel = lazy(() => import('./components/DriverPanel'));

const readResetToken = () => new URLSearchParams(window.location.search).get('reset_token');

function Root() {
  const [session, setSession] = useState(loadSession);
  const [checking, setChecking] = useState(() => Boolean(loadSession()));
  const [resetToken, setResetToken] = useState(readResetToken);
  const [notice, setNotice] = useState('');

  useEffect(
    () =>
      onSessionExpired(() => {
        setSession(null);
        setNotice('Tu sesión expiró. Inicia sesión nuevamente.');
      }),
    [],
  );

  // Al recargar, se valida el token guardado y se actualizan el rol y los datos del usuario.
  useEffect(() => {
    if (!loadSession()) {
      return;
    }
    const validate = async () => {
      try {
        const response = await apiFetch('/auth/me');
        if (response.ok) {
          const user = await response.json();
          const current = loadSession();
          if (current) {
            const updated = { ...current, user };
            saveSession(updated);
            setSession(updated);
          }
        }
      } catch (error) {
        // sin conexión se mantiene la sesión guardada; la API la validará en la siguiente petición
      } finally {
        setChecking(false);
      }
    };
    validate();
  }, []);

  const handleLogin = (data) => {
    const newSession = { token: data.access_token, user: data.user };
    saveSession(newSession);
    setSession(newSession);
    setNotice('');
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setNotice('Cerraste sesión correctamente.');
  };

  const handleResetDone = (message) => {
    window.history.replaceState(null, '', window.location.pathname);
    // Las sesiones anteriores dejan de ser válidas tras cambiar la contraseña.
    if (message) {
      clearSession();
      setSession(null);
    }
    setResetToken(null);
    setNotice(message);
  };

  if (resetToken) {
    return <ResetPasswordPage token={resetToken} onDone={handleResetDone} />;
  }
  if (checking) {
    return <p className="loading">Cargando...</p>;
  }
  if (!session) {
    return <LoginPage key={notice} onLogin={handleLogin} notice={notice} />;
  }
  if (session.user.role === 'CONDUCTOR') {
    return (
      <Suspense fallback={<p className="loading" role="status">Cargando módulo...</p>}>
        <DriverPanel user={session.user} onLogout={handleLogout} />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<p className="loading" role="status">Cargando módulo...</p>}>
      <App user={session.user} onLogout={handleLogout} />
    </Suspense>
  );
}

export default Root;
