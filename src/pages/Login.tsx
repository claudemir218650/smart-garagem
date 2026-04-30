import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Car, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const schema = z.object({ email: z.string().email("Email inválido") });
type Form = z.infer<typeof schema>;

export default function Login() {
  const [sent, setSent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      await api.sendMagicLink(data.email);
      setSent(data.email);
    } catch {
      toast.error("Não foi possível enviar o link. Tente novamente.");
    } finally { setLoading(false); }
  };

  const fakeAccept = async () => {
    if (!sent) return;
    setLoading(true);
    try {
      const nome = sent.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const { token, user } = await api.verifyToken("dev", sent, nome);
      loginWithToken(token, user);
      toast.success("Bem-vindo!");
      navigate("/", { replace: true });
    } catch {
      toast.error("Falha ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Car className="size-7" />
          </div>
          <h1 className="text-2xl font-bold">Garagem</h1>
          <p className="text-sm text-muted-foreground">Gestão de Veículos</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          {!sent ? (
            <>
              <h2 className="text-xl font-semibold">Entrar na Garagem</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Você receberá um link mágico no seu email. Sem senha pra decorar.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="voce@email.com" {...register("email")} />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <Mail className="mr-2 size-4" /> {loading ? "Enviando…" : "Enviar link de acesso"}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
                <Mail className="size-6" />
              </div>
              <h2 className="text-xl font-semibold">Link enviado!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Verifique <span className="font-medium text-foreground">{sent}</span> e clique no link para entrar.
              </p>
              <div className="mt-6 space-y-2">
                <Button onClick={fakeAccept} className="w-full" disabled={loading}>
                  Simular clique no link (demo)
                </Button>
                <button onClick={() => setSent(null)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="size-3" /> trocar email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}