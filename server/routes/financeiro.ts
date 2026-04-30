import { Router } from "express";
import { sql } from "../db/client";
import { requireAuth, type AuthedRequest } from "../auth";
import { toIpva, toLicenciamento, toSeguro } from "../mappers";

export const financeiroRouter = Router();
financeiroRouter.use(requireAuth);

financeiroRouter.get("/ipvas", async (req: AuthedRequest, res) => {
  const rows = await sql`
    SELECT i.* FROM ipvas i
    JOIN veiculos v ON v.id = i.veiculo_id
    WHERE v.user_id = ${req.userId!}
    ORDER BY i.vencimento ASC
  ` as any[];
  res.json(rows.map(toIpva));
});

financeiroRouter.get("/licenciamentos", async (req: AuthedRequest, res) => {
  const rows = await sql`
    SELECT l.* FROM licenciamentos l
    JOIN veiculos v ON v.id = l.veiculo_id
    WHERE v.user_id = ${req.userId!}
    ORDER BY l.vencimento ASC
  ` as any[];
  res.json(rows.map(toLicenciamento));
});

financeiroRouter.get("/seguros", async (req: AuthedRequest, res) => {
  const rows = await sql`
    SELECT s.* FROM seguros s
    JOIN veiculos v ON v.id = s.veiculo_id
    WHERE v.user_id = ${req.userId!}
    ORDER BY s.fim ASC
  ` as any[];
  res.json(rows.map(toSeguro));
});
