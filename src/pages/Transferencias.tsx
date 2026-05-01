import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowRightLeft, User, ShoppingCart, Pencil, Check, Car as CarIcon, Zap, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { fmtData, maskCpf, fmtPlaca, fmtDoc } from "@/lib/format";
import { ProprietarioCombobox } from "@/components/ProprietarioCombobox";
import type { StatusTransferencia, StatusGeral, FluxoTransferencia, Proprietario } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const onlyDigits = (v: string) => v.replace(/\D/g, "");

const statusLabel: Record<StatusTransferencia, string> = {
  rascunho: "Rascunho", andamento: "Em andamento", concluida: "Concluída", cancelada: "Cancelada",
};
const statusToBadge: Record<StatusTransferencia, StatusGeral> = {
  rascunho: "atencao", andamento: "atencao", concluida: "ok", cancelada: "urgente",
};

function SegPfPj({ value, onChange }: { value: "PF" | "PJ"; onChange: (v: "PF" | "PJ") => void }) {
  return (
    <div>
      <Label>Tipo</Label>
      <div className="mt-1 inline-flex overflow-hidden rounded-md border border-border">
        {(["PF", "PJ"] as const).map((tp) => (
          <button
            key={tp}
            type="button"
            onClick={() => onChange(tp)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium transition",
              value === tp ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
            )}
          >
            {tp}
          </button>
        ))}
      </div>
    </div>
  );
}

function Wizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const veiculosQ = useQuery({ queryKey: ["veiculos"], queryFn: api.listVeiculos });
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [veiculoId, setVeiculoId] = useState<string>("");
  const [fluxo, setFluxo] = useState<FluxoTransferencia>("tdv");

  const [deNome, setDeNome] = useState("");
  const [deDoc, setDeDoc] = useState("");
  const [deTipo, setDeTipo] = useState<"PF" | "PJ">("PF");

  const [paraNome, setParaNome] = useState("");
  const [paraDoc, setParaDoc] = useState("");
  const [paraTipo, setParaTipo] = useState<"PF" | "PJ">("PF");

  const veiculo = veiculosQ.data?.find((v) => v.id === veiculoId);

  // Busca automática do proprietário do veículo (vendedor) no banco
  const vendedorQ = useQuery({
    queryKey: ["proprietarios", "lookup", veiculo?.proprietario],
    queryFn: () => api.listProprietarios(veiculo!.proprietario),
    enabled: !!veiculo?.proprietario,
  });

  const [vendedorEditavel, setVendedorEditavel] = useState(false);
  const vendedorEncontrado: Proprietario | undefined = vendedorQ.data?.find((p) => {
    const nome = p.tipoPessoa === "PF" ? p.nomeCompleto : p.razaoSocial;
    return nome?.trim().toLowerCase() === veiculo?.proprietario?.trim().toLowerCase();
  }) ?? vendedorQ.data?.[0];

  useEffect(() => {
    if (!veiculo) return;
    if (vendedorEncontrado) {
      setDeNome(
        vendedorEncontrado.tipoPessoa === "PF"
          ? (vendedorEncontrado.nomeCompleto ?? "")
          : (vendedorEncontrado.razaoSocial ?? "")
      );
      setDeTipo(vendedorEncontrado.tipoPessoa);
      setDeDoc(
        (vendedorEncontrado.tipoPessoa === "PF" ? vendedorEncontrado.cpf : vendedorEncontrado.cnpj) ?? ""
      );
    } else if (!deNome) {
      setDeNome(veiculo.proprietario ?? "");
    }
  }, [veiculo, vendedorEncontrado]); // eslint-disable-line react-hooks/exhaustive-deps

  const createMut = useMutation({
    mutationFn: () => api.createTransferencia({
      veiculoId,
      fluxo,
      uf: "SP",
      deNome,
      ...(deTipo === "PF" ? { deCpf: deDoc } : { deCnpj: deDoc, deCpf: "" }),
      paraNome,
      ...(paraTipo === "PF" ? { paraCpf: paraDoc } : { paraCnpj: paraDoc, paraCpf: "" }),
    }),
    onSuccess: (t) => {
      toast.success("Transferência criada");
      qc.invalidateQueries({ queryKey: ["transferencias"] });
      onClose();
      navigate(`/transferencias/${t.id}`);
    },
    onError: (e) => {
      const msg = e instanceof ApiError ? `${e.message}${(e.payload as any)?.field ? ` (${(e.payload as any).field})` : ""}` : "Erro ao criar transferência";
      toast.error(msg);
    },
  });

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

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
          <div className="grid gap-2 max-h-72 overflow-auto">
            {(veiculosQ.data ?? []).map((v) => (
              <button key={v.id} onClick={() => setVeiculoId(v.id)}
                className={cn("flex items-center justify-between rounded-lg border p-3 text-left transition",
                  veiculoId === v.id ? "border-primary bg-accent" : "border-border hover:bg-muted/50")}>
                <div><div className="font-mono font-semibold">{fmtPlaca(v.placa)}</div>
                  <div className="text-xs text-muted-foreground">{v.marca} {v.modelo}</div></div>
                <StatusBadge status={v.status} />
              </button>
            ))}
            {(veiculosQ.data ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground">Cadastre um veículo primeiro.</div>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Escolher fluxo</h3>
          <p className="text-xs text-muted-foreground">
            TDV é mais rápido (5 min, totalmente digital), mas exige CRV pós-2021 e gov.br nível Prata/Ouro.
            Tradicional inclui vistoria e ATPV-e ou firma reconhecida em cartório.
          </p>
          <div className="grid gap-2">
            {(["tdv", "tradicional"] as const).map((f) => (
              <button key={f} onClick={() => setFluxo(f)}
                className={cn("rounded-lg border p-3 text-left transition",
                  fluxo === f ? "border-primary bg-accent" : "border-border hover:bg-muted/50")}>
                <div className="font-semibold text-sm">
                  {f === "tdv" ? "Transferência Digital (TDV)" : "Tradicional"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {f === "tdv"
                    ? "100% online, ~5 minutos, sem vistoria física na maioria dos casos."
                    : "ATPV-e ou CRV com firma reconhecida + vistoria em ECV (validade 60d)."}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          {/* VENDEDOR */}
          <section className="rounded-xl border border-border bg-muted/30 p-4">
            <header className="mb-3 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="size-4" />
              </span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold leading-tight">Vendedor</h3>
                <p className="text-xs text-muted-foreground">Proprietário atual do veículo</p>
              </div>
              {!vendedorEditavel && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setVendedorEditavel(true)}>
                  <Pencil className="mr-1 size-3.5" /> Editar
                </Button>
              )}
            </header>

            {!vendedorEditavel ? (
              <div className="rounded-lg bg-card border border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{deNome || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {deTipo} · {deDoc ? fmtDoc(deTipo, deDoc) : "documento não cadastrado"}
                    </div>
                  </div>
                  {vendedorEncontrado ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                      <Check className="size-3" /> Cadastrado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                      Sem cadastro completo
                    </span>
                  )}
                </div>
                {!vendedorEncontrado && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    O proprietário do veículo não está cadastrado em Cadastros — clique em Editar para informar o documento.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label>Nome / Razão social</Label>
                  <ProprietarioCombobox
                    value={deNome}
                    onChange={setDeNome}
                    onSelect={(p) => {
                      setDeTipo(p.tipoPessoa);
                      setDeDoc((p.tipoPessoa === "PF" ? p.cpf : p.cnpj) ?? "");
                    }}
                    placeholder="Digite para buscar..."
                  />
                </div>
                <div className="grid grid-cols-[max-content_1fr] gap-3">
                  <SegPfPj value={deTipo} onChange={setDeTipo} />
                  <div>
                    <Label>{deTipo === "PF" ? "CPF" : "CNPJ"}</Label>
                    <Input
                      value={deDoc}
                      onChange={(e) => setDeDoc(onlyDigits(e.target.value))}
                      placeholder={deTipo === "PF" ? "00000000000" : "00000000000000"}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* COMPRADOR */}
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <header className="mb-3 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShoppingCart className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold leading-tight">Comprador</h3>
                <p className="text-xs text-muted-foreground">Quem vai receber o veículo</p>
              </div>
            </header>

            <div className="space-y-3">
              <div>
                <Label>Nome / Razão social</Label>
                <ProprietarioCombobox
                  value={paraNome}
                  onChange={setParaNome}
                  onSelect={(p) => {
                    setParaTipo(p.tipoPessoa);
                    setParaDoc((p.tipoPessoa === "PF" ? p.cpf : p.cnpj) ?? "");
                  }}
                  placeholder="Digite o nome para buscar nos cadastros..."
                />
              </div>
              <div className="grid grid-cols-[max-content_1fr] gap-3">
                <SegPfPj value={paraTipo} onChange={setParaTipo} />
                <div>
                  <Label>{paraTipo === "PF" ? "CPF" : "CNPJ"}</Label>
                  <Input
                    value={paraDoc}
                    onChange={(e) => setParaDoc(onlyDigits(e.target.value))}
                    placeholder={paraTipo === "PF" ? "00000000000" : "00000000000000"}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Revisão</h3>
          <p className="text-sm text-muted-foreground">Confira os dados antes de criar.</p>
          <ul className="rounded-lg border border-border p-3 text-sm space-y-1">
            <li>Veículo: <strong>{veiculo ? fmtPlaca(veiculo.placa) : "—"}</strong></li>
            <li>Fluxo: <strong>{fluxo === "tdv" ? "Transferência Digital (TDV)" : "Tradicional"}</strong></li>
            <li>Vendedor: <strong>{deNome || "—"}</strong> ({deTipo} {deDoc})</li>
            <li>Comprador: <strong>{paraNome || "—"}</strong> ({paraTipo} {paraDoc})</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Ao criar, será gerado um checklist com {fluxo === "tdv" ? "7" : "8"} etapas e prazos legais (CTB).
          </p>
        </div>
      )}

      <DialogFooter className="gap-2">
        {step > 1 && <Button variant="outline" onClick={prev}>Voltar</Button>}
        {step < 4 && (
          <Button onClick={next} disabled={
            (step === 1 && !veiculoId) ||
            (step === 3 && (!deNome || !deDoc || !paraNome || !paraDoc))
          }>Próximo</Button>
        )}
        {step === 4 && (
          <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
            {createMut.isPending ? "Criando..." : "Criar transferência"}
          </Button>
        )}
      </DialogFooter>
    </div>
  );
}

export default function Transferencias() {
  const [filter, setFilter] = useState<StatusTransferencia | "todas">("todas");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["transferencias"], queryFn: api.listTransferencias });
  const veiculosQ = useQuery({ queryKey: ["veiculos"], queryFn: api.listVeiculos });

  const filtered = (data ?? []).filter((t) => filter === "todas" || t.status === filter);

  return (
    <>
      <PageHeader title="Transferências" subtitle="Gerencie as transferências de propriedade"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1.5 size-4" /> Nova Transferência</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
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
                <tr>
                  <th className="px-5 py-3 text-left">Veículo</th>
                  <th className="px-5 py-3 text-left">Fluxo</th>
                  <th className="px-5 py-3 text-left">De</th>
                  <th className="px-5 py-3 text-left">Para</th>
                  <th className="px-5 py-3 text-left">Início</th>
                  <th className="px-5 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => {
                  const v = veiculosQ.data?.find((x) => x.id === t.veiculoId);
                  return (
                    <tr key={t.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/transferencias/${t.id}`)}>
                      <td className="px-5 py-3 font-mono font-semibold">{v?.placa ? fmtPlaca(v.placa) : "—"}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{t.fluxo === "tdv" ? "TDV" : "Tradicional"}</td>
                      <td className="px-5 py-3"><div>{t.deNome}</div><div className="text-xs text-muted-foreground">{t.deCpf ? maskCpf(t.deCpf) : t.deCnpj}</div></td>
                      <td className="px-5 py-3"><div>{t.paraNome}</div><div className="text-xs text-muted-foreground">{t.paraCpf ? maskCpf(t.paraCpf) : t.paraCnpj}</div></td>
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
