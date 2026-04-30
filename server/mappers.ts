// Conversão de linhas SQL (snake_case) para o formato camelCase usado no frontend.

export const toVeiculo = (r: any) => ({
  id: r.id,
  placa: r.placa,
  marca: r.marca,
  modelo: r.modelo,
  ano: r.ano,
  cor: r.cor,
  combustivel: r.combustivel,
  chassi: r.chassi,
  renavam: r.renavam,
  proprietario: r.proprietario,
  fotoUrl: r.foto_url ?? undefined,
  status: r.status,
  proximaAcao: r.proxima_acao,
  indicadores: {
    ipva: r.ind_ipva,
    licenciamento: r.ind_licenc,
    seguro: r.ind_seguro,
  },
});

export const toPendencia = (r: any) => ({
  id: r.id,
  veiculoId: r.veiculo_id,
  tipo: r.tipo,
  descricao: r.descricao,
  valor: Number(r.valor),
  prazo: new Date(r.prazo).toISOString(),
  status: r.status,
});

export const toIpva = (r: any) => ({
  id: r.id,
  veiculoId: r.veiculo_id,
  ano: r.ano,
  valor: Number(r.valor),
  vencimento: new Date(r.vencimento).toISOString(),
  pago: r.pago,
  parcelas: r.parcelas,
});

export const toLicenciamento = (r: any) => ({
  id: r.id,
  veiculoId: r.veiculo_id,
  ano: r.ano,
  valor: Number(r.valor),
  pago: r.pago,
  vencimento: new Date(r.vencimento).toISOString(),
});

export const toSeguro = (r: any) => ({
  id: r.id,
  veiculoId: r.veiculo_id,
  seguradora: r.seguradora,
  apolice: r.apolice,
  cobertura: r.cobertura,
  inicio: new Date(r.inicio).toISOString(),
  fim: new Date(r.fim).toISOString(),
  vigente: r.vigente,
});

export const toTransferencia = (r: any) => ({
  id: r.id,
  veiculoId: r.veiculo_id,
  deNome: r.de_nome,
  deCpf: r.de_cpf,
  paraNome: r.para_nome,
  paraCpf: r.para_cpf,
  inicio: new Date(r.inicio).toISOString(),
  status: r.status,
});

export const toCredencial = (r: any) => ({
  id: r.id,
  label: r.label,
  cpf: r.cpf,
  ultimoUso: r.ultimo_uso ? new Date(r.ultimo_uso).toISOString() : undefined,
});

export const toUser = (r: any) => ({
  id: r.id,
  email: r.email,
  nome: r.nome,
});
