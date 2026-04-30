import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { fmtData, maskCpf, fmtPlaca } from "@/lib/format";
import type { StatusTransferencia, StatusGeral } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusLabel: Record<StatusTransferencia, string> = {
  rascunho: "Rascunho", andamento: "Em andamento", concluida: "Concluída", cancelada: "Cancelada",
};
const statusToBadge: Record<StatusTransferencia, StatusGeral> = {
  rascunho: "atencao", andamento: "atencao", concluida: "ok", cancelada: "urgente",
};

function Wizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const veiculosQ = useQuery({ queryKey: ["veiculos"], queryFn: api.listVeiculos });
  const [veiculoId, setVeiculoId] = useState<string>("");

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const prev = () => setStep((s) => Math.max(s - 1, 1));
  const finish = () => { toast.success("Transferência criada (mock)"); onClose(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex flex-1 items-center">
            <div className={cn("flex size-8 items-center justify-center rounded-full text-xs font-semibold",
              step >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{n}</div>
            {n < 4 && <div className={cn("mx-2 h-0.5 flex-1", step > n ? "bg-primary" : "bg-muted")} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Selecionar veículo</h3>
          <div className="grid gap-2">
            {(veiculosQ.data ?? []).map((v) => (
              <button key={v.id} onClick={() => setVeiculoId(v.id)}
                className={cn("flex items-center justify-between rounded-lg border p-3 text-left transition",
                  veiculoId === v.id ? "border-primary bg-accent" : "border-border hover:bg-muted/50")}>
                <div><div className="font-mono font-semibold">{fmtPlaca(v.placa)}</div>
                  <div className="text-xs text-muted-foreground">{v.marca} {v.modelo}</div></div>
                <StatusBadge status={v.status} />
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Dados do comprador</h3>
          <div><Label>Nome completo</Label><Input placeholder="Carlos Lima" /></div>
          <div><Label>CPF</Label><Input placeholder="000.000.000-00" /></div>
          <div><Label>Endereço</Label><Input placeholder="Rua, número, cidade" /></div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Documentos</h3>
          <div className="rounded-xl border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Arraste CRLV, CNH e comprovante aqui
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Revisão</h3>
          <p className="text-sm text-muted-foreground">Confirme os dados antes de criar a transferência.</p>
          <ul className="rounded-lg border border-border p-3 text-sm space-y-1">
            <li>Veículo: <strong>{(() => { const p = veiculosQ.data?.find(v => v.id === veiculoId)?.placa; return p ? fmtPlaca(p) : "—"; })()}</strong></li>
            <li>Comprador: Carlos Lima</li>
            <li>Documentos: 0 anexados</li>
          </ul>
        </div>
      )}

      <DialogFooter className="gap-2">
        {step > 1 && <Button variant="outline" onClick={prev}>Voltar</Button>}
        {step < 4 && <Button onClick={next} disabled={step === 1 && !veiculoId}>Próximo</Button>}
        {step === 4 && <Button onClick={finish}>Criar transferência</Button>}
      </DialogFooter>
    </div>
  );
}

export default function Transferencias() {
  const [filter, setFilter] = useState<StatusTransferencia | "todas">("todas");
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["transferencias"], queryFn: api.listTransferencias });
  const veiculosQ = useQuery({ queryKey: ["veiculos"], queryFn: api.listVeiculos });

  const filtered = (data ?? []).filter((t) => filter === "todas" || t.status === filter);

  return (
    <>
      <PageHeader title="Transferências" subtitle="Gerencie as transferências de propriedade"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1.5 size-4" /> Nova Transferência</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Nova Transferência</DialogTitle></DialogHeader>
              <Wizard onClose={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(["todas", "rascunho", "andamento", "concluida", "cancelada"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("rounded-full border px-3 py-1 text-xs font-medium transition",
              filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted")}>
            {f === "todas" ? "Todas" : statusLabel[f]}
          </button>
        ))}
      </div>

      {isLoading ? <Skeleton className="h-48 w-full rounded-xl" /> :
        filtered.length === 0 ? (
          <EmptyState icon={ArrowRightLeft} title="Nenhuma transferência" description="Crie a primeira transferência para começar." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-5 py-3 text-left">Veículo</th><th className="px-5 py-3 text-left">De</th><th className="px-5 py-3 text-left">Para</th><th className="px-5 py-3 text-left">Início</th><th className="px-5 py-3 text-left">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => {
                  const v = veiculosQ.data?.find((x) => x.id === t.veiculoId);
                  return (
                    <tr key={t.id} className="hover:bg-muted/30">
                      <td className="px-5 py-3 font-mono font-semibold">{v?.placa ? fmtPlaca(v.placa) : "—"}</td>
                      <td className="px-5 py-3"><div>{t.deNome}</div><div className="text-xs text-muted-foreground">{maskCpf(t.deCpf)}</div></td>
                      <td className="px-5 py-3"><div>{t.paraNome}</div><div className="text-xs text-muted-foreground">{maskCpf(t.paraCpf)}</div></td>
                      <td className="px-5 py-3 text-muted-foreground">{fmtData(t.inicio)}</td>
                      <td className="px-5 py-3"><StatusBadge status={statusToBadge[t.status]} label={statusLabel[t.status]} /></td>
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