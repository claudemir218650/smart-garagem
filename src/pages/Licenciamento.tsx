import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtBRL, fmtData, fmtPlaca } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export default function Licenciamento() {
  const licQ = useQuery({ queryKey: ["licenciamentos"], queryFn: api.listLicenciamentos });
  const veiQ = useQuery({ queryKey: ["veiculos"], queryFn: api.listVeiculos });

  return (
    <>
      <PageHeader title="Licenciamento" subtitle="Exercícios anuais de todos os veículos" />
      {licQ.isLoading ? <Skeleton className="h-48 w-full rounded-xl" /> : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-5 py-3 text-left">Veículo</th><th className="px-5 py-3 text-left">Ano</th><th className="px-5 py-3 text-left">Vencimento</th><th className="px-5 py-3 text-left">Valor</th><th className="px-5 py-3 text-left">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {licQ.data?.map((l) => {
                const v = veiQ.data?.find((x) => x.id === l.veiculoId);
                return (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3"><span className="font-mono font-semibold">{v ? fmtPlaca(v.placa) : ""}</span> <span className="text-muted-foreground">{v?.modelo}</span></td>
                    <td className="px-5 py-3">{l.ano}</td>
                    <td className="px-5 py-3">{fmtData(l.vencimento)}</td>
                    <td className="px-5 py-3">{fmtBRL(l.valor)}</td>
                    <td className="px-5 py-3"><StatusBadge status={l.pago ? "ok" : "urgente"} label={l.pago ? "Pago" : "Devendo"} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}