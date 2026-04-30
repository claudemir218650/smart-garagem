import { mockApi } from "./mock-api";

const TOKEN_KEY = "garagem.token";
const VAULT_KEY = "garagem.vault.token";
const VAULT_EXP_KEY = "garagem.vault.expires";

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

// Future: real HTTP client using import.meta.env.VITE_API_URL.
// For now, export the mock as the active API.
export const api = mockApi;