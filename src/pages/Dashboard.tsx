import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, Plus, Car, AlertTriangle, CalendarClock, ArrowRightLeft, Search, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtData, diasAte } from "@/lib/format";
import { useNavigate } from "react-router-dom";

function Kpi({ icon: Icon, label, value, footer, footerTone = "default" }: any) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
      {footer && (
        <div className={
          footerTone === "danger" ? "mt-1 text-xs font-medium text-destructive" :
          footerTone === "warn" ? "mt-1 text-xs font-medium text-warning" :
          footerTone === "success" ? "mt-1 text-xs font-medium text-success" :
          "mt-1 text-xs text-muted-foreground"
        }>{footer}</div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const veiculosQ = useQuery({ queryKey: ["veiculos"], queryFn: api.listVeiculos });
  const pendQ = useQuery({ queryKey: ["pendencias"], queryFn: api.listPendencias });
  const transfQ = useQuery({ queryKey: ["transferencias"], queryFn: api.listTransferencias });

  const veiculos = veiculosQ.data ?? [];
  const pendencias = pendQ.data ?? [];
  const transfs = transfQ.data ?? [];

  const proximas = [...pendencias].sort((a, b) => +new Date(a.prazo) - +new Date(b.prazo)).slice(0, 5);
  const filtered = veiculos.filter((v) =>
    [v.placa, v.modelo, v.marca, v.renavam].some((s) => s.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral dos seus veículos"
        actions={
          <>
            <button className="relative rounded-lg border border-border bg-card p-2 hover:bg-muted" aria-label="Notificações">
              <Bell className="size-4" />
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">3</span>
            </button>
            <Button onClick={() => navigate("/veiculos")}>
              <Plus className="mr-1.5 size-4" /> Adicionar Veículo
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {veiculosQ.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : (
          <>
            <Kpi icon={Car} label="Total de Veículos" value={veiculos.length} footer="+1 este mês" footerTone="success" />
            <Kpi icon={AlertTriangle} label="Pendências Abertas" value={pendencias.length}
              footer={`${pendencias.filter(p => p.status === "urgente").length} urgentes`} footerTone="danger" />
            <Kpi icon={CalendarClock} label="Próximo Vencimento" value="IPVA Civic" footer="vence em 8 dias" footerTone="warn" />
            <Kpi icon={ArrowRightLeft} label="Transferências Ativas"
              value={transfs.filter(t => t.status === "andamento").length}
              footer="1 aguardando assinatura" />
          </>
        )}
      </div>

      {/* Próximas pendências */}
      <section className="mt-8 rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Próximas Pendências</h2>
            <p className="text-xs text-muted-foreground">Próximos 5 itens por prazo</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/pendencias")}>Ver todas</Button>
        </div>
        <ul className="divide-y divide-border">
          {pendQ.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <li key={i} className="p-4"><Skeleton className="h-10 w-full" /></li>)
            : proximas.map((p) => {
                const v = veiculos.find((x) => x.id === p.veiculoId);
                const dias = diasAte(p.prazo);
                return (
                  <li key={p.id} className="flex items-center gap-4 px-5 py-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <AlertTriangle className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        {v?.placa} · {v?.modelo}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{p.descricao}</div>
                    </div>
                    <StatusBadge status={p.status}
                      label={dias < 0 ? `${Math.abs(dias)}d em atraso` : `vence em ${dias}d`} />
                    <Button variant="outline" size="sm">Resolver</Button>
                  </li>
                );
              })}
        </ul>
      </section>

      {/* Veículos Recentes */}
      <section className="mt-8 rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Veículos Recentes</h2>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por placa, modelo, RENAVAM..."
              value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Placa</th>
                <th className="px-5 py-3 text-left font-medium">Modelo</th>
                <th className="px-5 py-3 text-left font-medium">Ano</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Próxima ação</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/veiculos/${v.id}`)}>
                  <td className="px-5 py-3 font-mono font-semibold">{v.placa}</td>
                  <td className="px-5 py-3">{v.marca} {v.modelo}</td>
                  <td className="px-5 py-3 text-muted-foreground">{v.ano}</td>
                  <td className="px-5 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-5 py-3 text-muted-foreground">{v.proximaAcao}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="rounded-md p-1 hover:bg-muted" aria-label="Mais"><MoreHorizontal className="size-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}