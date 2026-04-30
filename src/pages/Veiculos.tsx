import { useQuery } from "@tanstack/react-query";
import { Plus, Car, Check, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { maskRenavam } from "@/lib/format";
import { useNavigate } from "react-router-dom";
import type { StatusGeral } from "@/types";
import { cn } from "@/lib/utils";

function Indicator({ label, status }: { label: string; status: StatusGeral }) {
  const Icon = status === "ok" ? Check : status === "atencao" ? AlertTriangle : X;
  const color =
    status === "ok" ? "text-success bg-success/10" :
    status === "atencao" ? "text-warning bg-warning/10" :
    "text-destructive bg-destructive/10";
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("flex size-5 items-center justify-center rounded-full", color)}>
        <Icon className="size-3" />
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default function Veiculos() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["veiculos"], queryFn: api.listVeiculos });

  return (
    <>
      <PageHeader
        title="Veículos"
        subtitle="Todos os veículos cadastrados"
        actions={<Button><Plus className="mr-1.5 size-4" /> Adicionar Veículo</Button>}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      ) : !data?.length ? (
        <EmptyState icon={Car} title="Nenhum veículo cadastrado"
          description="Adicione o primeiro veículo para começar a controlar tudo."
          action={<Button><Plus className="mr-1.5 size-4" /> Adicionar Veículo</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((v) => (
            <button key={v.id} onClick={() => navigate(`/veiculos/${v.id}`)}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
              <div className="flex h-36 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <Car className="size-12 text-slate-400" />
              </div>
              <div className="flex-1 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-bold tracking-wide">{v.placa}</span>
                  <StatusBadge status={v.status} />
                </div>
                <div className="mt-1 text-sm font-medium">{v.marca} {v.modelo}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{v.ano} · {v.cor} · RENAVAM {maskRenavam(v.renavam)}</div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3">
                <Indicator label="IPVA" status={v.indicadores.ipva} />
                <Indicator label="Licenc." status={v.indicadores.licenciamento} />
                <Indicator label="Seguro" status={v.indicadores.seguro} />
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}