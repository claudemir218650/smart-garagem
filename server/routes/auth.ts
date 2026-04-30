import { Router } from "express";
import { sql } from "../db/client";
import { signToken, requireAuth, type AuthedRequest } from "../auth";
import { toUser } from "../mappers";

export const authRouter = Router();

// Magic link mock — em produção: enviar e-mail. Aqui apenas confirma recebimento.
authRouter.post("/auth/magic-link", async (req, res) => {
  const { email } = req.body ?? {};
  if (typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "invalid_email" });
  }
  res.json({ ok: true, email });
});

// Em produção esse token viria por e-mail. Aqui qualquer token vira sessão para o e-mail demo,
// ou cria/lê o usuário por e-mail se passado em ?email=.
authRouter.post("/auth/verify", async (req, res) => {
  const email = (req.body?.email as string | undefined) ?? "joao.silva@email.com";
  const nome  = (req.body?.nome  as string | undefined) ?? "João Silva";

  const rows = await sql`SELECT id, email, nome FROM users WHERE email = ${email} LIMIT 1` as any[];
  let user = rows[0];
  if (!user) {
    const inserted = await sql`
      INSERT INTO users (email, nome) VALUES (${email}, ${nome})
      RETURNING id, email, nome
    ` as any[];
    user = inserted[0];
  }

  const token = signToken(user.id);
  res.json({ token, user: toUser(user) });
});

authRouter.get("/auth/me", requireAuth, async (req: AuthedRequest, res) => {
  const rows = await sql`SELECT id, email, nome FROM users WHERE id = ${req.userId} LIMIT 1` as any[];
  if (!rows[0]) return res.status(404).json({ error: "user_not_found" });
  res.json(toUser(rows[0]));
});
