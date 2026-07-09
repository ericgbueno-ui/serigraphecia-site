// Desativa as combinações de TabelaPreco identificadas pela auditoria de
// 09/07/2026 (scripts/audit-gramaturas.mjs) como órfãs — sem custo
// correspondente na tabela da Marfel (FornecedorCusto). Nada é apagado:
// ativo:false, com registro em HistoricoAlteracao. Aprovado pelo Eric.
import { PrismaClient } from "@prisma/client";
import dns from "node:dns/promises";

// Mesmo contorno de DNS do audit-gramaturas.mjs (ver aquele script).
const HOST = "ep-falling-moon-aipke1te.c-4.us-east-1.aws.neon.tech";
const ENDPOINT_ID = "ep-falling-moon-aipke1te";

const raw = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const { address: ip } = await dns.lookup(HOST, { family: 4 });
const u = new URL(raw);
u.hostname = ip;
u.searchParams.set("sslmode", "require");
u.searchParams.set("sslaccept", "accept_invalid_certs");
u.searchParams.set("options", `endpoint=${ENDPOINT_ID}`);

const prisma = new PrismaClient({ datasources: { db: { url: u.toString() } } });

const ORFAS = [
  { modelo: "Alça Camiseta", tamanho: "30x40", gramatura: "0,04-0,06" },
  { modelo: "Alça Camiseta", tamanho: "30x40", gramatura: "0,06" },
  { modelo: "Alça Camiseta", tamanho: "40x50", gramatura: "0,06" },
  { modelo: "Alça Camiseta", tamanho: "45x60", gramatura: "0,06" },
  { modelo: "Alça Camiseta", tamanho: "60x80", gramatura: "0,07" },
  { modelo: "Alça Vazada",   tamanho: "40x50", gramatura: "0,08" },
  { modelo: "Alça Vazada",   tamanho: "50x60", gramatura: "0,10" },
];

async function main() {
  const precos = await prisma.tabelaPreco.findMany({
    where: { ativo: true },
    include: { modelo: true },
  });

  let totalDesativadas = 0;
  for (const alvo of ORFAS) {
    const linhas = precos.filter((p) => {
      const modeloNome = p.modelo?.nome ?? p.tipo.replace(/ \d+x\d+$/, "");
      return (
        modeloNome === alvo.modelo &&
        p.tamanho === alvo.tamanho &&
        p.gramatura === alvo.gramatura
      );
    });

    console.log(`${alvo.modelo} ${alvo.tamanho} gram ${alvo.gramatura}: ${linhas.length} faixa(s)`);
    for (const linha of linhas) {
      await prisma.tabelaPreco.update({
        where: { id: linha.id },
        data: { ativo: false },
      });
      await prisma.historicoAlteracao.create({
        data: {
          entidade: "TabelaPreco",
          entidadeId: linha.id,
          campo: "ativo",
          valorAnterior: "true",
          valorNovo: "false",
          motivo: `Auditoria 2026-07-09: gramatura "${alvo.gramatura}" (${alvo.modelo} ${alvo.tamanho}) sem custo correspondente na tabela Marfel — desativada com aprovação do Eric.`,
        },
      });
      totalDesativadas++;
    }
  }

  console.log(`\n✅ ${totalDesativadas} faixas desativadas.`);

  // Confirmação: estado final por modelo+tamanho+gramatura
  const restantes = await prisma.tabelaPreco.findMany({
    where: { ativo: true },
    include: { modelo: true },
  });
  const combos = new Map();
  for (const p of restantes) {
    const modeloNome = p.modelo?.nome ?? p.tipo.replace(/ \d+x\d+$/, "");
    const key = `${modeloNome} | ${p.tamanho ?? "—"} | ${p.gramatura ?? "—"}`;
    combos.set(key, (combos.get(key) ?? 0) + 1);
  }
  console.log(`\nEstado final: ${restantes.length} faixas ativas, ${combos.size} combinações:`);
  for (const [k, n] of [...combos.entries()].sort()) console.log(`  ${k} (${n} faixas)`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error("ERRO:", e.message); process.exit(1); });
