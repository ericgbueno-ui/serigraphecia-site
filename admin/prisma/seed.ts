import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed CashflowCategory with standard categories
  const categories = [
    {
      name: "Corridas Completadas",
      type: "INCOME",
      description: "Renda de corridas de transfer completadas",
    },
    {
      name: "Combustível",
      type: "EXPENSE",
      description: "Despesas com combustível",
    },
    {
      name: "Manutenção do Veículo",
      type: "EXPENSE",
      description: "Gastos com manutenção e reparo do veículo",
    },
    {
      name: "Seguro do Veículo",
      type: "EXPENSE",
      description: "Prêmio de seguro do veículo",
    },
    {
      name: "Pedágios",
      type: "EXPENSE",
      description: "Despesas com pedágios e estradas",
    },
    {
      name: "Multas e Infrações",
      type: "EXPENSE",
      description: "Multas de trânsito e infrações",
    },
    {
      name: "Estacionamento",
      type: "EXPENSE",
      description: "Gastos com estacionamento",
    },
    {
      name: "Limpeza do Veículo",
      type: "EXPENSE",
      description: "Despesas com limpeza e higienização",
    },
    {
      name: "Aluguel do Veículo",
      type: "EXPENSE",
      description: "Aluguel ou leasing do veículo",
    },
    {
      name: "Telefone e Internet",
      type: "EXPENSE",
      description: "Planos de celular e internet",
    },
    {
      name: "Saúde e Documentação",
      type: "EXPENSE",
      description: "Despesas com saúde, CNH, documentação do veículo",
    },
    {
      name: "Outras Despesas",
      type: "EXPENSE",
      description: "Outras despesas operacionais",
    },
  ];

  console.log("🌱 Seeding CashflowCategory...");

  for (const category of categories) {
    const existing = await prisma.cashflowCategory.findUnique({
      where: { name: category.name },
    });

    if (!existing) {
      await prisma.cashflowCategory.create({
        data: category,
      });
      console.log(`✅ Created category: ${category.name}`);
    } else {
      console.log(`⏭️  Category already exists: ${category.name}`);
    }
  }

  console.log("✨ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
