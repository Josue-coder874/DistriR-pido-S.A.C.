import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  can,
  clearSession,
  loadSession,
  notifySessionExpired,
  onSessionExpired,
  saveSession,
} from './auth';

const STORAGE_KEY = 'ecologistica.session';

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe('session storage', () => {
  it('returns null for missing, malformed, or incomplete session data', () => {
    expect(loadSession()).toBeNull();

    sessionStorage.setItem(STORAGE_KEY, '{invalid json');
    expect(loadSession()).toBeNull();

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: 'token-only' }));
    expect(loadSession()).toBeNull();
  });

  it('saves and loads a complete session, then clears it', () => {
    const session = { token: 'token-1', user: { id: 1 } };

    saveSession(session);
    expect(loadSession()).toEqual(session);

    clearSession();
    expect(loadSession()).toBeNull();
  });

  it('handles unavailable browser storage without throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });

    expect(loadSession()).toBeNull();
    expect(() => saveSession({ token: 'token', user: {} })).not.toThrow();
    expect(() => clearSession()).not.toThrow();
  });
});

describe('session expiry listeners and permissions', () => {
  it('clears the session, notifies listeners, and supports unsubscribing', () => {
    saveSession({ token: 'token-1', user: { id: 1 } });
    const listener = vi.fn();
    const unsubscribe = onSessionExpired(listener);

    notifySessionExpired();
    unsubscribe();
    notifySessionExpired();

    expect(listener).toHaveBeenCalledOnce();
    expect(loadSession()).toBeNull();
  });

  it('grants only declared permissions to matching roles', () => {
    expect(can({ role: 'ADMINISTRADOR' }, 'fleet:write')).toBe(true);
    expect(can({ role: 'DESPACHADOR' }, 'customers:write')).toBe(true);
    expect(can({ role: 'AUDITOR' }, 'customers:write')).toBe(false);
    expect(can(null, 'customers:write')).toBe(false);
    expect(can({ role: 'ADMINISTRADOR' }, 'unknown:permission')).toBe(false);
  });
});
