import {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import api, {
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  SESSION_TOKEN_KEY,
  USER_KEY,
} from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on first render and confirm the token is still valid.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      const storedUser = localStorage.getItem(USER_KEY);
      const token = localStorage.getItem(TOKEN_KEY);

      if (!storedUser || !token) {
        setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(storedUser);
        const { data } = await api.get("/auth/me");
        if (cancelled) return;
        // The server is authoritative on role and activation status.
        setUser({ ...parsed, ...data });
      } catch {
        for (const key of [
          TOKEN_KEY,
          REFRESH_TOKEN_KEY,
          SESSION_TOKEN_KEY,
          USER_KEY,
        ]) {
          localStorage.removeItem(key);
        }
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Accepts either a username or an email address as `identifier`, matching
   * the backend's dual-identifier login.
   */
  const login = useCallback(async (identifier, password) => {
    const { data } = await api.post("/auth/login", {
      username: identifier,
      password,
    });

    localStorage.setItem(TOKEN_KEY, data.accessToken);
    if (data.refreshToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    if (data.sessionToken)
      localStorage.setItem(SESSION_TOKEN_KEY, data.sessionToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await api.post("/auth/register", formData);

    localStorage.setItem(TOKEN_KEY, data.accessToken);
    if (data.refreshToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    if (data.sessionToken)
      localStorage.setItem(SESSION_TOKEN_KEY, data.sessionToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // The local session is cleared regardless of what the server reports.
    }
    for (const key of [
      TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      SESSION_TOKEN_KEY,
      USER_KEY,
    ]) {
      localStorage.removeItem(key);
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      role: user?.role ?? null,
      hasRole: (...roles) => !!user && roles.includes(user.role),
    }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
};
