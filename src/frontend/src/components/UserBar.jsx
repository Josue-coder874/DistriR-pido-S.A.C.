import { ROLE_LABELS } from '../auth';

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function UserBar({ user, onLogout }) {
  return (
    <details className="user-menu">
      <summary role="button" className="user-menu-trigger" aria-label={`Opciones de usuario: ${user.name}`}>
        <span className="user-avatar" aria-hidden="true">{initials(user.name)}</span>
        <span className="user-menu-name">{user.name}</span>
        <span className="user-menu-chevron" aria-hidden="true" />
      </summary>
      <div className="user-menu-panel">
        <div className="user-menu-info">
          <strong>{user.name}</strong>
          <small>{ROLE_LABELS[user.role]}</small>
        </div>
        <button type="button" className="user-menu-logout" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </details>
  );
}

export default UserBar;
