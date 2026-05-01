import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";

const PREFS_KEY = "garagem.prefs";

type Prefs = {
  notificacoesEmail: boolean;
  alertasVencimento: boolean;
  tema: "claro" | "escuro" | "sistema";
};

const defaultPrefs: Prefs = {
  notificacoesEmail: true,
  alertasVencimento: true,
  tema: "sistema",
};

export default function Configuracoes() {
  const { user, logout } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);

  useEffect(() => {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      try { setPrefs({ ...defaultPrefs, ...JSON.parse(raw) }); } catch { /* ignore */ }
    }
  }, []);

  const updatePref = <K extends keyof Prefs>(k: K, v: Prefs[K]) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    toast.success("Preferência salva");
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <>
      <PageHeader
        title="Configurações"
        subtitle="Preferências da conta e notificações"
      />

      <div className="max-w-3xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Conta</h2>
            <p className="text-sm text-muted-foreground">Dados da sua sessão atual.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nome</Label>
              <Input value={user?.nome ?? ""} disabled />
            </div>
            <div>
              <Label>Email de acesso</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Para editar dados de proprietário (CPF/CNPJ, endereço), acesse <Link to="/cadastros" className="text-primary underline">Cadastros</Link>.
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Notificações</h2>
            <p className="text-sm text-muted-foreground">Como você quer ser avisado sobre pendências e vencimentos.</p>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
            <div>
              <div className="font-medium text-sm">Notificações por email</div>
              <div className="text-xs text-muted-foreground">Receber resumo semanal e alertas no email cadastrado.</div>
            </div>
            <Switch checked={prefs.notificacoesEmail} onCheckedChange={(v) => updatePref("notificacoesEmail", v)} />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
            <div>
              <div className="font-medium text-sm">Alertas de vencimento</div>
              <div className="text-xs text-muted-foreground">Avisar quando IPVA, licenciamento ou seguro estiverem próximos do vencimento.</div>
            </div>
            <Switch checked={prefs.alertasVencimento} onCheckedChange={(v) => updatePref("alertasVencimento", v)} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Sessão</h2>
            <p className="text-sm text-muted-foreground">Encerre o acesso neste dispositivo.</p>
          </div>
          <Button variant="destructive" onClick={handleLogout}>Sair da conta</Button>
        </div>
      </div>
    </>
  );
}
