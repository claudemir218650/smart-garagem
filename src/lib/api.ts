import type {
  Veiculo, Pendencia, IPVA, Licenciamento, Seguro, Transferencia, Credencial, User,
} from "@/types";

const TOKEN_KEY = "garagem.token";
const VAULT_KEY = "garagem.vault.token";
const VAULT_EXP_KEY = "garagem.vault.expires";

const BASE = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
  isAuthed: () => !!localStorage.getItem(TOKEN_KEY),
};

export const vault = {
  getToken: () => sessionStorage.getItem(VAULT_KEY),
  getExpires: () => Number(sessionStorage.getItem(VAULT_EXP_KEY) || 0),
  set: (token: string, expiresInSec: number) => {
    sessionStorage.setItem(VAULT_KEY, token);
    sessionStorage.setItem(VAULT_EXP_KEY, String(Date.now() + expiresInSec * 1000));
  },
  clear: () => {
    sessionStorage.removeItem(VAULT_KEY);
    sessionStorage.removeItem(VAULT_EXP_KEY);
  },
  isUnlocked: () => {
    const t = sessionStorage.getItem(VAULT_KEY);
    const e = Number(sessionStorage.getItem(VAULT_EXP_KEY) || 0);
    return !!t && Date.now() < e;
  },
};

class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(path: string, init: RequestInit = {}, opts: { vault?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  const tok = auth.getToken();
  if (tok) headers["Authorization"] = `Bearer ${tok}`;
  if (opts.vault) {
    const v = vault.getToken();
    if (v) headers["X-Vault-Token"] = v;
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg = (data && typeof data === "object" && "error" in (data as any))
      ? String((data as any).error)
      : `HTTP ${res.status}`;
    if (res.status === 401) auth.clear();
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

function safeJson(text: string) {
  try { return JSON.parse(text); } catch { return text; }
}

export const api = {
  // auth
  async sendMagicLink(email: string) {
    return request<{ ok: true; email: string }>("/auth/magic-link", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  async verifyToken(_token: string, email?: string, nome?: string) {
    return request<{ token: string; user: User }>("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ email, nome }),
    });
  },
  async me() {
    return request<User>("/auth/me");
  },

  // veiculos
  async listVeiculos() {
    return request<Veiculo[]>("/veiculos");
  },
  async getVeiculo(id: string) {
    try {
      return await request<Veiculo>(`/veiculos/${id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },
  async createVeiculo(input: Partial<Veiculo>) {
    return request<Veiculo>("/veiculos", { method: "POST", body: JSON.stringify(input) });
  },
  async deleteVeiculo(id: string) {
    return request<{ ok: true }>(`/veiculos/${id}`, { method: "DELETE" });
  },

  // pendencias
  async listPendencias() {
    return request<Pendencia[]>("/pendencias");
  },
  async listPendenciasByVeiculo(id: string) {
    return request<Pendencia[]>(`/veiculos/${id}/pendencias`);
  },

  // financeiro
  async listIpvas() {
    return request<IPVA[]>("/ipvas");
  },
  async listLicenciamentos() {
    return request<Licenciamento[]>("/licenciamentos");
  },
  async listSeguros() {
    return request<Seguro[]>("/seguros");
  },

  // transferencias
  async listTransferencias() {
    return request<Transferencia[]>("/transferencias");
  },
  async createTransferencia(input: Partial<Transferencia>) {
    return request<Transferencia>("/transferencias", { method: "POST", body: JSON.stringify(input) });
  },

  // cofre
  async vaultStatus() {
    return request<{ initialized: boolean }>("/vault/status");
  },
  async vaultSetup(master: string) {
    return request<{ ok: true }>("/vault/setup", { method: "POST", body: JSON.stringify({ master }) });
  },
  async vaultUnlock(master: string) {
    return request<
      | { ok: true; token: string; expiresIn: number }
      | { ok: false; reason: "not-initialized" | "invalid" }
    >("/vault/unlock", { method: "POST", body: JSON.stringify({ master }) });
  },
  async listCredenciais() {
    return request<Credencial[]>("/credenciais", {}, { vault: true });
  },
  async addCredencial(c: Omit<Credencial, "id">) {
    return request<Credencial>("/credenciais", {
      method: "POST",
      body: JSON.stringify(c),
    }, { vault: true });
  },
  async removeCredencial(id: string) {
    return request<{ ok: true }>(`/credenciais/${id}`, { method: "DELETE" }, { vault: true });
  },
};

export { ApiError };
