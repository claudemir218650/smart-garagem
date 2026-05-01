import { Router } from "express";
import { sql } from "../db/client";
import { requireAuth, type AuthedRequest } from "../auth";
import { toProprietario } from "../mappers";

export const proprietariosRouter = Router();

proprietariosRouter.use(requireAuth);

proprietariosRouter.get("/proprietarios", async (req: AuthedRequest, res) => {
  const q = String(req.query.q ?? "").trim();
  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  let rows: any[];
  if (q) {
    const like = `%${q}%`;
    rows = await sql`
      SELECT * FROM proprietarios
      WHERE user_id = ${req.userId!}
        AND (
          COALESCE(nome_completo, '') ILIKE ${like}
          OR COALESCE(razao_social, '') ILIKE ${like}
          OR COALESCE(nome_fantasia, '') ILIKE ${like}
          OR COALESCE(cpf, '') ILIKE ${like}
          OR COALESCE(cnpj, '') ILIKE ${like}
        )
      ORDER BY created_at DESC
      LIMIT ${limit}
    ` as any[];
  } else {
    rows = await sql`
      SELECT * FROM proprietarios
      WHERE user_id = ${req.userId!}
      ORDER BY created_at DESC
      LIMIT ${limit}
    ` as any[];
  }
  res.json(rows.map(toProprietario));
});

proprietariosRouter.post("/proprietarios", async (req: AuthedRequest, res) => {
  const b = req.body ?? {};
  if (b.tipoPessoa !== "PF" && b.tipoPessoa !== "PJ") {
    return res.status(400).json({ error: "invalid_tipoPessoa" });
  }
  const e = b.endereco ?? {};
  const required = ["cep", "logradouro", "numero", "bairro", "cidade", "uf"];
  for (const k of required) {
    if (!e[k]) return res.status(400).json({ error: "missing_field", field: `endereco.${k}` });
  }
  if (b.tipoPessoa === "PF") {
    if (!b.nomeCompleto || !b.cpf || !b.dataNascimento) {
      return res.status(400).json({ error: "missing_pf_fields" });
    }
  } else {
    if (!b.razaoSocial || !b.cnpj) {
      return res.status(400).json({ error: "missing_pj_fields" });
    }
  }
  const rows = await sql`
    INSERT INTO proprietarios (
      user_id, tipo_pessoa, nome_completo, cpf, data_nascimento,
      razao_social, nome_fantasia, cnpj, email, telefone,
      cep, logradouro, numero, complemento, bairro, cidade, uf
    ) VALUES (
      ${req.userId!}, ${b.tipoPessoa}::tipo_pessoa,
      ${b.nomeCompleto ?? null}, ${b.cpf ?? null}, ${b.dataNascimento ?? null},
      ${b.razaoSocial ?? null}, ${b.nomeFantasia ?? null}, ${b.cnpj ?? null},
      ${b.email ?? null}, ${b.telefone ?? null},
      ${e.cep}, ${e.logradouro}, ${e.numero}, ${e.complemento ?? null},
      ${e.bairro}, ${e.cidade}, ${e.uf}
    )
    RETURNING *
  ` as any[];
  res.status(201).json(toProprietario(rows[0]));
});

proprietariosRouter.delete("/proprietarios/:id", async (req: AuthedRequest, res) => {
  const rows = await sql`
    DELETE FROM proprietarios WHERE id = ${req.params.id} AND user_id = ${req.userId!} RETURNING id
  ` as any[];
  if (!rows[0]) return res.status(404).json({ error: "not_found" });
  res.json({ ok: true });
});
