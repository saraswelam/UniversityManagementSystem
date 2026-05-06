import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/api.js";
import { clearAuthToken, clearLegacyStoredUser, getAuthToken, setAuthToken } from "./authStorage.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAuthToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    clearLegacyStoredUser();
    let isMounted = true;

    async function loadCurrentUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const currentUser = await authApi.me();
        if (isMounted) setUser(currentUser);
      } catch {
        clearAuthToken();
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const value = useMemo(() => ({
    token,
    user,
    loading,
    isAuthenticated: Boolean(token && user),
    login(authResponse) {
      setAuthToken(authResponse.token);
      setToken(authResponse.token);
      setUser(authResponse.user);
    },
    logout() {
      clearAuthToken();
      setToken(null);
      setUser(null);
    },
  }), [loading, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
