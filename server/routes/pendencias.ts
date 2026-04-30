import { Router } from "express";
import { sql } from "../db/client";
import { requireAuth, type AuthedRequest } from "../auth";
import { toPendencia } from "../mappers";

export const pendenciasRouter = Router();

pendenciasRouter.use(requireAuth);

pendenciasRouter.get("/pendencias", async (req: AuthedRequest, res) => {
  const rows = await sql`
    SELECT p.* FROM pendencias p
    JOIN veiculos v ON v.id = p.veiculo_id
    WHERE v.user_id = ${req.userId!}
    ORDER BY p.prazo ASC
  ` as any[];
  res.json(rows.map(toPendencia));
});

pendenciasRouter.get("/veiculos/:id/pendencias", async (req: AuthedRequest, res) => {
  const rows = await sql`
    SELECT p.* FROM pendencias p
    JOIN veiculos v ON v.id = p.veiculo_id
    WHERE p.veiculo_id = ${req.params.id} AND v.user_id = ${req.userId!}
    ORDER BY p.prazo ASC
  ` as any[];
  res.json(rows.map(toPendencia));
});
