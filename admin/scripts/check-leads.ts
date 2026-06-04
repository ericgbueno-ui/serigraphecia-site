import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  console.log("Inspecting Lead table...");
  try {
    const count = await prisma.lead.count();
    console.log("Total leads:", count);

    if (count > 0) {
      const sample = await prisma.lead.findMany({
        take: 10,
        orderBy: { createdAt: "desc" }
      });
      console.log("Sample leads in database:");
      console.log(JSON.stringify(sample, null, 2));

      // Check how many have Meta Ads sources
      const metaCount = await prisma.lead.count({
        where: {
          OR: [
            { source: "whatsapp_ad" },
            { utmSource: "whatsapp", utmMedium: "cpc" },
            { utmSource: { contains: "facebook" } },
            { utmSource: { contains: "instagram" } }
          ]
        }
      });
      console.log("Meta Ads leads count:", metaCount);
    }
  } catch (error) {
    console.error("Error inspecting leads:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
