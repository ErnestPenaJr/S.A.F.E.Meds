import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setAuthToken } from '@/api/client';
import { setCurrentUserId } from '@/api/session';
import { USE_API } from '@/api/runtime';

/*
  Built-in email/password auth.
  - Live backend (USE_API): sign up / sign in hit /api/auth/* (scrypt + JWT);
    the token is stored and sent as Bearer on every request.
  - Demo mode (no backend): one-tap "demo" session so the local app stays usable.
*/
const AuthContext = createContext(null);

const TOKEN_KEY = 'safemeds_token';
const USER_KEY = 'safemeds_user';
const STUB_KEY = 'safemeds_stub_session';

const toClientUser = (u) => ({ id: u.id, email: u.email, fullName: u.full_name ?? u.fullName ?? null });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const persist = useCallback((token, rawUser) => {
    const u = toClientUser(rawUser);
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } catch {
      /* ignore */
    }
    setAuthToken(token);
    setCurrentUserId(u.id);
    setUser(u);
    return u;
  }, []);

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(STUB_KEY);
    } catch {
      /* ignore */
    }
    setAuthToken(null);
    setCurrentUserId(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (USE_API) {
        try {
          const token = localStorage.getItem(TOKEN_KEY);
          const cached = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
          if (token && cached) {
            setAuthToken(token);
            setCurrentUserId(cached.id);
            setUser(cached);
            try {
              const { user: fresh } = await api.get('/auth/me');
              if (active && fresh) persist(token, fresh);
            } catch {
              if (active) clearSession();
            }
          }
        } catch {
          /* ignore */
        }
      } else {
        try {
          const s = JSON.parse(localStorage.getItem(STUB_KEY) || 'null');
          if (s) {
            setUser(s);
            setAuthToken(`stub:${s.id}`);
            setCurrentUserId(s.id);
          }
        } catch {
          /* ignore */
        }
      }
      if (active) setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [persist, clearSession]);

  const signUp = useCallback(
    async ({ email, password, fullName }) => {
      const { token, user: u } = await api.post('/auth/signup', { email, password, full_name: fullName });
      return persist(token, u);
    },
    [persist]
  );

  const signIn = useCallback(
    async ({ email, password }) => {
      const { token, user: u } = await api.post('/auth/login', { email, password });
      return persist(token, u);
    },
    [persist]
  );

  const signInDemo = useCallback(async () => {
    const demo = { id: 'demo-user', email: 'demo@safemeds.app', fullName: 'Demo User' };
    setUser(demo);
    setAuthToken('stub:demo-user');
    setCurrentUserId('demo-user');
    try {
      localStorage.setItem(STUB_KEY, JSON.stringify(demo));
    } catch {
      /* ignore */
    }
  }, []);

  const signOut = useCallback(async () => {
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: Boolean(user), useApi: USE_API, signUp, signIn, signInDemo, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
