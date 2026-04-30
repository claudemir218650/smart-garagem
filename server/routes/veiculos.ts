import { Router } from "express";
import { sql } from "../db/client";
import { requireAuth, type AuthedRequest } from "../auth";
import { toVeiculo } from "../mappers";

export const veiculosRouter = Router();

veiculosRouter.use(requireAuth);

veiculosRouter.get("/veiculos", async (req: AuthedRequest, res) => {
  const rows = await sql`
    SELECT * FROM veiculos WHERE user_id = ${req.userId!} ORDER BY created_at DESC
  ` as any[];
  res.json(rows.map(toVeiculo));
});

veiculosRouter.get("/veiculos/:id", async (req: AuthedRequest, res) => {
  const rows = await sql`
    SELECT * FROM veiculos WHERE id = ${req.params.id} AND user_id = ${req.userId!} LIMIT 1
  ` as any[];
  if (!rows[0]) return res.status(404).json({ error: "not_found" });
  res.json(toVeiculo(rows[0]));
});

veiculosRouter.post("/veiculos", async (req: AuthedRequest, res) => {
  const b = req.body ?? {};
  const required = ["placa","marca","modelo","ano","cor","combustivel","chassi","renavam","proprietario"];
  for (const k of required) {
    if (b[k] === undefined || b[k] === null || b[k] === "") {
      return res.status(400).json({ error: "missing_field", field: k });
    }
  }
  const placaNorm = String(b.placa).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const rows = await sql`
    INSERT INTO veiculos (
      user_id, placa, marca, modelo, ano, cor, combustivel,
      chassi, renavam, proprietario, status, proxima_acao,
      ind_ipva, ind_licenc, ind_seguro
    ) VALUES (
      ${req.userId!}, ${placaNorm}, ${b.marca}, ${b.modelo}, ${Number(b.ano)},
      ${b.cor}, ${b.combustivel}, ${b.chassi}, ${b.renavam}, ${b.proprietario},
      ${b.status ?? "ok"}::status_geral, ${b.proximaAcao ?? ""},
      ${b.indicadores?.ipva ?? "ok"}::status_geral,
      ${b.indicadores?.licenciamento ?? "ok"}::status_geral,
      ${b.indicadores?.seguro ?? "ok"}::status_geral
    )
    RETURNING *
  ` as any[];
  res.status(201).json(toVeiculo(rows[0]));
});

veiculosRouter.delete("/veiculos/:id", async (req: AuthedRequest, res) => {
  const rows = await sql`
    DELETE FROM veiculos WHERE id = ${req.params.id} AND user_id = ${req.userId!} RETURNING id
  ` as any[];
  if (!rows[0]) return res.status(404).json({ error: "not_found" });
  res.json({ ok: true });
});
