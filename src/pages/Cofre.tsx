import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Lock, ShieldCheck, Plus, Trash2, Edit, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { api, vault } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { maskCpf, fmtCpf } from "@/lib/format";
import { toast } from "sonner";

function useCountdown() {
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, []);
  const remaining = Math.max(0, vault.getExpires() - Date.now());
  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining / 1000) % 60);
  return { remaining, label: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` };
}

function Onboarding({ onDone }: { onDone: () => void }) {
  const schema = z.object({
    master: z.string().min(8, "Mínimo 8 caracteres"),
    confirm: z.string(),
    accept: z.literal(true, { errorMap: () => ({ message: "Você precisa aceitar" }) }),
  }).refine((d) => d.master === d.confirm, { path: ["confirm"], message: "As senhas não coincidem" });
  type Form = z.infer<typeof schema>;
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { accept: undefined as any } });

  const master = watch("master") ?? "";
  const strength = Math.min(4, [master.length >= 8, /[A-Z]/.test(master), /\d/.test(master), /[^A-Za-z0-9]/.test(master)].filter(Boolean).length);

  const submit = async (data: Form) => {
    await api.vaultSetup(data.master);
    toast.success("Cofre configurado!");
    onDone();
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <ShieldCheck className="size-6" />
      </div>
      <h2 className="text-xl font-semibold">Configurar Cofre</h2>
      <p className="mt-1 text-sm text-muted-foreground">Crie uma master password para proteger suas credenciais Gov.br.</p>
      <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-4">
        <div>
          <Label>Master password</Label>
          <Input type="password" {...register("master")} />
          <div className="mt-2 flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`h-1.5 flex-1 rounded ${i < strength ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          {errors.master && <p className="mt-1 text-xs text-destructive">{errors.master.message}</p>}
        </div>
        <div>
          <Label>Confirmar master password</Label>
          <Input type="password" {...register("confirm")} />
          {errors.confirm && <p className="mt-1 text-xs text-destructive">{errors.confirm.message}</p>}
        </div>
        <label className="flex items-start gap-2 text-xs">
          <Checkbox onCheckedChange={(c) => (document.getElementById("accept") as any)?.click()} />
          <input id="accept" type="checkbox" className="hidden" {...register("accept")} />
          <span className="text-muted-foreground">Entendo que se eu esquecer essa senha, perderei acesso às credenciais salvas.</span>
        </label>
        {errors.accept && <p className="-mt-2 text-xs text-destructive">{errors.accept.message as string}</p>}
        <Button className="w-full" type="submit">Criar Cofre</Button>
      </form>
    </div>
  );
}

function Locked({ onUnlock }: { onUnlock: () => void }) {
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const tryUnlock = async () => {
    setLoading(true);
    const r = await api.vaultUnlock(pwd);
    setLoading(false);
    if (r.ok) {
      vault.set(r.token!, r.expiresIn!);
      toast.success("Cofre desbloqueado");
      onUnlock();
    } else toast.error("Master password incorreta");
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Lock className="size-7" />
      </div>
      <h2 className="text-xl font-semibold">Cofre bloqueado</h2>
      <p className="mt-1 text-sm text-muted-foreground">Digite sua master password para acessar suas credenciais.</p>
      <div className="mt-6 space-y-3 text-left">
        <div>
          <Label>Master password</Label>
          <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryUnlock()} />
        </div>
        <Button className="w-full" onClick={tryUnlock} disabled={loading || !pwd}>
          {loading ? "Desbloqueando…" : "Desbloquear"}
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Sua master password nunca é armazenada. Em caso de esquecimento, você precisará re-cadastrar suas credenciais.
      </p>
    </div>
  );
}

function Unlocked({ onLock }: { onLock: () => void }) {
  const qc = useQueryClient();
  const { label, remaining } = useCountdown();
  const credQ = useQuery({ queryKey: ["credenciais"], queryFn: api.listCredenciais });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ label: "", cpf: "", senha: "" });

  useEffect(() => { if (remaining === 0) onLock(); }, [remaining, onLock]);

  const add = async () => {
    if (!form.label || !form.cpf) return;
    await api.addCredencial({ label: form.label, cpf: form.cpf });
    qc.invalidateQueries({ queryKey: ["credenciais"] });
    toast.success("Credencial adicionada");
    setForm({ label: "", cpf: "", senha: "" });
    setOpen(false);
  };

  const remove = async (id: string) => {
    await api.removeCredencial(id);
    qc.invalidateQueries({ queryKey: ["credenciais"] });
    toast.success("Credencial removida");
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-success/30 bg-success/5 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck className="size-4 text-success" />
          <span className="font-medium">Cofre desbloqueado</span>
          <span className="text-muted-foreground">· expira em <span className="font-mono">{label}</span></span>
        </div>
        <Button variant="outline" size="sm" onClick={() => { vault.clear(); onLock(); }}>
          <Lock className="mr-1.5 size-4" /> Bloquear agora
        </Button>
      </div>

      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1.5 size-4" /> Adicionar Credencial</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova credencial Gov.br</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Label</Label><Input placeholder="Conta principal" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
              <div><Label>CPF</Label><Input placeholder="000.000.000-00" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></div>
              <div><Label>Senha Gov.br</Label><Input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={add}>Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {credQ.data?.length === 0 ? (
        <EmptyState icon={KeyRound} title="Nenhuma credencial salva" description="Adicione uma conta Gov.br para consultar débitos automaticamente." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {credQ.data?.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{c.label}</div>
                  <div className="text-xs text-muted-foreground">{maskCpf(c.cpf)}</div>
                </div>
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground"><KeyRound className="size-4" /></span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Última utilização: {c.ultimoUso ?? "—"}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline"><Search className="mr-1.5 size-3.5" /> Consultar débitos</Button>
                <Button size="sm" variant="ghost"><Edit className="size-3.5" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="size-3.5" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir credencial?</AlertDialogTitle>
                      <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(c.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function Cofre() {
  const statusQ = useQuery({ queryKey: ["vault-status"], queryFn: api.vaultStatus });
  const [unlocked, setUnlocked] = useState(vault.isUnlocked());
  const qc = useQueryClient();

  if (statusQ.isLoading) return <div className="h-64" />;

  return (
    <>
      <PageHeader title="Cofre Gov.br" subtitle="Suas credenciais protegidas por master password" />
      {!statusQ.data?.initialized ? (
        <Onboarding onDone={() => qc.invalidateQueries({ queryKey: ["vault-status"] })} />
      ) : !unlocked ? (
        <Locked onUnlock={() => setUnlocked(true)} />
      ) : (
        <Unlocked onLock={() => setUnlocked(false)} />
      )}
    </>
  );
}