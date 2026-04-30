import type {
  Veiculo, Pendencia, IPVA, Licenciamento, Seguro, Transferencia, Credencial, User,
} from "@/types";

const delay = <T>(data: T, ms = 300) =>
  new Promise<T>((r) => setTimeout(() => r(data), ms));

const today = new Date();
const addDays = (d: number) => {
  const x = new Date(today); x.setDate(x.getDate() + d); return x.toISOString();
};

const veiculos: Veiculo[] = [
  {
    id: "v1", placa: "ABC1D23", marca: "Honda", modelo: "Civic EXL", ano: 2020,
    cor: "Prata", combustivel: "Flex", chassi: "9BWZZZ377VT004251", renavam: "01234567890",
    proprietario: "João Silva", status: "ok", proximaAcao: "Tudo em dia",
    indicadores: { ipva: "ok", licenciamento: "ok", seguro: "ok" },
  },
  {
    id: "v2", placa: "XYZ4E56", marca: "Volkswagen", modelo: "Gol 1.0", ano: 2018,
    cor: "Branco", combustivel: "Flex", chassi: "9BWAA05Y56P011223", renavam: "11223344556",
    proprietario: "João Silva", status: "atencao", proximaAcao: "IPVA vence em 8 dias",
    indicadores: { ipva: "atencao", licenciamento: "ok", seguro: "atencao" },
  },
  {
    id: "v3", placa: "DEF7G89", marca: "Toyota", modelo: "Hilux SRX", ano: 2022,
    cor: "Preto", combustivel: "Diesel", chassi: "8AJBA3FK4N1599321", renavam: "22334455667",
    proprietario: "João Silva", status: "urgente", proximaAcao: "Multa não paga",
    indicadores: { ipva: "ok", licenciamento: "atencao", seguro: "urgente" },
  },
  {
    id: "v4", placa: "GHI0J12", marca: "Chevrolet", modelo: "Onix LT", ano: 2019,
    cor: "Vermelho", combustivel: "Flex", chassi: "9BGKS48U0KG112233", renavam: "33445566778",
    proprietario: "João Silva", status: "ok", proximaAcao: "Licenciamento em 45 dias",
    indicadores: { ipva: "ok", licenciamento: "ok", seguro: "ok" },
  },
];

const pendencias: Pendencia[] = [
  { id: "p1", veiculoId: "v3", tipo: "multa", descricao: "Excesso de velocidade - 20% acima", valor: 195.23, prazo: addDays(2), status: "urgente" },
  { id: "p2", veiculoId: "v3", tipo: "debito", descricao: "DPVAT 2025 em atraso", valor: 87.5, prazo: addDays(-5), status: "urgente" },
  { id: "p3", veiculoId: "v2", tipo: "debito", descricao: "IPVA 1ª parcela", valor: 642.18, prazo: addDays(8), status: "atencao" },
  { id: "p4", veiculoId: "v2", tipo: "multa", descricao: "Estacionar em local proibido", valor: 130.16, prazo: addDays(15), status: "atencao" },
  { id: "p5", veiculoId: "v1", tipo: "restricao", descricao: "Restrição administrativa - regularizar dados", valor: 0, prazo: addDays(20), status: "atencao" },
  { id: "p6", veiculoId: "v4", tipo: "debito", descricao: "Licenciamento 2026", valor: 158.4, prazo: addDays(45), status: "ok" },
  { id: "p7", veiculoId: "v3", tipo: "multa", descricao: "Avanço de sinal vermelho", valor: 293.47, prazo: addDays(30), status: "atencao" },
];

const ipvas: IPVA[] = veiculos.map((v, i) => ({
  id: `ipva-${v.id}`, veiculoId: v.id, ano: 2026,
  valor: 1250 + i * 320, vencimento: addDays(8 + i * 30), pago: i === 0 || i === 3, parcelas: 3,
}));

const licenciamentos: Licenciamento[] = veiculos.map((v, i) => ({
  id: `lic-${v.id}`, veiculoId: v.id, ano: 2026,
  valor: 158.4, pago: i !== 2, vencimento: addDays(45 + i * 10),
}));

const seguros: Seguro[] = veiculos.map((v, i) => ({
  id: `seg-${v.id}`, veiculoId: v.id,
  seguradora: ["Porto Seguro", "Bradesco Seguros", "Allianz", "SulAmérica"][i],
  apolice: `AP-${100000 + i}`,
  cobertura: "Compreensiva (colisão, roubo, terceiros)",
  inicio: addDays(-200 + i * 30), fim: addDays(165 - i * 80), vigente: i !== 2,
}));

const transferencias: Transferencia[] = [
  { id: "t1", veiculoId: "v4", deNome: "Maria Souza", deCpf: "12345678901", paraNome: "João Silva", paraCpf: "98765432112", inicio: addDays(-90), status: "concluida" },
  { id: "t2", veiculoId: "v2", deNome: "João Silva", deCpf: "98765432112", paraNome: "Carlos Lima", paraCpf: "11122233344", inicio: addDays(-7), status: "andamento" },
];

const user: User = { id: "u1", email: "joao.silva@email.com", nome: "João Silva" };

let credenciais: Credencial[] = [];
let masterPasswordHash: string | null = null;

export const mockApi = {
  // auth
  async sendMagicLink(email: string) { return delay({ ok: true, email }, 600); },
  async verifyToken(_token: string) {
    return delay({ token: "fake-jwt-" + Date.now(), user }, 400);
  },
  async me() { return delay(user); },

  // veiculos
  async listVeiculos() { return delay(veiculos); },
  async getVeiculo(id: string) { return delay(veiculos.find((v) => v.id === id) ?? null); },

  // pendencias
  async listPendencias() { return delay(pendencias); },
  async listPendenciasByVeiculo(id: string) { return delay(pendencias.filter((p) => p.veiculoId === id)); },

  // financeiro
  async listIpvas() { return delay(ipvas); },
  async listLicenciamentos() { return delay(licenciamentos); },
  async listSeguros() { return delay(seguros); },

  // transferencias
  async listTransferencias() { return delay(transferencias); },

  // cofre
  async vaultStatus() { return delay({ initialized: !!masterPasswordHash }); },
  async vaultSetup(master: string) { masterPasswordHash = btoa(master); return delay({ ok: true }, 400); },
  async vaultUnlock(master: string) {
    if (!masterPasswordHash) return delay({ ok: false, reason: "not-initialized" as const }, 400);
    const ok = btoa(master) === masterPasswordHash;
    return delay(ok ? { ok: true, token: "vault-" + Date.now(), expiresIn: 30 * 60 } : { ok: false, reason: "invalid" as const }, 400);
  },
  async listCredenciais() { return delay(credenciais); },
  async addCredencial(c: Omit<Credencial, "id">) {
    const novo = { ...c, id: "c" + Date.now() };
    credenciais = [...credenciais, novo]; return delay(novo);
  },
  async removeCredencial(id: string) {
    credenciais = credenciais.filter((c) => c.id !== id); return delay({ ok: true });
  },
};