import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, auth } from "@/lib/api";
import type { User } from "@/types";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  loginWithToken: (token: string, user: User) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth.isAuthed()) {
      api.me().then((u) => setUser(u)).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithToken = (token: string, u: User) => {
    auth.setToken(token); setUser(u);
  };
  const logout = () => { auth.clear(); setUser(null); };

  return <Ctx.Provider value={{ user, loading, loginWithToken, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
};