import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import api from '../services/api';

/* ─── Context ──────────────────────────────────────────── */
const AuthContext = createContext(null);

/* ─── Provider ─────────────────────────────────────────── */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true = still checking session

  /* ── fetchMe ─────────────────────────────────────────
     Called once on app mount. Hits GET /api/auth/me with
     the HttpOnly cookie the browser already holds.
     If the cookie is valid → server returns the user object.
     If not → 401, we silently stay logged-out.
  ─────────────────────────────────────────────────────── */
  const fetchMe = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      const userData = response.data?.data?.user || response.data?.user || response.data;
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run once on mount to restore session from cookie
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  /* ── login ────────────────────────────────────────────
     POST /api/auth/login → server sets HttpOnly cookie.
     We then call fetchMe() to populate the user state.
  ─────────────────────────────────────────────────────── */
  const login = useCallback(async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const userData = response.data?.data?.user || response.data?.user;
    setUser(userData || null);
    if (!userData) await fetchMe();
    return response.data;
  }, [fetchMe]);

  /* ── register ─────────────────────────────────────────
     POST /api/auth/register → server sets HttpOnly cookie.
  ─────────────────────────────────────────────────────── */
  const register = useCallback(async (name, username, email, password) => {
    const response = await api.post('/auth/register', { name, username, email, password });
    const userData = response.data?.data?.user || response.data?.user;
    setUser(userData || null);
    if (!userData) await fetchMe();
    return response.data;
  }, [fetchMe]);

  /* ── logout ───────────────────────────────────────────
     POST /api/auth/logout → server clears the cookie.
  ─────────────────────────────────────────────────────── */
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if request fails, clear local state
    } finally {
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    fetchMe,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/* ─── Hook ─────────────────────────────────────────────── */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
};

export default AuthContext;
