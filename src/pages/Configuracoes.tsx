import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function Configuracoes() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Configurações" subtitle="Preferências da conta" />
      <div className="max-w-xl rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div><Label>Nome</Label><Input defaultValue={user?.nome} /></div>
        <div><Label>Email</Label><Input defaultValue={user?.email} disabled /></div>
        <Button>Salvar alterações</Button>
      </div>
    </>
  );
}