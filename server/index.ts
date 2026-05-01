import "dotenv/config";
import express from "express";
import cors from "cors";

import { authRouter }           from "./routes/auth";
import { veiculosRouter }       from "./routes/veiculos";
import { pendenciasRouter }     from "./routes/pendencias";
import { financeiroRouter }     from "./routes/financeiro";
import { transferenciasRouter } from "./routes/transferencias";
import { cofreRouter }          from "./routes/cofre";
import { proprietariosRouter }  from "./routes/proprietarios";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:8080";

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api", authRouter);
app.use("/api", veiculosRouter);
app.use("/api", pendenciasRouter);
app.use("/api", financeiroRouter);
app.use("/api", transferenciasRouter);
app.use("/api", cofreRouter);
app.use("/api", proprietariosRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[server error]", err);
  if (res.headersSent) return;
  res.status(500).json({ error: "internal_error", message: String(err?.message ?? err) });
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
