import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Car, ArrowRightLeft, FileBadge, Receipt,
  ShieldCheck, AlertTriangle, FolderOpen, KeyRound, Settings, LogOut,
  ClipboardList, ChevronDown, User, CarFront,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { iniciais } from "@/lib/format";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/veiculos", label: "Veículos", icon: Car },
  { to: "/transferencias", label: "Transferências", icon: ArrowRightLeft },
  { to: "/licenciamento", label: "Licenciamento", icon: FileBadge },
  { to: "/ipva", label: "IPVA", icon: Receipt },
  { to: "/seguros", label: "Seguros", icon: ShieldCheck },
  { to: "/pendencias", label: "Pendências", icon: AlertTriangle },
  { to: "/documentos", label: "Documentos", icon: FolderOpen },
  { to: "/cofre", label: "Cofre Gov.br", icon: KeyRound },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

const cadastrosSubItems = [
  { to: "/cadastros?tab=proprietario", label: "Proprietário", icon: User, match: "proprietario" },
  { to: "/cadastros?tab=veiculo", label: "Veículo", icon: CarFront, match: "veiculo" },
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const cadastrosActive = location.pathname.startsWith("/cadastros");
  const [openCadastros, setOpenCadastros] = useState(cadastrosActive);
  const currentTab = new URLSearchParams(location.search).get("tab") ?? "proprietario";

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <Car className="size-5" />
        </div>
        <div className="leading-tight">
          <div className="text-base font-semibold text-white">Garagem</div>
          <div className="text-xs text-sidebar-foreground/70">Gestão de Veículos</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => setOpenCadastros((v) => !v)}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                cadastrosActive
                  ? "bg-sidebar-accent text-white before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-r before:bg-primary"
                  : "text-sidebar-foreground"
              )}
              aria-expanded={openCadastros}
            >
              <ClipboardList className="size-4" />
              <span className="flex-1 text-left">Cadastros</span>
              <ChevronDown
                className={cn("size-4 transition-transform", openCadastros && "rotate-180")}
              />
            </button>
            {openCadastros && (
              <ul className="mt-1 space-y-1 pl-4">
                {cadastrosSubItems.map(({ to, label, icon: Icon, match }) => {
                  const isActive = cadastrosActive && currentTab === match;
                  return (
                    <li key={to}>
                      <NavLink
                        to={to}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isActive
                            ? "bg-sidebar-accent text-white"
                            : "text-sidebar-foreground/80"
                        )}
                      >
                        <Icon className="size-4" />
                        <span>{label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>

          {items.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive
                      ? "bg-sidebar-accent text-white before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-r before:bg-primary"
                      : "text-sidebar-foreground"
                  )
                }
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-semibold">
            {iniciais(user?.nome ?? "User")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">{user?.nome ?? "Usuário"}</div>
            <div className="truncate text-xs text-sidebar-foreground/70">{user?.email ?? ""}</div>
          </div>
          <button
            onClick={logout}
            className="rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white transition"
            aria-label="Sair"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}