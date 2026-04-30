import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const SECRET = process.env.JWT_SECRET || "dev-secret";
const TTL = 60 * 60 * 24 * 7; // 7 dias

export interface AuthedRequest extends Request {
  userId?: string;
}

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: TTL });
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing_token" });
  try {
    const payload = jwt.verify(token, SECRET) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "invalid_token" });
  }
}

const VAULT_TTL = 30 * 60;
const VAULT_SECRET = SECRET + ":vault";

export function signVaultToken(userId: string) {
  return jwt.sign({ sub: userId, scope: "vault" }, VAULT_SECRET, { expiresIn: VAULT_TTL });
}

export function requireVault(req: AuthedRequest, res: Response, next: NextFunction) {
  const tok = (req.headers["x-vault-token"] as string) || "";
  if (!tok) return res.status(403).json({ error: "vault_locked" });
  try {
    const p = jwt.verify(tok, VAULT_SECRET) as { sub: string; scope: string };
    if (p.scope !== "vault" || p.sub !== req.userId) return res.status(403).json({ error: "vault_invalid" });
    next();
  } catch {
    res.status(403).json({ error: "vault_invalid" });
  }
}

export const VAULT_TTL_SECONDS = VAULT_TTL;
