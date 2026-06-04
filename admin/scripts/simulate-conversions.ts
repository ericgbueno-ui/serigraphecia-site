import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("55") && (cleaned.length === 12 || cleaned.length === 13)) {
    cleaned = cleaned.slice(2);
  }
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

async function main() {
  const prisma = new PrismaClient();
  console.log("Simulating Meta Ads conversions in the database...");

  try {
    // 1. Get 3 confirmed bookings from the last 30 days
    const bookings = await prisma.booking.findMany({
      where: { status: "CONFIRMED" },
      include: { customer: true },
      take: 3,
      orderBy: { createdAt: "desc" }
    });

    if (bookings.length === 0) {
      console.log("No confirmed bookings found to attribute.");
      return;
    }

    console.log(`Selected ${bookings.length} bookings for Meta Ads simulation:`);

    for (const booking of bookings) {
      const phone = booking.customer.phone;
      const normalizedPhone = normalizePhone(phone);
      
      console.log(`- Attributing booking ${booking.id} (Customer: ${booking.customer.name}, Phone: ${phone})`);
      
      // Upsert a Lead for this customer phone, marking them as coming from Meta Ads
      await prisma.lead.upsert({
        where: { whatsapp: phone },
        create: {
          whatsapp: phone,
          name: booking.customer.name,
          email: booking.customer.email,
          status: "convertido",
          source: "whatsapp_ad",
          utmSource: "facebook",
          utmMedium: "cpc",
          utmCampaign: "campanha_promocao_gramado",
          score: 100
        },
        update: {
          status: "convertido",
          source: "whatsapp_ad",
          utmSource: "facebook",
          utmMedium: "cpc",
          utmCampaign: "campanha_promocao_gramado"
        }
      });
      
      console.log(`  Successfully marked lead ${phone} as a Meta Ads conversion.`);
    }

    console.log("\nSimulation finished! Please reload your Analytics Dashboard page to see the results.");

  } catch (error) {
    console.error("Error simulating conversions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
