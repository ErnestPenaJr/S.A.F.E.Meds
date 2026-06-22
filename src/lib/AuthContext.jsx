import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setAuthToken } from '@/api/client';
import { setCurrentUserId } from '@/api/session';

/*
  Auth abstraction. Today it runs in STUB MODE because the Neon Auth (Stack
  Auth) keys aren't configured yet — it signs in a local demo user so the whole
  app is usable. When you set VITE_STACK_PROJECT_ID (+ publishable key), wire the
  real Stack SDK inside this provider; nothing else in the app changes because
  everything consumes useAuth().

  ── Going live with Stack Auth (when keys arrive) ──────────────────────────
  1. npm i @stackframe/react
  2. Create a StackClientApp with the project id + publishable client key.
  3. Wrap children in <StackProvider app={...}><StackTheme>…; replace the stub
     state below with `const user = useUser();` and call app.signInWithOAuth /
     redirect for signIn, app.signOut() for signOut.
  4. On sign-in, pass the Stack access token to setAuthToken() so Netlify
     Functions can verify the session (already wired below).
*/
const AuthContext = createContext(null);

const STACK_CONFIGURED = Boolean(import.meta.env.VITE_STACK_PROJECT_ID);
const STUB_SESSION_KEY = 'safemeds_stub_session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // STUB MODE: restore a previously "signed in" demo session.
    if (!STACK_CONFIGURED) {
      try {
        const saved = localStorage.getItem(STUB_SESSION_KEY);
        if (saved) {
          const u = JSON.parse(saved);
          setUser(u);
          setAuthToken(`stub:${u.id}`);
          setCurrentUserId(u.id);
        }
      } catch {
        /* ignore */
      }
      setIsLoading(false);
      return;
    }
    // REAL MODE placeholder — Stack session hydration goes here.
    setIsLoading(false);
  }, []);

  const signIn = useCallback(async () => {
    // STUB MODE sign-in. Replace with Stack's sign-in flow in real mode.
    const demo = {
      id: 'demo-user',
      email: 'ernest@shieldlytics.com',
      fullName: 'Ernest (demo)',
      stub: true
    };
    setUser(demo);
    setAuthToken(`stub:${demo.id}`);
    setCurrentUserId(demo.id);
    try {
      localStorage.setItem(STUB_SESSION_KEY, JSON.stringify(demo));
    } catch {
      /* ignore */
    }
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setAuthToken(null);
    setCurrentUserId(null);
    try {
      localStorage.removeItem(STUB_SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        isStub: !STACK_CONFIGURED,
        signIn,
        signOut
      }}
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
