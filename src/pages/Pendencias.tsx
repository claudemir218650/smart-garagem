import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Receipt, Ban, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { fmtBRL, fmtData, diasAte, fmtPlaca } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TipoPendencia } from "@/types";

const tipoIcon: Record<TipoPendencia, any> = { multa: Ban, debito: Receipt, restricao: ShieldAlert };
const tipoLabel: Record<TipoPendencia, string> = { multa: "Multa", debito: "Débito", restricao: "Restrição" };

export default function Pendencias() {
  const [tipo, setTipo] = useState<TipoPendencia | "todos">("todos");
  const pendQ = useQuery({ queryKey: ["pendencias"], queryFn: api.listPendencias });
  const veiQ = useQuery({ queryKey: ["veiculos"], queryFn: api.listVeiculos });

  const list = (pendQ.data ?? []).filter((p) => tipo === "todos" || p.tipo === tipo);

  return (
    <>
      <PageHeader title="Pendências" subtitle="Multas, débitos e restrições de todos os veículos" />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["todos", "multa", "debito", "restricao"] as const).map((f) => (
          <button key={f} onClick={() => setTipo(f)}
            className={cn("rounded-full border px-3 py-1 text-xs font-medium",
              tipo === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted")}>
            {f === "todos" ? "Todos" : tipoLabel[f]}
          </button>
        ))}
      </div>

      {pendQ.isLoading ? <Skeleton className="h-48 w-full rounded-xl" /> :
        list.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="Nenhuma pendência" description="Você está em dia com seus veículos." />
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card shadow-sm">
            {list.map((p) => {
              const Icon = tipoIcon[p.tipo];
              const v = veiQ.data?.find((x) => x.id === p.veiculoId);
              const dias = diasAte(p.prazo);
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{tipoLabel[p.tipo]} · {v ? fmtPlaca(v.placa) : ""} {v?.modelo}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.descricao}</div>
                  </div>
                  <div className="text-right text-sm">
                    {p.valor > 0 && <div className="font-semibold">{fmtBRL(p.valor)}</div>}
                    <div className="text-xs text-muted-foreground">{fmtData(p.prazo)}</div>
                  </div>
                  <StatusBadge status={p.status} label={dias < 0 ? `${Math.abs(dias)}d em atraso` : `vence em ${dias}d`} />
                  <Button variant="outline" size="sm">Resolver</Button>
                </li>
              );
            })}
          </ul>
        )}
    </>
  );
}