import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtData } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck } from "lucide-react";

export default function Seguros() {
  const segQ = useQuery({ queryKey: ["seguros"], queryFn: api.listSeguros });
  const veiQ = useQuery({ queryKey: ["veiculos"], queryFn: api.listVeiculos });

  return (
    <>
      <PageHeader title="Seguros" subtitle="Apólices vigentes e vencidas" />
      {segQ.isLoading ? <Skeleton className="h-48 w-full rounded-xl" /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {segQ.data?.map((s) => {
            const v = veiQ.data?.find((x) => x.id === s.veiculoId);
            return (
              <div key={s.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground"><ShieldCheck className="size-5" /></span>
                    <div>
                      <div className="font-semibold">{s.seguradora}</div>
                      <div className="text-xs text-muted-foreground">Apólice {s.apolice}</div>
                    </div>
                  </div>
                  <StatusBadge status={s.vigente ? "ok" : "urgente"} label={s.vigente ? "Vigente" : "Vencida"} />
                </div>
                <div className="mt-3 text-sm">
                  <div><span className="text-muted-foreground">Veículo:</span> <span className="font-mono font-semibold">{v?.placa}</span> · {v?.modelo}</div>
                  <div className="mt-1 text-muted-foreground">{s.cobertura}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Vigência: {fmtData(s.inicio)} → {fmtData(s.fim)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}