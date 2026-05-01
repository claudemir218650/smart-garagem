import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Proprietario } from "@/types";

export function nomeProprietario(p: Proprietario) {
  return p.tipoPessoa === "PF"
    ? (p.nomeCompleto ?? p.cpf ?? "(sem nome)")
    : (p.razaoSocial ?? p.nomeFantasia ?? p.cnpj ?? "(sem razão)");
}

export interface ProprietarioComboboxProps {
  value: string;
  onChange: (nome: string) => void;
  onSelect?: (p: Proprietario) => void;
  placeholder?: string;
  id?: string;
  error?: string;
  emptyHint?: string;
}

export function ProprietarioCombobox({
  value, onChange, onSelect, placeholder = "Digite para buscar...", id, error, emptyHint,
}: ProprietarioComboboxProps) {
  const [query, setQuery] = useState(value);
  const [debounced, setDebounced] = useState(query);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["proprietarios", debounced],
    queryFn: () => api.listProprietarios(debounced || undefined),
    enabled: open,
    staleTime: 30_000,
  });

  const select = (p: Proprietario) => {
    const nome = nomeProprietario(p);
    onChange(nome);
    setQuery(nome);
    setOpen(false);
    onSelect?.(p);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <Input
        id={id}
        maxLength={150}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md">
          {isFetching && <div className="px-3 py-2 text-xs text-muted-foreground">Buscando…</div>}
          {!isFetching && (data?.length ?? 0) === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              {emptyHint ?? (
                <>Nenhum proprietário encontrado. <a href="/cadastros" className="text-primary underline">Cadastrar</a></>
              )}
            </div>
          )}
          {!isFetching && data?.map((p) => {
            const nome = nomeProprietario(p);
            const doc = p.tipoPessoa === "PF" ? p.cpf : p.cnpj;
            return (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(p); }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent",
                )}
              >
                <span className="truncate">{nome}</span>
                <span className="text-xs text-muted-foreground">{p.tipoPessoa} · {doc ?? ""}</span>
              </button>
            );
          })}
        </div>
      )}
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}
