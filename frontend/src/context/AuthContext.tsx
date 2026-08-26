import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthAPI } from "../api/resources";
import { apiErrorMessage } from "../api/client";
import type { AuthUser } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem("clinic_user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("clinic_token");
    if (!token) {
      setLoading(false);
      return;
    }
    AuthAPI.me()
      .then((res) => {
        setUser(res.data);
        localStorage.setItem("clinic_user", JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem("clinic_token");
        localStorage.removeItem("clinic_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function persist(token: string, user: AuthUser) {
    localStorage.setItem("clinic_token", token);
    localStorage.setItem("clinic_user", JSON.stringify(user));
    setUser(user);
  }

  async function login(email: string, password: string) {
    try {
      const res = await AuthAPI.login(email, password);
      persist(res.data.token, res.data.user);
    } catch (err) {
      throw new Error(apiErrorMessage(err));
    }
  }

  async function register(name: string, email: string, password: string) {
    try {
      const res = await AuthAPI.register({ name, email, password });
      persist(res.data.token, res.data.user);
    } catch (err) {
      throw new Error(apiErrorMessage(err));
    }
  }

  function logout() {
    localStorage.removeItem("clinic_token");
    localStorage.removeItem("clinic_user");
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
