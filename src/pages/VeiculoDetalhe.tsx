import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Car, Edit, ArrowRightLeft, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtBRL, fmtData, diasAte, fmtPlaca } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

export default function VeiculoDetalhe() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const veiculoQ = useQuery({ queryKey: ["veiculo", id], queryFn: () => api.getVeiculo(id) });
  const pendQ = useQuery({ queryKey: ["pendencias", id], queryFn: () => api.listPendenciasByVeiculo(id) });
  const ipvaQ = useQuery({ queryKey: ["ipvas"], queryFn: api.listIpvas });
  const licQ = useQuery({ queryKey: ["licenciamentos"], queryFn: api.listLicenciamentos });
  const segQ = useQuery({ queryKey: ["seguros"], queryFn: api.listSeguros });

  if (veiculoQ.isLoading) return <Skeleton className="h-64 w-full" />;
  const v = veiculoQ.data;
  if (!v) return <EmptyState icon={Car} title="Veículo não encontrado" action={<Button onClick={() => navigate("/veiculos")}>Voltar</Button>} />;

  const ipvas = (ipvaQ.data ?? []).filter((x) => x.veiculoId === id);
  const lics = (licQ.data ?? []).filter((x) => x.veiculoId === id);
  const segs = (segQ.data ?? []).filter((x) => x.veiculoId === id);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-20 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
            <Car className="size-10 text-slate-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold">{fmtPlaca(v.placa)}</span>
              <StatusBadge status={v.status} />
            </div>
            <h1 className="mt-1 text-lg font-semibold">{v.marca} {v.modelo}</h1>
            <div className="text-sm text-muted-foreground">{v.ano} · {v.cor} · {v.combustivel}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Edit className="mr-1.5 size-4" /> Editar</Button>
          <Button onClick={() => navigate("/transferencias")}><ArrowRightLeft className="mr-1.5 size-4" /> Iniciar Transferência</Button>
        </div>
      </div>

      <Tabs defaultValue="geral">
        <TabsList className="flex-wrap">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="lic">Licenciamento</TabsTrigger>
          <TabsTrigger value="ipva">IPVA</TabsTrigger>
          <TabsTrigger value="seg">Seguro</TabsTrigger>
          <TabsTrigger value="pend">Pendências</TabsTrigger>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
          <TabsTrigger value="hist">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-4">
          <div className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-sm sm:grid-cols-2">
            {[
              ["Chassi", v.chassi], ["RENAVAM", v.renavam],
              ["Cor", v.cor], ["Combustível", v.combustivel],
              ["Proprietário", v.proprietario], ["Ano", String(v.ano)],
            ].map(([k, val]) => (
              <div key={k} className="flex justify-between border-b border-border/60 py-2 last:border-0">
                <span className="text-sm text-muted-foreground">{k}</span>
                <span className="text-sm font-medium">{val}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="lic" className="mt-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-4 py-3 text-left">Ano</th><th className="px-4 py-3 text-left">Vencimento</th><th className="px-4 py-3 text-left">Valor</th><th className="px-4 py-3 text-left">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lics.map((l) => (
                  <tr key={l.id}><td className="px-4 py-3">{l.ano}</td><td className="px-4 py-3">{fmtData(l.vencimento)}</td><td className="px-4 py-3">{fmtBRL(l.valor)}</td><td className="px-4 py-3"><StatusBadge status={l.pago ? "ok" : "urgente"} label={l.pago ? "Pago" : "Devendo"} /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="ipva" className="mt-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-4 py-3 text-left">Ano</th><th className="px-4 py-3 text-left">Parcelas</th><th className="px-4 py-3 text-left">Vencimento</th><th className="px-4 py-3 text-left">Valor</th><th className="px-4 py-3 text-left">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ipvas.map((i) => (
                  <tr key={i.id}><td className="px-4 py-3">{i.ano}</td><td className="px-4 py-3">{i.parcelas}x</td><td className="px-4 py-3">{fmtData(i.vencimento)}</td><td className="px-4 py-3">{fmtBRL(i.valor)}</td><td className="px-4 py-3"><StatusBadge status={i.pago ? "ok" : diasAte(i.vencimento) < 15 ? "atencao" : "ok"} label={i.pago ? "Pago" : "Em aberto"} /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="seg" className="mt-4">
          <div className="space-y-3">
            {segs.map((s) => (
              <div key={s.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{s.seguradora}</div>
                    <div className="text-xs text-muted-foreground">Apólice {s.apolice}</div>
                  </div>
                  <StatusBadge status={s.vigente ? "ok" : "urgente"} label={s.vigente ? "Vigente" : "Vencida"} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{s.cobertura}</p>
                <div className="mt-3 text-xs text-muted-foreground">Vigência: {fmtData(s.inicio)} → {fmtData(s.fim)}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pend" className="mt-4">
          {pendQ.data?.length ? (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card shadow-sm">
              {pendQ.data.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div>
                    <div className="text-sm font-medium capitalize">{p.tipo} · {p.descricao}</div>
                    <div className="text-xs text-muted-foreground">{p.valor > 0 ? fmtBRL(p.valor) : "Sem valor"} · prazo {fmtData(p.prazo)}</div>
                  </div>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          ) : <EmptyState icon={FileText} title="Sem pendências" description="Esse veículo está em dia." />}
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
          <div className="rounded-xl border-2 border-dashed border-border bg-card p-12 text-center">
            <Upload className="mx-auto mb-3 size-8 text-muted-foreground" />
            <div className="text-sm font-medium">Arraste arquivos aqui</div>
            <div className="text-xs text-muted-foreground">ou clique para selecionar PDFs e imagens</div>
          </div>
        </TabsContent>

        <TabsContent value="hist" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <ol className="relative space-y-4 border-l-2 border-border pl-6">
              <li className="relative">
                <span className="absolute -left-[31px] top-1 size-3 rounded-full bg-primary ring-4 ring-card" />
                <div className="text-sm font-medium">Veículo cadastrado na Garagem</div>
                <div className="text-xs text-muted-foreground">há 6 meses</div>
              </li>
              <li className="relative">
                <span className="absolute -left-[31px] top-1 size-3 rounded-full bg-muted-foreground/40 ring-4 ring-card" />
                <div className="text-sm font-medium">IPVA 2025 quitado</div>
                <div className="text-xs text-muted-foreground">há 4 meses</div>
              </li>
            </ol>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}