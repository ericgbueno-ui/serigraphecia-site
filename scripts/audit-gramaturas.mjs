import { PrismaClient } from "@prisma/client";
import dns from "node:dns/promises";

// O engine do Prisma faz resolução DNS própria, que falha nesta máquina
// (consultas DNS diretas são recusadas — só o resolver do SO funciona).
// Contorno: resolver o IP via SO e conectar por IP, informando o endpoint
// ao Neon via "options" (substitui o SNI, que se perde sem hostname).
const HOST = "ep-falling-moon-aipke1te.c-4.us-east-1.aws.neon.tech";
const ENDPOINT_ID = "ep-falling-moon-aipke1te";

const raw = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const { address: ip } = await dns.lookup(HOST, { family: 4 });
const u = new URL(raw);
u.hostname = ip;
u.searchParams.set("sslmode", "require");
u.searchParams.set("sslaccept", "accept_invalid_certs");
u.searchParams.set("options", `endpoint=${ENDPOINT_ID}`);
const databaseUrl = u.toString();

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

async function main() {
  // ── 1. Tabela da Marfel (FornecedorCusto) ──────────────────────────
  const marfel = await prisma.fornecedor.findFirst({ where: { nome: "Marfel" } });
  if (!marfel) { console.log("Marfel não encontrada"); return; }

  const custos = await prisma.fornecedorCusto.findMany({
    where: { fornecedorId: marfel.id },
    include: { modelo: true },
    orderBy: [{ modelo: { nome: "asc" } }, { tamanho: "asc" }],
  });

  console.log("═══════════════════════════════════════════════════════");
  console.log("TABELA MARFEL (FornecedorCusto) — " + custos.length + " registros");
  console.log("═══════════════════════════════════════════════════════");
  for (const c of custos) {
    console.log(
      [
        (c.modelo?.nome ?? "SEM MODELO").padEnd(22),
        String(c.tamanho ?? "—").padEnd(9),
        ("gram: " + (c.gramatura ?? "—")).padEnd(18),
        ("cor: " + (c.cor ?? "—")).padEnd(24),
        "R$/kg: " + (c.precoKgCents / 100).toFixed(2),
        c.pesoMilheiroKg != null ? "peso/mil: " + c.pesoMilheiroKg + "kg" : "",
        c.custoMilheiroCents != null ? "custo/mil: R$ " + (c.custoMilheiroCents / 100).toFixed(2) : "",
      ].join(" | ")
    );
  }

  // ── 2. Nossa TabelaPreco (resumida por modelo+tamanho+gramatura) ───
  const precos = await prisma.tabelaPreco.findMany({
    where: { ativo: true },
    include: { modelo: true },
    orderBy: [{ tipo: "asc" }, { tamanho: "asc" }, { qtdMin: "asc" }],
  });

  const grupos = new Map();
  for (const p of precos) {
    const modeloNome = p.modelo?.nome ?? p.tipo.replace(/ \d+x\d+$/, "");
    const tam = p.tamanho ?? (p.tipo.match(/(\d+x\d+)$/) || [])[1] ?? "—";
    const key = modeloNome + "|" + tam + "|" + (p.gramatura ?? "SEM-GRAMATURA");
    if (!grupos.has(key)) grupos.set(key, { modeloNome, tam, gramatura: p.gramatura, faixas: [], minP: Infinity, maxP: 0, temModeloId: !!p.modeloId });
    const g = grupos.get(key);
    g.faixas.push(p.qtdMin);
    g.minP = Math.min(g.minP, p.precoUnitario);
    g.maxP = Math.max(g.maxP, p.precoUnitario);
  }

  console.log("");
  console.log("═══════════════════════════════════════════════════════");
  console.log("NOSSA TABELA (TabelaPreco ativa) — " + precos.length + " faixas, " + grupos.size + " combinações");
  console.log("═══════════════════════════════════════════════════════");
  const ordenado = [...grupos.values()].sort((a, b) =>
    a.modeloNome.localeCompare(b.modeloNome) || a.tam.localeCompare(b.tam) || String(a.gramatura).localeCompare(String(b.gramatura))
  );
  for (const g of ordenado) {
    console.log(
      [
        g.modeloNome.padEnd(22),
        g.tam.padEnd(9),
        ("gram: " + (g.gramatura ?? "❓ SEM")).padEnd(20),
        (g.faixas.length + " faixas").padEnd(10),
        "R$ " + g.minP.toFixed(2) + " a " + g.maxP.toFixed(2),
        g.temModeloId ? "" : "(sem modeloId — legado)",
      ].join(" | ")
    );
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error("ERRO:", e.message); process.exit(1); });
