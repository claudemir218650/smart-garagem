import { cn } from "@/lib/utils";
import type { StatusGeral } from "@/types";

const map: Record<StatusGeral, { label: string; cls: string }> = {
  ok: { label: "OK", cls: "bg-success/10 text-success border-success/20" },
  atencao: { label: "Atenção", cls: "bg-warning/10 text-warning border-warning/30" },
  urgente: { label: "Urgente", cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function StatusBadge({ status, label, className }: { status: StatusGeral; label?: string; className?: string }) {
  const m = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", m.cls, className)}>
      <span className={cn("size-1.5 rounded-full",
        status === "ok" && "bg-success",
        status === "atencao" && "bg-warning",
        status === "urgente" && "bg-destructive")} />
      {label ?? m.label}
    </span>
  );
}