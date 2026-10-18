import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api, request } from "../lib/api";
import type { User } from "../types";
type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("oj_user") || "null",
      ) as User | null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(
    Boolean(localStorage.getItem("oj_token")),
  );
  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem("oj_token")) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await request<User>(api.get("/auth/me"));
      setUser(me);
      localStorage.setItem("oj_user", JSON.stringify(me));
    } catch {
      setUser(null);
      localStorage.removeItem("oj_user");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);
  const login = useCallback(async (username: string, password: string) => {
    const data = await request<{ token: string; user: User }>(
      api.post("/auth/login", { username, password }),
    );
    localStorage.setItem("oj_token", data.token);
    localStorage.setItem("oj_user", JSON.stringify(data.user));
    setUser(data.user);
  }, []);
  const logout = useCallback(() => {
    localStorage.removeItem("oj_token");
    localStorage.removeItem("oj_user");
    setUser(null);
    window.location.href = "/login";
  }, []);
  const value = useMemo(
    () => ({ user, loading, login, logout, refreshUser }),
    [user, loading, login, logout, refreshUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
