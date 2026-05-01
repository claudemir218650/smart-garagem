import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Check, Circle, Loader2, FileText, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtData, fmtPlaca } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TransferenciaEtapa } from "@/types";
import { useState } from "react";

const fluxoLabel: Record<string, string> = {
  tdv: "Transferência Digital (TDV)",
  tradicional: "Tradicional (com vistoria)",
};

function statusIcon(s: TransferenciaEtapa["status"]) {
  if (s === "concluida") return <Check className="size-4" />;
  if (s === "em_andamento") return <Loader2 className="size-4 animate-spin" />;
  return <Circle className="size-4" />;
}

function statusColor(s: TransferenciaEtapa["status"]) {
  if (s === "concluida") return "bg-success text-success-foreground";
  if (s === "em_andamento") return "bg-warning text-warning-foreground";
  if (s === "dispensada") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
}

export default function TransferenciaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const tQ = useQuery({
    queryKey: ["transferencia", id],
    queryFn: () => api.getTransferencia(id!),
    enabled: !!id,
  });
  const veiculoQ = useQuery({
    queryKey: ["veiculo", tQ.data?.veiculoId],
    queryFn: () => api.getVeiculo(tQ.data!.veiculoId),
    enabled: !!tQ.data?.veiculoId,
  });

  const updateMut = useMutation({
    mutationFn: (vars: { codigo: string; status?: string; observacao?: string }) =>
      api.updateEtapa(id!, vars.codigo, vars),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transferencia", id] });
      qc.invalidateQueries({ queryKey: ["transferencias"] });
      qc.invalidateQueries({ queryKey: ["pendencias"] });
      toast.success("Etapa atualizada");
    },
    onError: () => toast.error("Erro ao atualizar etapa"),
  });

  if (tQ.isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (!tQ.data) return <div className="text-sm text-muted-foreground">Transferência não encontrada.</div>;
  const t = tQ.data;
  const v = veiculoQ.data;
  const total = t.etapas?.length ?? 0;
  const concluidas = t.etapas?.filter((e) => e.status === "concluida").length ?? 0;

  return (
    <>
      <PageHeader
        title={`Transferência ${v ? fmtPlaca(v.placa) : ""}`}
        subtitle={`${fluxoLabel[t.fluxo ?? "tradicional"]} · UF ${t.uf ?? "SP"} · iniciada em ${fmtData(t.inicio)}`}
        actions={<Link to="/transferencias"><Button variant="outline" size="sm">Voltar</Button></Link>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">Etapas</h2>
              <p className="text-xs text-muted-foreground">{concluidas} de {total} concluídas</p>
            </div>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${(concluidas / Math.max(total, 1)) * 100}%` }} />
            </div>
          </div>
          <ul className="divide-y divide-border">
            {t.etapas?.map((e) => (
              <EtapaItem
                key={e.codigo}
                etapa={e}
                onConcluir={() => updateMut.mutate({ codigo: e.codigo, status: "concluida" })}
                onIniciar={() => updateMut.mutate({ codigo: e.codigo, status: "em_andamento" })}
                onObservacao={(obs) => updateMut.mutate({ codigo: e.codigo, observacao: obs })}
              />
            ))}
          </ul>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-3">Vendedor</h3>
            <div className="text-sm">{t.deNome}</div>
            <div className="text-xs text-muted-foreground">{t.deCpf || t.deCnpj}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-3">Comprador</h3>
            <div className="text-sm">{t.paraNome}</div>
            <div className="text-xs text-muted-foreground">{t.paraCpf || t.paraCnpj}</div>
          </div>
          {v && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">Veículo</h3>
              <div className="font-mono font-bold">{fmtPlaca(v.placa)}</div>
              <div className="text-sm">{v.marca} {v.modelo}</div>
              <div className="text-xs text-muted-foreground">{v.tipo} · {v.anoModelo ?? v.ano}</div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function EtapaItem({
  etapa, onIniciar, onConcluir, onObservacao,
}: {
  etapa: TransferenciaEtapa;
  onIniciar: () => void;
  onConcluir: () => void;
  onObservacao: (obs: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [obs, setObs] = useState(etapa.observacao ?? "");
  return (
    <li className="px-5 py-4">
      <div className="flex items-start gap-4">
        <span className={cn("mt-0.5 flex size-7 items-center justify-center rounded-full text-xs font-semibold", statusColor(etapa.status))}>
          {statusIcon(etapa.status)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{etapa.ordem}. {etapa.titulo}</h3>
            <div className="flex gap-2">
              {etapa.status !== "concluida" && etapa.status !== "em_andamento" && (
                <Button size="sm" variant="outline" onClick={onIniciar}>Iniciar</Button>
              )}
              {etapa.status !== "concluida" && (
                <Button size="sm" onClick={onConcluir}>Concluir</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
                <FileText className="size-4" />
              </Button>
            </div>
          </div>
          {etapa.descricao && <p className="mt-1 text-xs text-muted-foreground">{etapa.descricao}</p>}
          {etapa.links && etapa.links.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {etapa.links.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-primary hover:bg-accent"
                >
                  <ExternalLink className="size-3" /> {l.label}
                </a>
              ))}
            </div>
          )}
          {etapa.concluidaEm && (
            <p className="mt-1 text-xs text-success">Concluída em {fmtData(etapa.concluidaEm)}</p>
          )}
          {open && (
            <div className="mt-3 space-y-2">
              <textarea
                className="w-full rounded-md border border-border bg-background p-2 text-sm"
                rows={3}
                placeholder="Observações, número de protocolo, etc."
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                onBlur={() => obs !== (etapa.observacao ?? "") && onObservacao(obs)}
              />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
