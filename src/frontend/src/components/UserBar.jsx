import { ROLE_LABELS } from '../auth';

function UserBar({ user, onLogout }) {
  return (
    <div className="user-bar">
      <div>
        <strong>{user.name}</strong>
        <small>{ROLE_LABELS[user.role]}</small>
      </div>
      <button type="button" className="link-btn" onClick={onLogout}>
        Cerrar sesión
      </button>
    </div>
  );
}

export default UserBar;
