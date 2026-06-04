import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  const phone = "83988466021"; // Luiz Alves's phone number from DB logs
  
  console.log(`Manually attributing Luiz Alves (Phone: ${phone}) to Meta Ads...`);

  try {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { phone }
    });

    if (!customer) {
      console.error(`Customer with phone ${phone} not found!`);
      return;
    }

    console.log(`Found Customer: ${customer.name} (Email: ${customer.email})`);

    // Upsert Lead for Luiz Alves as a Meta Ads website conversion
    await prisma.lead.upsert({
      where: { whatsapp: phone },
      create: {
        whatsapp: phone,
        name: customer.name,
        email: customer.email,
        status: "convertido",
        source: "checkout", // website checkout source
        utmSource: "facebook",
        utmMedium: "cpc",
        utmCampaign: "meta_ads_site_conversoes",
        score: 100
      },
      update: {
        status: "convertido",
        source: "checkout",
        utmSource: "facebook",
        utmMedium: "cpc",
        utmCampaign: "meta_ads_site_conversoes"
      }
    });

    console.log("Successfully created/updated lead for Luiz Alves, attributing him to Meta Ads!");

  } catch (error) {
    console.error("Error attributing Luiz Alves:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
