import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, auth } from "@/lib/api";
import type { User } from "@/types";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  loginWithToken: (token: string, u: User) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

const DEFAULT_EMAIL = "local@garagem.app";
const DEFAULT_NOME  = "Usuário Local";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        if (auth.isAuthed()) {
          const u = await api.me();
          if (!cancelled) setUser(u);
        } else {
          const { token, user: u } = await api.verifyToken("local", DEFAULT_EMAIL, DEFAULT_NOME);
          if (cancelled) return;
          auth.setToken(token);
          setUser(u);
        }
      } catch {
        auth.clear();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  const loginWithToken = (token: string, u: User) => { auth.setToken(token); setUser(u); };
  const logout = () => { auth.clear(); setUser(null); };

  return <Ctx.Provider value={{ user, loading, loginWithToken, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
};