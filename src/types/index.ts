export type StatusGeral = "ok" | "atencao" | "urgente";

export interface Veiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor: string;
  combustivel: string;
  chassi: string;
  renavam: string;
  proprietario: string;
  fotoUrl?: string;
  status: StatusGeral;
  proximaAcao: string;
  indicadores: { ipva: StatusGeral; licenciamento: StatusGeral; seguro: StatusGeral };
}

export type TipoPendencia = "multa" | "debito" | "restricao";
export interface Pendencia {
  id: string;
  veiculoId: string;
  tipo: TipoPendencia;
  descricao: string;
  valor: number;
  prazo: string; // ISO
  status: StatusGeral;
}

export interface IPVA {
  id: string; veiculoId: string; ano: number; valor: number; vencimento: string; pago: boolean; parcelas: number;
}
export interface Licenciamento {
  id: string; veiculoId: string; ano: number; valor: number; pago: boolean; vencimento: string;
}
export interface Seguro {
  id: string; veiculoId: string; seguradora: string; apolice: string; cobertura: string; inicio: string; fim: string; vigente: boolean;
}

export type StatusTransferencia = "rascunho" | "andamento" | "concluida" | "cancelada";
export interface Transferencia {
  id: string; veiculoId: string;
  deNome: string; deCpf: string;
  paraNome: string; paraCpf: string;
  inicio: string; status: StatusTransferencia;
}

export interface Credencial {
  id: string; label: string; cpf: string; ultimoUso?: string;
}

export interface User { id: string; email: string; nome: string; }