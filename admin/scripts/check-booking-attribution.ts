import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  
  console.log("Analyzing booking attribution for the last 30 days...");
  
  const since = new Date();
  since.setDate(since.getDate() - 30);
  since.setHours(0, 0, 0, 0);

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        createdAt: { gte: since }
      },
      include: {
        customer: true
      },
      orderBy: { createdAt: "desc" }
    });

    console.log(`Found ${bookings.length} confirmed bookings in the last 30 days.`);

    for (const booking of bookings) {
      const customer = booking.customer;
      const phone = customer.phone;
      
      // Find lead
      const lead = await prisma.lead.findUnique({
        where: { whatsapp: phone }
      });

      console.log(`\nBooking ID: ${booking.id}`);
      console.log(`Date: ${booking.createdAt.toISOString()}`);
      console.log(`Customer: ${customer.name} (Phone: ${phone})`);
      console.log(`Amount: R$ ${booking.totalCents / 100}`);
      
      if (lead) {
        console.log(`Linked Lead ID: ${lead.id}`);
        console.log(`Lead Source: "${lead.source}"`);
        console.log(`Lead UTM Source: "${lead.utmSource}"`);
        console.log(`Lead UTM Medium: "${lead.utmMedium}"`);
        console.log(`Lead UTM Campaign: "${lead.utmCampaign}"`);
        
        const isMeta = 
          lead.source === "whatsapp_ad" ||
          lead.utmSource === "whatsapp" && lead.utmMedium === "cpc" ||
          lead.utmSource?.includes("facebook") ||
          lead.utmSource?.includes("instagram");
          
        console.log(`Attributed to Meta Ads? ${isMeta ? "✅ YES" : "❌ NO"}`);
      } else {
        console.log("❌ No corresponding Lead found in the Lead table for this customer's phone number!");
      }
    }
  } catch (error) {
    console.error("Error analyzing attribution:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
