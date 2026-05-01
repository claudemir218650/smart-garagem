// Regras de transferência veicular para São Paulo.
// Isolado por UF: novos estados entram em arquivos irmãos (ex.: rj.ts).

export type Fluxo = "tdv" | "tradicional";

export interface EtapaDef {
  codigo: string;
  titulo: string;
  descricao: string;
  // Quando concluída, gera uma Pendencia com este prazo (em dias) — para alertar.
  prazoConclusaoDias?: number;
  // Texto da pendência gerada quando concluir esta etapa.
  pendenciaAoConcluir?: { tipo: "multa" | "debito" | "restricao"; descricao: string; prazoDias: number };
  links?: { label: string; url: string }[];
}

const PORTAL_DETRAN = "https://www.detran.sp.gov.br";
const TDV_PORTAL    = "https://www.transferenciadigital.detran.sp.gov.br";
const POUPATEMPO    = "https://www.poupatempo.sp.gov.br";

export const ETAPAS_SP: Record<Fluxo, EtapaDef[]> = {
  tdv: [
    {
      codigo: "verificar_debitos",
      titulo: "Verificar débitos",
      descricao: "Confira IPVA, licenciamento, multas e restrições antes de iniciar a TDV.",
      links: [{ label: "Consultar débitos", url: `${PORTAL_DETRAN}/wps/portal/portaldetran/cidadao/veiculos` }],
    },
    {
      codigo: "dados_comprador",
      titulo: "Dados do comprador",
      descricao: "CPF/CNPJ, nome e endereço. Comprador precisa ter login gov.br nível Prata ou Ouro.",
    },
    {
      codigo: "iniciar_tdv_vendedor",
      titulo: "Iniciar TDV (vendedor)",
      descricao: "Acesse o portal TDV, faça reconhecimento facial e indique o comprador.",
      links: [{ label: "Portal TDV", url: TDV_PORTAL }],
    },
    {
      codigo: "aceite_comprador",
      titulo: "Aceite do comprador",
      descricao: "Comprador faz reconhecimento facial e assina digitalmente.",
    },
    {
      codigo: "pagamento_taxa",
      titulo: "Pagamento da taxa",
      descricao: "Pagamento via Pix ou banco conveniado. Licenciamento em dia: ~R$ 295,83. Com pendências: ~R$ 469,91.",
      links: [{ label: "Tabela de taxas Detran-SP", url: `${PORTAL_DETRAN}/taxas/` }],
    },
    {
      codigo: "comunicacao_venda",
      titulo: "Comunicação de venda (vendedor)",
      descricao: "Obrigatório por lei (CTB art. 134) — em até 30 dias após a venda. Livra o vendedor de multas/IPVA do novo dono.",
      links: [{ label: "Comunicar venda no Detran-SP", url: `${PORTAL_DETRAN}/comunicacao-de-venda/` }],
      prazoConclusaoDias: 30,
    },
    {
      codigo: "crlv_emitido",
      titulo: "CRLV-e do novo proprietário",
      descricao: "Receba o CRLV-e digital emitido em nome do comprador. Encerra a transferência.",
      links: [{ label: "Baixar CRLV-e (Carteira Digital de Trânsito)", url: "https://www.gov.br/pt-br/servicos/obter-a-carteira-digital-de-transito" }],
    },
  ],

  tradicional: [
    {
      codigo: "verificar_debitos",
      titulo: "Verificar débitos",
      descricao: "IPVA, licenciamento, multas e restrições devem estar quitados.",
      links: [{ label: "Consultar débitos", url: `${PORTAL_DETRAN}/wps/portal/portaldetran/cidadao/veiculos` }],
    },
    {
      codigo: "dados_comprador",
      titulo: "Dados do comprador",
      descricao: "CPF/CNPJ, nome, endereço e comprovante.",
    },
    {
      codigo: "atpv_ou_crv",
      titulo: "ATPV-e ou CRV com firma reconhecida",
      descricao: "CRLVs pós-2021 usam ATPV-e (digital). CRVs antigos exigem firma reconhecida em cartório (vendedor e comprador).",
      links: [
        { label: "Como obter o ATPV-e (Senatran)", url: "https://www.gov.br/pt-br/servicos/obter-autorizacao-para-transferencia-de-propriedade-de-veiculo" },
      ],
    },
    {
      codigo: "vistoria",
      titulo: "Vistoria veicular (ECV credenciada)",
      descricao: "Validade de 60 dias a partir da emissão do laudo.",
      pendenciaAoConcluir: { tipo: "restricao", descricao: "Vistoria veicular expira", prazoDias: 60 },
      links: [{ label: "ECVs credenciadas Detran-SP", url: `${PORTAL_DETRAN}/vistoria-veicular/` }],
    },
    {
      codigo: "pagamento_taxa",
      titulo: "Pagamento da taxa de transferência",
      descricao: "Licenciamento em dia: ~R$ 295,83. Com pendências: ~R$ 469,91.",
      links: [{ label: "Tabela de taxas Detran-SP", url: `${PORTAL_DETRAN}/taxas/` }],
    },
    {
      codigo: "solicitacao_detran",
      titulo: "Solicitação no Detran-SP",
      descricao: "Protocole online ou via Poupatempo. Processamento em até 3 dias úteis.",
      links: [
        { label: "Portal Detran-SP", url: PORTAL_DETRAN },
        { label: "Poupatempo", url: POUPATEMPO },
      ],
    },
    {
      codigo: "comunicacao_venda",
      titulo: "Comunicação de venda (vendedor)",
      descricao: "Obrigatório por lei (CTB art. 134) — em até 30 dias após a venda.",
      links: [{ label: "Comunicar venda no Detran-SP", url: `${PORTAL_DETRAN}/comunicacao-de-venda/` }],
      prazoConclusaoDias: 30,
    },
    {
      codigo: "crlv_emitido",
      titulo: "CRLV-e do novo proprietário",
      descricao: "Documento emitido em nome do comprador. Encerra a transferência.",
    },
  ],
};

export function etapasParaFluxo(uf: string, fluxo: Fluxo): EtapaDef[] {
  if (uf !== "SP") return ETAPAS_SP[fluxo]; // fallback: usa SP até termos outros
  return ETAPAS_SP[fluxo];
}
