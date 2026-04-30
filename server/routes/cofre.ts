import { Router } from "express";
import bcrypt from "bcryptjs";
import { sql } from "../db/client";
import {
  requireAuth, requireVault, signVaultToken, VAULT_TTL_SECONDS, type AuthedRequest,
} from "../auth";
import { toCredencial } from "../mappers";

export const cofreRouter = Router();
cofreRouter.use(requireAuth);

cofreRouter.get("/vault/status", async (req: AuthedRequest, res) => {
  const rows = await sql`
    SELECT user_id FROM vault_master WHERE user_id = ${req.userId!} LIMIT 1
  ` as any[];
  res.json({ initialized: rows.length > 0 });
});

cofreRouter.post("/vault/setup", async (req: AuthedRequest, res) => {
  const master = (req.body?.master as string | undefined) ?? "";
  if (master.length < 6) return res.status(400).json({ error: "master_too_short" });
  const hash = await bcrypt.hash(master, 10);
  await sql`
    INSERT INTO vault_master (user_id, password_hash) VALUES (${req.userId!}, ${hash})
    ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `;
  res.json({ ok: true });
});

cofreRouter.post("/vault/unlock", async (req: AuthedRequest, res) => {
  const master = (req.body?.master as string | undefined) ?? "";
  const rows = await sql`
    SELECT password_hash FROM vault_master WHERE user_id = ${req.userId!} LIMIT 1
  ` as any[];
  if (!rows[0]) return res.json({ ok: false, reason: "not-initialized" });
  const ok = await bcrypt.compare(master, rows[0].password_hash);
  if (!ok) return res.json({ ok: false, reason: "invalid" });
  const token = signVaultToken(req.userId!);
  res.json({ ok: true, token, expiresIn: VAULT_TTL_SECONDS });
});

cofreRouter.get("/credenciais", requireVault, async (req: AuthedRequest, res) => {
  const rows = await sql`
    SELECT * FROM credenciais WHERE user_id = ${req.userId!} ORDER BY created_at DESC
  ` as any[];
  res.json(rows.map(toCredencial));
});

cofreRouter.post("/credenciais", requireVault, async (req: AuthedRequest, res) => {
  const b = req.body ?? {};
  if (!b.label || !b.cpf) return res.status(400).json({ error: "missing_field" });
  const rows = await sql`
    INSERT INTO credenciais (user_id, label, cpf, ultimo_uso)
    VALUES (${req.userId!}, ${b.label}, ${b.cpf}, ${b.ultimoUso ?? null})
    RETURNING *
  ` as any[];
  res.status(201).json(toCredencial(rows[0]));
});

cofreRouter.delete("/credenciais/:id", requireVault, async (req: AuthedRequest, res) => {
  const rows = await sql`
    DELETE FROM credenciais WHERE id = ${req.params.id} AND user_id = ${req.userId!} RETURNING id
  ` as any[];
  if (!rows[0]) return res.status(404).json({ error: "not_found" });
  res.json({ ok: true });
});
