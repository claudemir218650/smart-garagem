import { Router } from "express";
import { sql } from "../db/client";
import { requireAuth, type AuthedRequest } from "../auth";
import { toTransferencia } from "../mappers";

export const transferenciasRouter = Router();
transferenciasRouter.use(requireAuth);

transferenciasRouter.get("/transferencias", async (req: AuthedRequest, res) => {
  const rows = await sql`
    SELECT t.* FROM transferencias t
    JOIN veiculos v ON v.id = t.veiculo_id
    WHERE v.user_id = ${req.userId!}
    ORDER BY t.inicio DESC
  ` as any[];
  res.json(rows.map(toTransferencia));
});

transferenciasRouter.post("/transferencias", async (req: AuthedRequest, res) => {
  const b = req.body ?? {};
  const required = ["veiculoId","deNome","deCpf","paraNome","paraCpf"];
  for (const k of required) {
    if (!b[k]) return res.status(400).json({ error: "missing_field", field: k });
  }
  // garante que o veículo é do usuário
  const owns = await sql`
    SELECT id FROM veiculos WHERE id = ${b.veiculoId} AND user_id = ${req.userId!} LIMIT 1
  ` as any[];
  if (!owns[0]) return res.status(403).json({ error: "veiculo_nao_pertence_ao_usuario" });

  const rows = await sql`
    INSERT INTO transferencias (veiculo_id, de_nome, de_cpf, para_nome, para_cpf, status)
    VALUES (${b.veiculoId}, ${b.deNome}, ${b.deCpf}, ${b.paraNome}, ${b.paraCpf}, ${b.status ?? "andamento"}::status_transferencia)
    RETURNING *
  ` as any[];
  res.status(201).json(toTransferencia(rows[0]));
});
