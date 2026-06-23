import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const NOTA_2COR = "40% de acréscimo na segunda cor ou no verso.";

const precos = [
  // ── ALÇA CAMISETA ────────────────────────────────────────
  // 60x80
  { tipo: "Alça Camiseta 60x80", qtdMin: 100,  qtdMax: 249,  precoUnitario: 2.72 },
  { tipo: "Alça Camiseta 60x80", qtdMin: 250,  qtdMax: 499,  precoUnitario: 2.18 },
  { tipo: "Alça Camiseta 60x80", qtdMin: 500,  qtdMax: 999,  precoUnitario: 2.05 },
  { tipo: "Alça Camiseta 60x80", qtdMin: 1000, qtdMax: null, precoUnitario: 1.84 },
  // 50x70
  { tipo: "Alça Camiseta 50x70", qtdMin: 100,  qtdMax: 249,  precoUnitario: 2.10 },
  { tipo: "Alça Camiseta 50x70", qtdMin: 250,  qtdMax: 499,  precoUnitario: 1.68 },
  { tipo: "Alça Camiseta 50x70", qtdMin: 500,  qtdMax: 999,  precoUnitario: 1.58 },
  { tipo: "Alça Camiseta 50x70", qtdMin: 1000, qtdMax: null, precoUnitario: 1.42 },
  // 45x60
  { tipo: "Alça Camiseta 45x60", qtdMin: 100,  qtdMax: 249,  precoUnitario: 1.64 },
  { tipo: "Alça Camiseta 45x60", qtdMin: 250,  qtdMax: 499,  precoUnitario: 1.30 },
  { tipo: "Alça Camiseta 45x60", qtdMin: 500,  qtdMax: 999,  precoUnitario: 1.23 },
  { tipo: "Alça Camiseta 45x60", qtdMin: 1000, qtdMax: null, precoUnitario: 1.10 },
  // 40x50
  { tipo: "Alça Camiseta 40x50", qtdMin: 100,  qtdMax: 249,  precoUnitario: 1.30 },
  { tipo: "Alça Camiseta 40x50", qtdMin: 250,  qtdMax: 499,  precoUnitario: 1.05 },
  { tipo: "Alça Camiseta 40x50", qtdMin: 500,  qtdMax: 999,  precoUnitario: 0.98 },
  { tipo: "Alça Camiseta 40x50", qtdMin: 1000, qtdMax: null, precoUnitario: 0.88 },
  // 30x40
  { tipo: "Alça Camiseta 30x40", qtdMin: 100,  qtdMax: 249,  precoUnitario: 0.98 },
  { tipo: "Alça Camiseta 30x40", qtdMin: 250,  qtdMax: 499,  precoUnitario: 0.80 },
  { tipo: "Alça Camiseta 30x40", qtdMin: 500,  qtdMax: 999,  precoUnitario: 0.73 },
  { tipo: "Alça Camiseta 30x40", qtdMin: 1000, qtdMax: null, precoUnitario: 0.66 },

  // ── ALÇA VAZADA ──────────────────────────────────────────
  // 50x60
  { tipo: "Alça Vazada 50x60", qtdMin: 100,  qtdMax: 199,  precoUnitario: 2.19, notas: NOTA_2COR },
  { tipo: "Alça Vazada 50x60", qtdMin: 200,  qtdMax: 499,  precoUnitario: 2.09, notas: NOTA_2COR },
  { tipo: "Alça Vazada 50x60", qtdMin: 500,  qtdMax: 999,  precoUnitario: 1.89, notas: NOTA_2COR },
  { tipo: "Alça Vazada 50x60", qtdMin: 1000, qtdMax: null, precoUnitario: 1.59, notas: NOTA_2COR },
  // 40x50
  { tipo: "Alça Vazada 40x50", qtdMin: 100,  qtdMax: 199,  precoUnitario: 1.97, notas: NOTA_2COR },
  { tipo: "Alça Vazada 40x50", qtdMin: 200,  qtdMax: 499,  precoUnitario: 1.85, notas: NOTA_2COR },
  { tipo: "Alça Vazada 40x50", qtdMin: 500,  qtdMax: 999,  precoUnitario: 1.64, notas: NOTA_2COR },
  { tipo: "Alça Vazada 40x50", qtdMin: 1000, qtdMax: null, precoUnitario: 1.30, notas: NOTA_2COR },
  // 30x40
  { tipo: "Alça Vazada 30x40", qtdMin: 100,  qtdMax: 199,  precoUnitario: 1.64, notas: NOTA_2COR },
  { tipo: "Alça Vazada 30x40", qtdMin: 200,  qtdMax: 499,  precoUnitario: 1.52, notas: NOTA_2COR },
  { tipo: "Alça Vazada 30x40", qtdMin: 500,  qtdMax: 999,  precoUnitario: 1.30, notas: NOTA_2COR },
  { tipo: "Alça Vazada 30x40", qtdMin: 1000, qtdMax: null, precoUnitario: 0.98, notas: NOTA_2COR },
  // 25x35
  { tipo: "Alça Vazada 25x35", qtdMin: 100,  qtdMax: 199,  precoUnitario: 1.49, notas: NOTA_2COR },
  { tipo: "Alça Vazada 25x35", qtdMin: 200,  qtdMax: 499,  precoUnitario: 1.39, notas: NOTA_2COR },
  { tipo: "Alça Vazada 25x35", qtdMin: 500,  qtdMax: 999,  precoUnitario: 1.20, notas: NOTA_2COR },
  { tipo: "Alça Vazada 25x35", qtdMin: 1000, qtdMax: null, precoUnitario: 0.87, notas: NOTA_2COR },
  // 20x30
  { tipo: "Alça Vazada 20x30", qtdMin: 100,  qtdMax: 199,  precoUnitario: 1.32, notas: NOTA_2COR },
  { tipo: "Alça Vazada 20x30", qtdMin: 200,  qtdMax: 499,  precoUnitario: 1.21, notas: NOTA_2COR },
  { tipo: "Alça Vazada 20x30", qtdMin: 500,  qtdMax: 999,  precoUnitario: 0.99, notas: NOTA_2COR },
  { tipo: "Alça Vazada 20x30", qtdMin: 1000, qtdMax: null, precoUnitario: 0.69, notas: NOTA_2COR },
  // 16x22
  { tipo: "Alça Vazada 16x22", qtdMin: 300,  qtdMax: 499,  precoUnitario: 0.87, notas: NOTA_2COR },
  { tipo: "Alça Vazada 16x22", qtdMin: 500,  qtdMax: 999,  precoUnitario: 0.76, notas: NOTA_2COR },
  { tipo: "Alça Vazada 16x22", qtdMin: 1000, qtdMax: null, precoUnitario: 0.54, notas: NOTA_2COR },

  // ── ALÇA FITA ────────────────────────────────────────────
  // 27x40
  { tipo: "Alça Fita 27x40", qtdMin: 100,  qtdMax: 199,  precoUnitario: 1.91, notas: NOTA_2COR },
  { tipo: "Alça Fita 27x40", qtdMin: 200,  qtdMax: 499,  precoUnitario: 1.80, notas: NOTA_2COR },
  { tipo: "Alça Fita 27x40", qtdMin: 500,  qtdMax: 999,  precoUnitario: 1.68, notas: NOTA_2COR },
  { tipo: "Alça Fita 27x40", qtdMin: 1000, qtdMax: null, precoUnitario: 1.52, notas: NOTA_2COR },
  // 30x45
  { tipo: "Alça Fita 30x45", qtdMin: 100,  qtdMax: 199,  precoUnitario: 2.30, notas: NOTA_2COR },
  { tipo: "Alça Fita 30x45", qtdMin: 200,  qtdMax: 499,  precoUnitario: 2.16, notas: NOTA_2COR },
  { tipo: "Alça Fita 30x45", qtdMin: 500,  qtdMax: 999,  precoUnitario: 2.00, notas: NOTA_2COR },
  { tipo: "Alça Fita 30x45", qtdMin: 1000, qtdMax: null, precoUnitario: 1.83, notas: NOTA_2COR },
  // 40x50
  { tipo: "Alça Fita 40x50", qtdMin: 100,  qtdMax: 199,  precoUnitario: 3.00, notas: NOTA_2COR },
  { tipo: "Alça Fita 40x50", qtdMin: 200,  qtdMax: 499,  precoUnitario: 2.84, notas: NOTA_2COR },
  { tipo: "Alça Fita 40x50", qtdMin: 500,  qtdMax: 999,  precoUnitario: 2.66, notas: NOTA_2COR },
  { tipo: "Alça Fita 40x50", qtdMin: 1000, qtdMax: null, precoUnitario: 2.39, notas: NOTA_2COR },
  // 45x55
  { tipo: "Alça Fita 45x55", qtdMin: 100,  qtdMax: 199,  precoUnitario: 3.50, notas: NOTA_2COR },
  { tipo: "Alça Fita 45x55", qtdMin: 200,  qtdMax: 499,  precoUnitario: 2.84, notas: NOTA_2COR },
  { tipo: "Alça Fita 45x55", qtdMin: 500,  qtdMax: 999,  precoUnitario: 2.66, notas: NOTA_2COR },
  { tipo: "Alça Fita 45x55", qtdMin: 1000, qtdMax: null, precoUnitario: 2.39, notas: NOTA_2COR },
];

async function main() {
  console.log("🌱 Inserindo tabela de preços...");

  // Limpa tabela antes
  await prisma.tabelaPreco.deleteMany();

  let count = 0;
  for (const p of precos) {
    await prisma.tabelaPreco.create({
      data: {
        tipo:          p.tipo,
        qtdMin:        p.qtdMin,
        qtdMax:        p.qtdMax ?? null,
        precoUnitario: p.precoUnitario,
        notas:         p.notas ?? null,
        ativo:         true,
      },
    });
    count++;
  }

  console.log(`✅ ${count} preços inseridos.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
