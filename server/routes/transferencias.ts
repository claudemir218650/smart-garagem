import { Router } from "express";
import { sql } from "../db/client";
import { requireAuth, type AuthedRequest } from "../auth";
import { toTransferencia, toEtapa } from "../mappers";
import { etapasParaFluxo, type Fluxo } from "../regras/sp";

export const transferenciasRouter = Router();
transferenciasRouter.use(requireAuth);

async function carregarComEtapas(transferenciaId: string) {
  const [t] = await sql`
    SELECT * FROM transferencias WHERE id = ${transferenciaId} LIMIT 1
  ` as any[];
  if (!t) return null;
  const etapas = await sql`
    SELECT * FROM transferencia_etapas
    WHERE transferencia_id = ${transferenciaId}
    ORDER BY ordem ASC
  ` as any[];
  const defs = etapasParaFluxo(t.uf ?? "SP", (t.fluxo as Fluxo) ?? "tradicional");
  const linksByCodigo = Object.fromEntries(defs.map((d) => [d.codigo, d.links ?? []]));
  const enriched = etapas.map(toEtapa).map((e) => ({ ...e, links: linksByCodigo[e.codigo] ?? [] }));
  return { ...toTransferencia(t), etapas: enriched };
}

transferenciasRouter.get("/transferencias", async (req: AuthedRequest, res) => {
  const rows = await sql`
    SELECT t.* FROM transferencias t
    JOIN veiculos v ON v.id = t.veiculo_id
    WHERE v.user_id = ${req.userId!}
    ORDER BY t.inicio DESC
  ` as any[];
  res.json(rows.map(toTransferencia));
});

transferenciasRouter.get("/transferencias/:id", async (req: AuthedRequest, res) => {
  const owns = await sql`
    SELECT t.id FROM transferencias t
    JOIN veiculos v ON v.id = t.veiculo_id
    WHERE t.id = ${req.params.id} AND v.user_id = ${req.userId!}
    LIMIT 1
  ` as any[];
  if (!owns[0]) return res.status(404).json({ error: "not_found" });
  const data = await carregarComEtapas(req.params.id);
  res.json(data);
});

transferenciasRouter.post("/transferencias", async (req: AuthedRequest, res) => {
  const b = req.body ?? {};
  const fluxo: Fluxo = b.fluxo === "tdv" ? "tdv" : "tradicional";
  const uf = String(b.uf ?? "SP").toUpperCase();
  const required = ["veiculoId", "deNome", "paraNome"];
  for (const k of required) {
    if (!b[k]) return res.status(400).json({ error: "missing_field", field: k });
  }
  if (!b.deCpf && !b.deCnpj) return res.status(400).json({ error: "missing_field", field: "deCpf|deCnpj" });
  if (!b.paraCpf && !b.paraCnpj) return res.status(400).json({ error: "missing_field", field: "paraCpf|paraCnpj" });

  const owns = await sql`
    SELECT id FROM veiculos WHERE id = ${b.veiculoId} AND user_id = ${req.userId!} LIMIT 1
  ` as any[];
  if (!owns[0]) return res.status(403).json({ error: "veiculo_nao_pertence_ao_usuario" });

  const rows = await sql`
    INSERT INTO transferencias (
      veiculo_id, de_nome, de_cpf, de_cnpj, para_nome, para_cpf, para_cnpj,
      status, fluxo, uf, observacoes
    )
    VALUES (
      ${b.veiculoId}, ${b.deNome}, ${b.deCpf ?? ""}, ${b.deCnpj ?? null},
      ${b.paraNome}, ${b.paraCpf ?? ""}, ${b.paraCnpj ?? null},
      ${(b.status ?? "andamento")}::status_transferencia,
      ${fluxo}, ${uf}, ${b.observacoes ?? null}
    )
    RETURNING *
  ` as any[];
  const transferencia = rows[0];

  const etapas = etapasParaFluxo(uf, fluxo);
  for (let i = 0; i < etapas.length; i++) {
    const e = etapas[i];
    await sql`
      INSERT INTO transferencia_etapas (transferencia_id, codigo, ordem, titulo, descricao)
      VALUES (${transferencia.id}, ${e.codigo}, ${i + 1}, ${e.titulo}, ${e.descricao})
    `;
  }

  const data = await carregarComEtapas(transferencia.id);
  res.status(201).json(data);
});

transferenciasRouter.patch("/transferencias/:id/etapas/:codigo", async (req: AuthedRequest, res) => {
  const { id, codigo } = req.params;
  const b = req.body ?? {};

  const owns = await sql`
    SELECT t.id, t.veiculo_id, t.fluxo, t.uf FROM transferencias t
    JOIN veiculos v ON v.id = t.veiculo_id
    WHERE t.id = ${id} AND v.user_id = ${req.userId!}
    LIMIT 1
  ` as any[];
  const transf = owns[0];
  if (!transf) return res.status(404).json({ error: "not_found" });

  const status = b.status as string | undefined;
  const updates: Record<string, any> = {};
  if (status) updates.status = status;
  if (b.observacao !== undefined) updates.observacao = b.observacao;
  if (b.anexoUrl !== undefined) updates.anexo_url = b.anexoUrl;
  if (status === "concluida") updates.concluida_em = new Date().toISOString();

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "no_changes" });
  }

  const rows = await sql`
    UPDATE transferencia_etapas
    SET status = COALESCE(${updates.status ?? null}, status),
        observacao = COALESCE(${updates.observacao ?? null}, observacao),
        anexo_url = COALESCE(${updates.anexo_url ?? null}, anexo_url),
        concluida_em = COALESCE(${updates.concluida_em ?? null}, concluida_em)
    WHERE transferencia_id = ${id} AND codigo = ${codigo}
    RETURNING *
  ` as any[];
  if (!rows[0]) return res.status(404).json({ error: "etapa_not_found" });

  // Side-effects ao concluir: gerar pendência com prazo legal/operacional
  if (status === "concluida") {
    const etapasDef = etapasParaFluxo(transf.uf ?? "SP", (transf.fluxo as Fluxo) ?? "tradicional");
    const def = etapasDef.find((e) => e.codigo === codigo);
    const ped = def?.pendenciaAoConcluir;
    if (ped) {
      const prazo = new Date(Date.now() + ped.prazoDias * 24 * 60 * 60 * 1000).toISOString();
      await sql`
        INSERT INTO pendencias (veiculo_id, tipo, descricao, valor, prazo, status)
        VALUES (${transf.veiculo_id}, ${ped.tipo}::tipo_pendencia, ${ped.descricao}, 0, ${prazo}, 'atencao'::status_geral)
      `;
    }
    if (def?.prazoConclusaoDias && codigo !== "comunicacao_venda") {
      // genérico: cria lembrete leve
      const prazo = new Date(Date.now() + def.prazoConclusaoDias * 24 * 60 * 60 * 1000).toISOString();
      await sql`
        UPDATE transferencia_etapas
        SET prazo_em = ${prazo}
        WHERE transferencia_id = ${id} AND codigo = ${codigo}
      `;
    }
    // Comunicação de venda: prazo de 30d desde a etapa anterior — cria pendência específica
    if (codigo === "comunicacao_venda") {
      const prazo = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await sql`
        INSERT INTO pendencias (veiculo_id, tipo, descricao, valor, prazo, status)
        VALUES (${transf.veiculo_id}, 'restricao'::tipo_pendencia, 'Comunicação de venda - CTB art. 134', 0, ${prazo}, 'urgente'::status_geral)
      `;
    }
    // Conclusão final: marca transferência como concluida
    if (codigo === "crlv_emitido") {
      await sql`
        UPDATE transferencias SET status = 'concluida'::status_transferencia WHERE id = ${id}
      `;
    }
  }

  const data = await carregarComEtapas(id);
  res.json(data);
});
