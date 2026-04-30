import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtBRL, fmtData, diasAte } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export default function IPVA() {
  const ipvaQ = useQuery({ queryKey: ["ipvas"], queryFn: api.listIpvas });
  const veiQ = useQuery({ queryKey: ["veiculos"], queryFn: api.listVeiculos });

  return (
    <>
      <PageHeader title="IPVA" subtitle="Cobranças anuais e parcelamentos" />
      {ipvaQ.isLoading ? <Skeleton className="h-48 w-full rounded-xl" /> : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-5 py-3 text-left">Veículo</th><th className="px-5 py-3 text-left">Ano</th><th className="px-5 py-3 text-left">Parcelas</th><th className="px-5 py-3 text-left">Vencimento</th><th className="px-5 py-3 text-left">Valor</th><th className="px-5 py-3 text-left">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ipvaQ.data?.map((i) => {
                const v = veiQ.data?.find((x) => x.id === i.veiculoId);
                const dias = diasAte(i.vencimento);
                const status = i.pago ? "ok" : dias < 15 ? "atencao" : "ok";
                return (
                  <tr key={i.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3"><span className="font-mono font-semibold">{v?.placa}</span> <span className="text-muted-foreground">{v?.modelo}</span></td>
                    <td className="px-5 py-3">{i.ano}</td>
                    <td className="px-5 py-3">{i.parcelas}x</td>
                    <td className="px-5 py-3">{fmtData(i.vencimento)}</td>
                    <td className="px-5 py-3 font-semibold">{fmtBRL(i.valor)}</td>
                    <td className="px-5 py-3"><StatusBadge status={status} label={i.pago ? "Pago" : `vence em ${dias}d`} /></td>
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