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
  const anoFab = b.anoFabricacao ?? b.ano;
  const anoMod = b.anoModelo ?? b.ano;
  const required: Array<[string, any]> = [
    ["placa", b.placa], ["marca", b.marca], ["modelo", b.modelo],
    ["tipo", b.tipo], ["anoFabricacao", anoFab], ["anoModelo", anoMod],
    ["cor", b.cor], ["combustivel", b.combustivel],
    ["chassi", b.chassi], ["renavam", b.renavam], ["proprietario", b.proprietario],
  ];
  for (const [k, v] of required) {
    if (v === undefined || v === null || v === "") {
      return res.status(400).json({ error: "missing_field", field: k });
    }
  }
  const placaNorm = String(b.placa).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const rows = await sql`
    INSERT INTO veiculos (
      user_id, placa, marca, modelo, tipo, ano, ano_fabricacao, ano_modelo,
      cor, combustivel, chassi, renavam, proprietario, status, proxima_acao,
      ind_ipva, ind_licenc, ind_seguro
    ) VALUES (
      ${req.userId!}, ${placaNorm}, ${b.marca}, ${b.modelo}, ${b.tipo},
      ${Number(anoMod)}, ${Number(anoFab)}, ${Number(anoMod)},
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
