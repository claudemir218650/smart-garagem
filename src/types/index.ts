export type StatusGeral = "ok" | "atencao" | "urgente";

export type TipoVeiculo =
  | "Carro" | "Motocicleta" | "Motoneta" | "Camionete" | "Utilitário"
  | "Caminhão" | "Ônibus" | "Outro";

export interface Veiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  tipo: TipoVeiculo | string;
  ano: number;
  anoFabricacao: number;
  anoModelo: number;
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
export type FluxoTransferencia = "tdv" | "tradicional";
export type StatusEtapa = "pendente" | "em_andamento" | "concluida" | "dispensada";

export interface TransferenciaEtapa {
  id: string;
  transferenciaId: string;
  codigo: string;
  ordem: number;
  titulo: string;
  descricao?: string;
  status: StatusEtapa;
  concluidaEm?: string;
  anexoUrl?: string;
  observacao?: string;
  prazoEm?: string;
  links?: { label: string; url: string }[];
}

export interface Transferencia {
  id: string; veiculoId: string;
  deNome: string; deCpf: string; deCnpj?: string;
  paraNome: string; paraCpf: string; paraCnpj?: string;
  inicio: string; status: StatusTransferencia;
  fluxo?: FluxoTransferencia;
  uf?: string;
  observacoes?: string;
  etapas?: TransferenciaEtapa[];
}

export interface Credencial {
  id: string; label: string; cpf: string; ultimoUso?: string;
}

export interface User { id: string; email: string; nome: string; }

export type TipoPessoa = "PF" | "PJ";

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Proprietario {
  id: string;
  tipoPessoa: TipoPessoa;
  // PF
  nomeCompleto?: string;
  cpf?: string;
  dataNascimento?: string; // ISO yyyy-mm-dd
  // PJ
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  // contato
  email?: string;
  telefone?: string;
  endereco: Endereco;
}