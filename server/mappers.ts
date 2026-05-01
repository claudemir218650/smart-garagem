// Conversão de linhas SQL (snake_case) para o formato camelCase usado no frontend.

export const toVeiculo = (r: any) => ({
  id: r.id,
  placa: r.placa,
  marca: r.marca,
  modelo: r.modelo,
  tipo: r.tipo ?? "Carro",
  ano: r.ano_modelo ?? r.ano,
  anoFabricacao: r.ano_fabricacao ?? r.ano,
  anoModelo: r.ano_modelo ?? r.ano,
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
  deCnpj: r.de_cnpj ?? undefined,
  paraNome: r.para_nome,
  paraCpf: r.para_cpf,
  paraCnpj: r.para_cnpj ?? undefined,
  inicio: new Date(r.inicio).toISOString(),
  status: r.status,
  fluxo: r.fluxo ?? undefined,
  uf: r.uf ?? "SP",
  observacoes: r.observacoes ?? undefined,
});

export const toEtapa = (r: any) => ({
  id: r.id,
  transferenciaId: r.transferencia_id,
  codigo: r.codigo,
  ordem: r.ordem,
  titulo: r.titulo,
  descricao: r.descricao ?? undefined,
  status: r.status,
  concluidaEm: r.concluida_em ? new Date(r.concluida_em).toISOString() : undefined,
  anexoUrl: r.anexo_url ?? undefined,
  observacao: r.observacao ?? undefined,
  prazoEm: r.prazo_em ? new Date(r.prazo_em).toISOString() : undefined,
});

export const toCredencial = (r: any) => ({
  id: r.id,
  label: r.label,
  cpf: r.cpf,
  ultimoUso: r.ultimo_uso ? new Date(r.ultimo_uso).toISOString() : undefined,
});

export const toProprietario = (r: any) => ({
  id: r.id,
  tipoPessoa: r.tipo_pessoa,
  nomeCompleto: r.nome_completo ?? undefined,
  cpf: r.cpf ?? undefined,
  dataNascimento: r.data_nascimento ? new Date(r.data_nascimento).toISOString().slice(0, 10) : undefined,
  razaoSocial: r.razao_social ?? undefined,
  nomeFantasia: r.nome_fantasia ?? undefined,
  cnpj: r.cnpj ?? undefined,
  email: r.email ?? undefined,
  telefone: r.telefone ?? undefined,
  endereco: {
    cep: r.cep,
    logradouro: r.logradouro,
    numero: r.numero,
    complemento: r.complemento ?? undefined,
    bairro: r.bairro,
    cidade: r.cidade,
    uf: r.uf,
  },
});

export const toUser = (r: any) => ({
  id: r.id,
  email: r.email,
  nome: r.nome,
});
