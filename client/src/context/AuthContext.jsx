import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../api/axiosInstance";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      }
    } catch (err) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for forced logout fired by axiosInstance
  // when refresh token is also expired
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener("auth:logout", handleForceLogout);
    return () => window.removeEventListener("auth:logout", handleForceLogout);
  }, []);

  const login = useCallback((userData, accessToken) => {
    const userToStore = {
      id: userData.id,
      fullName: userData.fullName,
      email: userData.email,
    };
    setUser(userToStore);
    setToken(accessToken);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("user", JSON.stringify(userToStore));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // best-effort — clear local state regardless
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. Custom Event listener        - `window.addEventListener('auth:logout', ...)` listens
                                    for the event fired by axiosInstance when refresh fails.
                                    This is the bridge between a non-React file (axios) and
                                    React state. You can't import useAuth into axiosInstance
                                    because it's outside the component tree.
  2. Cleanup on unmount           - The useEffect returns a cleanup function that removes
                                    the event listener. Without this, every re-render of
                                    AuthProvider adds another listener — memory leak.
  3. State clear on force logout  - Only clears user and token state. localStorage was
                                    already cleared by axiosInstance before firing the event.
                                    ProtectedRoute sees isAuthenticated=false and redirects
                                    to /login automatically — no navigate() needed here.
  4. Two useEffects               - One for initial hydration from localStorage (runs once).
                                    One for the event listener (runs once, cleans up on unmount).
                                    Separate concerns — each effect does one job.
*/
