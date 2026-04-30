export const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtData = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
};

export const diasAte = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

export const maskCpf = (cpf: string) => {
  const d = cpf.replace(/\D/g, "");
  if (d.length < 11) return cpf;
  return `***.***.***-${d.slice(-2)}`;
};

export const fmtCpf = (cpf: string) => {
  const d = cpf.replace(/\D/g, "");
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export const maskRenavam = (r: string) => {
  if (!r) return "";
  const d = r.replace(/\D/g, "");
  return `*******${d.slice(-4)}`;
};

export const fmtPlaca = (p: string) => {
  if (!p) return "";
  const s = p.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (s.length <= 3) return s;
  return `${s.slice(0, 3)}-${s.slice(3, 7)}`;
};

export const iniciais = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");