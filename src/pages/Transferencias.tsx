import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, ArrowRightLeft, User, ShoppingCart, Pencil, Check, Car as CarIcon,
  Zap, FileSignature, ClipboardCheck, ChevronRight, ChevronLeft, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
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

function maskDocLive(tipo: "PF" | "PJ", v: string) {
  const d = onlyDigits(v).slice(0, tipo === "PF" ? 11 : 14);
  if (tipo === "PF") {
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function avatarInitials(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

interface PartyCardProps {
  role: "vendedor" | "comprador";
  nome: string;
  tipo: "PF" | "PJ";
  doc: string;
  cadastrado?: boolean;
  editavel: boolean;
  onEdit?: () => void;
  onCancelEdit?: () => void;
  onChangeNome: (v: string) => void;
  onChangeTipo: (v: "PF" | "PJ") => void;
  onChangeDoc: (v: string) => void;
  onSelectProprietario: (p: Proprietario) => void;
}

function PartyCard({
  role, nome, tipo, doc, cadastrado, editavel,
  onEdit, onCancelEdit, onChangeNome, onChangeTipo, onChangeDoc, onSelectProprietario,
}: PartyCardProps) {
  const isVendedor = role === "vendedor";
  const Icon = isVendedor ? User : ShoppingCart;
  const accent = isVendedor ? "from-blue-500/10 to-blue-500/0" : "from-emerald-500/10 to-emerald-500/0";
  const iconBg = isVendedor ? "bg-blue-500/15 text-blue-600" : "bg-emerald-500/15 text-emerald-600";
  const ringActive = isVendedor ? "ring-blue-500/20" : "ring-emerald-500/20";
  const docPlaceholder = tipo === "PF" ? "000.000.000-00" : "00.000.000/0000-00";
  const preenchido = !!nome && !!doc;

  return (
    <section className={cn(
      "group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all",
      preenchido && "ring-1", preenchido && ringActive,
    )}>
      {/* Header com gradiente */}
      <header className={cn("flex items-center gap-3 border-b border-border bg-gradient-to-br px-5 py-4", accent)}>
        <div className={cn("flex size-10 items-center justify-center rounded-xl", iconBg)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">{isVendedor ? "Vendedor" : "Comprador"}</h4>
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {tipo}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {isVendedor ? "Proprietário atual do veículo" : "Quem vai receber o veículo"}
          </p>
        </div>
        {isVendedor && (
          cadastrado ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[10px] font-semibold text-success">
              <Check className="size-3" /> Cadastrado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-1 text-[10px] font-semibold text-warning">
              Incompleto
            </span>
          )
        )}
      </header>

      {/* Corpo */}
      <div className="p-5">
        {!editavel ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                iconBg,
              )}>
                {avatarInitials(nome || "?")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{nome || "—"}</div>
                <div className="font-mono text-xs text-muted-foreground">
                  {doc ? fmtDoc(tipo, doc) : "documento não informado"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Tipo</div>
                <div className="mt-0.5 text-sm font-medium">{tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {tipo === "PF" ? "CPF" : "CNPJ"}
                </div>
                <div className="mt-0.5 truncate font-mono text-sm font-medium">
                  {doc ? fmtDoc(tipo, doc) : "—"}
                </div>
              </div>
            </div>

            <Button type="button" variant="outline" size="sm" className="w-full" onClick={onEdit}>
              <Pencil className="mr-1.5 size-3.5" /> Editar dados
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                {tipo === "PF" ? "Nome completo" : "Razão social"}
              </Label>
              <ProprietarioCombobox
                value={nome}
                onChange={onChangeNome}
                onSelect={onSelectProprietario}
                placeholder={tipo === "PF" ? "Buscar pessoa cadastrada..." : "Buscar empresa cadastrada..."}
              />
              <p className="text-[11px] text-muted-foreground">
                Comece a digitar para buscar nos cadastros existentes.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
              <SegPfPj value={tipo} onChange={onChangeTipo} />
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  {tipo === "PF" ? "CPF" : "CNPJ"}
                </Label>
                <Input
                  inputMode="numeric"
                  value={doc ? fmtDoc(tipo, doc) : ""}
                  onChange={(e) => onChangeDoc(onlyDigits(e.target.value))}
                  placeholder={docPlaceholder}
                  className="font-mono"
                  maxLength={tipo === "PF" ? 14 : 18}
                />
              </div>
            </div>

            {isVendedor && onCancelEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={onCancelEdit}
              >
                Cancelar edição
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

const statusLabel: Record<StatusTransferencia, string> = {
  rascunho: "Rascunho", andamento: "Em andamento", concluida: "Concluída", cancelada: "Cancelada",
};
const statusToBadge: Record<StatusTransferencia, StatusGeral> = {
  rascunho: "atencao", andamento: "atencao", concluida: "ok", cancelada: "urgente",
};

function SegPfPj({ value, onChange }: { value: "PF" | "PJ"; onChange: (v: "PF" | "PJ") => void }) {
  return (
    <div>
      <Label className="text-xs font-medium text-muted-foreground">Tipo</Label>
      <div className="mt-1.5 inline-flex overflow-hidden rounded-lg border border-border bg-muted/40 p-0.5">
        {(["PF", "PJ"] as const).map((tp) => (
          <button
            key={tp}
            type="button"
            onClick={() => onChange(tp)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition",
              value === tp
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tp}
          </button>
        ))}
      </div>
    </div>
  );
}

const STEPS = [
  { n: 1, label: "Veículo", icon: CarIcon },
  { n: 2, label: "Fluxo", icon: Zap },
  { n: 3, label: "Partes", icon: User },
  { n: 4, label: "Revisão", icon: ClipboardCheck },
] as const;

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        const Icon = s.icon;
        return (
          <div key={s.n} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2 transition-all",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-primary/10 text-primary ring-4 ring-primary/15",
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : <Icon className="size-4" />}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="mx-2 mb-5 h-0.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full bg-primary transition-all duration-500",
                    step > s.n ? "w-full" : "w-0",
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
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
      <Stepper step={step} />

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Selecione o veículo</h3>
            <p className="text-sm text-muted-foreground">Escolha qual veículo será transferido.</p>
          </div>
          <div className="grid max-h-80 gap-2 overflow-auto pr-1">
            {(veiculosQ.data ?? []).map((v) => {
              const selected = veiculoId === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setVeiculoId(v.id)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all",
                    selected
                      ? "border-primary shadow-md ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40 hover:shadow-sm",
                  )}
                >
                  <div className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg transition",
                    selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}>
                    <CarIcon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold">{fmtPlaca(v.placa)}</span>
                      <StatusBadge status={v.status} />
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {v.marca} {v.modelo}
                    </div>
                  </div>
                  {selected && (
                    <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
            {(veiculosQ.data ?? []).length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Cadastre um veículo primeiro.
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Como será a transferência?</h3>
            <p className="text-sm text-muted-foreground">
              Escolha o fluxo de acordo com o seu CRV e o nível da sua conta gov.br.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              {
                key: "tdv" as const,
                title: "Digital (TDV)",
                badge: "Recomendado",
                icon: Zap,
                desc: "100% online em ~5 minutos. Sem vistoria física na maioria dos casos.",
                bullets: ["CRV pós-2021", "gov.br Prata ou Ouro", "Sem cartório"],
              },
              {
                key: "tradicional" as const,
                title: "Tradicional",
                badge: null,
                icon: FileSignature,
                desc: "ATPV-e ou CRV com firma reconhecida + vistoria em ECV.",
                bullets: ["Cartório (firma)", "Vistoria ECV", "Validade 60 dias"],
              },
            ]).map((opt) => {
              const selected = fluxo === opt.key;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.key}
                  onClick={() => setFluxo(opt.key)}
                  className={cn(
                    "relative flex flex-col gap-3 rounded-xl border bg-card p-5 text-left transition-all",
                    selected
                      ? "border-primary shadow-md ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40 hover:shadow-sm",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      "flex size-10 items-center justify-center rounded-lg transition",
                      selected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                    )}>
                      <Icon className="size-5" />
                    </div>
                    {opt.badge && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                        <Sparkles className="size-3" /> {opt.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{opt.title}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  <ul className="space-y-1">
                    {opt.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Check className="size-3 text-primary" /> {b}
                      </li>
                    ))}
                  </ul>
                  {selected && (
                    <div className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground sm:hidden">
                      <Check className="size-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-semibold">Partes envolvidas</h3>
            <p className="text-sm text-muted-foreground">Confirme o vendedor e informe o comprador.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <PartyCard
              role="vendedor"
              nome={deNome}
              tipo={deTipo}
              doc={deDoc}
              cadastrado={!!vendedorEncontrado}
              editavel={vendedorEditavel}
              onEdit={() => setVendedorEditavel(true)}
              onCancelEdit={() => setVendedorEditavel(false)}
              onChangeNome={setDeNome}
              onChangeTipo={setDeTipo}
              onChangeDoc={setDeDoc}
              onSelectProprietario={(p) => {
                setDeTipo(p.tipoPessoa);
                setDeDoc((p.tipoPessoa === "PF" ? p.cpf : p.cnpj) ?? "");
              }}
            />

            <PartyCard
              role="comprador"
              nome={paraNome}
              tipo={paraTipo}
              doc={paraDoc}
              editavel
              onChangeNome={setParaNome}
              onChangeTipo={setParaTipo}
              onChangeDoc={setParaDoc}
              onSelectProprietario={(p) => {
                setParaTipo(p.tipoPessoa);
                setParaDoc((p.tipoPessoa === "PF" ? p.cpf : p.cnpj) ?? "");
              }}
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Revisão final</h3>
            <p className="text-sm text-muted-foreground">Confira os dados antes de criar a transferência.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <CarIcon className="size-3.5" /> Veículo
              </div>
              <div className="mt-2 font-mono text-lg font-bold">
                {veiculo ? fmtPlaca(veiculo.placa) : "—"}
              </div>
              <div className="text-xs text-muted-foreground">
                {veiculo ? `${veiculo.marca} ${veiculo.modelo}` : ""}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Zap className="size-3.5" /> Fluxo
              </div>
              <div className="mt-2 font-semibold">
                {fluxo === "tdv" ? "Transferência Digital (TDV)" : "Tradicional"}
              </div>
              <div className="text-xs text-muted-foreground">
                {fluxo === "tdv" ? "~5 minutos · 100% online" : "Cartório + vistoria"}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <User className="size-3.5" /> Vendedor
                </div>
                <div className="mt-2 font-semibold truncate">{deNome || "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {deTipo} · {deDoc ? fmtDoc(deTipo, deDoc) : "—"}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <ShoppingCart className="size-3.5" /> Comprador
                </div>
                <div className="mt-2 font-semibold truncate">{paraNome || "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {paraTipo} · {paraDoc ? fmtDoc(paraTipo, paraDoc) : "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/80">
            <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              Ao criar, será gerado um checklist com <strong>{fluxo === "tdv" ? "7" : "8"} etapas</strong> e prazos legais (CTB).
            </span>
          </div>
        </div>
      )}

      <DialogFooter className="-mx-6 -mb-6 mt-2 flex flex-row items-center justify-between gap-2 border-t border-border bg-muted/30 px-6 py-4 sm:justify-between">
        <div className="text-xs text-muted-foreground">
          Etapa <span className="font-semibold text-foreground">{step}</span> de {STEPS.length}
        </div>
        <div className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={prev}>
              <ChevronLeft className="mr-1 size-4" /> Voltar
            </Button>
          )}
          {step < 4 && (
            <Button
              onClick={next}
              disabled={
                (step === 1 && !veiculoId) ||
                (step === 3 && (!deNome || !deDoc || !paraNome || !paraDoc))
              }
            >
              Próximo <ChevronRight className="ml-1 size-4" />
            </Button>
          )}
          {step === 4 && (
            <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
              {createMut.isPending ? "Criando..." : (<><Check className="mr-1.5 size-4" /> Criar transferência</>)}
            </Button>
          )}
        </div>
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
            <DialogTrigger asChild>
              <Button><Plus className="mr-1.5 size-4" /> Nova Transferência</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
              <DialogHeader className="space-y-1 border-b border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                    <ArrowRightLeft className="size-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">Nova Transferência</DialogTitle>
                    <DialogDescription className="text-xs">
                      Siga as 4 etapas para criar uma transferência de propriedade.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="px-6 py-6">
                <Wizard onClose={() => setOpen(false)} />
              </div>
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
