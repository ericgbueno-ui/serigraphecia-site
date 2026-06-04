import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.metaAdSpend.count();
    console.log("Total records in MetaAdSpend:", count);
    
    if (count > 0) {
      const first = await prisma.metaAdSpend.findFirst({ orderBy: { date: "asc" } });
      const last = await prisma.metaAdSpend.findFirst({ orderBy: { date: "desc" } });
      console.log("Date range in DB:", first?.date, "to", last?.date);
      
      const sample = await prisma.metaAdSpend.findMany({
        orderBy: { date: "desc" },
        take: 5
      });
      console.log("Sample records:", JSON.stringify(sample, null, 2));
    }
  } catch (error) {
    console.error("Error reading MetaAdSpend:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
