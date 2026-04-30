import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const sql = neon(process.env.DATABASE_URL);

  const addDays = (d: number) => {
    const x = new Date();
    x.setDate(x.getDate() + d);
    return x.toISOString();
  };

  console.log("Limpando dados antigos...");
  await sql`TRUNCATE TABLE
    transferencias, seguros, licenciamentos, ipvas, pendencias,
    veiculos, credenciais, vault_master, proprietarios, users
    RESTART IDENTITY CASCADE`;

  console.log("Inserindo usuário demo...");
  const [user] = await sql<{ id: string }[]>`
    INSERT INTO users (email, nome)
    VALUES ('joao.silva@email.com', 'João Silva')
    RETURNING id
  `;
  const userId = user.id;

  console.log("Inserindo veículos...");
  const veiculosSeed = [
    {
      placa: "ABC1D23", marca: "Honda", modelo: "Civic EXL", ano: 2020,
      cor: "Prata", combustivel: "Flex", chassi: "9BWZZZ377VT004251", renavam: "01234567890",
      proprietario: "João Silva", status: "ok", proxima_acao: "Tudo em dia",
      ind_ipva: "ok", ind_licenc: "ok", ind_seguro: "ok",
    },
    {
      placa: "XYZ4E56", marca: "Volkswagen", modelo: "Gol 1.0", ano: 2018,
      cor: "Branco", combustivel: "Flex", chassi: "9BWAA05Y56P011223", renavam: "11223344556",
      proprietario: "João Silva", status: "atencao", proxima_acao: "IPVA vence em 8 dias",
      ind_ipva: "atencao", ind_licenc: "ok", ind_seguro: "atencao",
    },
    {
      placa: "DEF7G89", marca: "Toyota", modelo: "Hilux SRX", ano: 2022,
      cor: "Preto", combustivel: "Diesel", chassi: "8AJBA3FK4N1599321", renavam: "22334455667",
      proprietario: "João Silva", status: "urgente", proxima_acao: "Multa não paga",
      ind_ipva: "ok", ind_licenc: "atencao", ind_seguro: "urgente",
    },
    {
      placa: "GHI0J12", marca: "Chevrolet", modelo: "Onix LT", ano: 2019,
      cor: "Vermelho", combustivel: "Flex", chassi: "9BGKS48U0KG112233", renavam: "33445566778",
      proprietario: "João Silva", status: "ok", proxima_acao: "Licenciamento em 45 dias",
      ind_ipva: "ok", ind_licenc: "ok", ind_seguro: "ok",
    },
  ];

  const veiculoIds: string[] = [];
  for (const v of veiculosSeed) {
    const [row] = await sql<{ id: string }[]>`
      INSERT INTO veiculos (
        user_id, placa, marca, modelo, ano, cor, combustivel,
        chassi, renavam, proprietario, status, proxima_acao,
        ind_ipva, ind_licenc, ind_seguro
      ) VALUES (
        ${userId}, ${v.placa}, ${v.marca}, ${v.modelo}, ${v.ano}, ${v.cor}, ${v.combustivel},
        ${v.chassi}, ${v.renavam}, ${v.proprietario}, ${v.status}::status_geral, ${v.proxima_acao},
        ${v.ind_ipva}::status_geral, ${v.ind_licenc}::status_geral, ${v.ind_seguro}::status_geral
      )
      RETURNING id
    `;
    veiculoIds.push(row.id);
  }
  const [v1, v2, v3, v4] = veiculoIds;

  console.log("Inserindo pendências...");
  const pendenciasSeed = [
    { veiculo_id: v3, tipo: "multa",     descricao: "Excesso de velocidade - 20% acima",         valor: 195.23, prazo: addDays(2),   status: "urgente" },
    { veiculo_id: v3, tipo: "debito",    descricao: "DPVAT 2025 em atraso",                       valor: 87.5,   prazo: addDays(-5),  status: "urgente" },
    { veiculo_id: v2, tipo: "debito",    descricao: "IPVA 1ª parcela",                            valor: 642.18, prazo: addDays(8),   status: "atencao" },
    { veiculo_id: v2, tipo: "multa",     descricao: "Estacionar em local proibido",               valor: 130.16, prazo: addDays(15),  status: "atencao" },
    { veiculo_id: v1, tipo: "restricao", descricao: "Restrição administrativa - regularizar dados", valor: 0,    prazo: addDays(20),  status: "atencao" },
    { veiculo_id: v4, tipo: "debito",    descricao: "Licenciamento 2026",                         valor: 158.4,  prazo: addDays(45),  status: "ok" },
    { veiculo_id: v3, tipo: "multa",     descricao: "Avanço de sinal vermelho",                   valor: 293.47, prazo: addDays(30),  status: "atencao" },
  ];
  for (const p of pendenciasSeed) {
    await sql`
      INSERT INTO pendencias (veiculo_id, tipo, descricao, valor, prazo, status)
      VALUES (${p.veiculo_id}, ${p.tipo}::tipo_pendencia, ${p.descricao}, ${p.valor}, ${p.prazo}, ${p.status}::status_geral)
    `;
  }

  console.log("Inserindo IPVA / licenciamento / seguro...");
  for (let i = 0; i < veiculoIds.length; i++) {
    const id = veiculoIds[i];
    await sql`
      INSERT INTO ipvas (veiculo_id, ano, valor, vencimento, pago, parcelas)
      VALUES (${id}, 2026, ${1250 + i * 320}, ${addDays(8 + i * 30)}, ${i === 0 || i === 3}, 3)
    `;
    await sql`
      INSERT INTO licenciamentos (veiculo_id, ano, valor, pago, vencimento)
      VALUES (${id}, 2026, 158.4, ${i !== 2}, ${addDays(45 + i * 10)})
    `;
    const seguradoras = ["Porto Seguro", "Bradesco Seguros", "Allianz", "SulAmérica"];
    await sql`
      INSERT INTO seguros (veiculo_id, seguradora, apolice, cobertura, inicio, fim, vigente)
      VALUES (
        ${id}, ${seguradoras[i]}, ${"AP-" + (100000 + i)},
        'Compreensiva (colisão, roubo, terceiros)',
        ${addDays(-200 + i * 30)}, ${addDays(165 - i * 80)}, ${i !== 2}
      )
    `;
  }

  console.log("Inserindo transferências...");
  await sql`
    INSERT INTO transferencias (veiculo_id, de_nome, de_cpf, para_nome, para_cpf, inicio, status)
    VALUES
      (${v4}, 'Maria Souza', '12345678901', 'João Silva',  '98765432112', ${addDays(-90)}, 'concluida'),
      (${v2}, 'João Silva',  '98765432112', 'Carlos Lima', '11122233344', ${addDays(-7)},  'andamento')
  `;

  console.log("Seed concluído.");
}

main().catch((e) => { console.error(e); process.exit(1); });
