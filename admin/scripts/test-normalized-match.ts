import dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, ""); // Keep only numbers
  // Remove leading 55 if it exists and the length is 12 or 13 digits (Brazilian format)
  if (cleaned.startsWith("55") && (cleaned.length === 12 || cleaned.length === 13)) {
    cleaned = cleaned.slice(2);
  }
  // Remove leading 0 if present
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

async function main() {
  const prisma = new PrismaClient();
  
  console.log("Analyzing booking attribution using normalized phone numbers...");

  try {
    const bookings = await prisma.booking.findMany({
      where: { status: "CONFIRMED" },
      include: { customer: true }
    });

    const leads = await prisma.lead.findMany();
    console.log(`Loaded ${bookings.length} confirmed bookings and ${leads.length} leads.`);

    // Map leads by normalized phone
    const leadMap = new Map();
    for (const lead of leads) {
      const norm = normalizePhone(lead.whatsapp);
      leadMap.set(norm, lead);
    }

    let matched = 0;
    let attributedToMeta = 0;

    for (const booking of bookings) {
      const normCustPhone = normalizePhone(booking.customer.phone);
      const lead = leadMap.get(normCustPhone);
      
      if (lead) {
        matched++;
        const isMeta = 
          lead.source === "whatsapp_ad" ||
          (lead.utmSource === "whatsapp" && lead.utmMedium === "cpc") ||
          lead.utmSource?.includes("facebook") ||
          lead.utmSource?.includes("instagram");
          
        if (isMeta) {
          attributedToMeta++;
          console.log(`[MATCH] Booking ${booking.id} (Customer: ${booking.customer.name}) -> Lead ID: ${lead.id} (Meta Ads ✅)`);
        }
      }
    }

    console.log(`\nResults:`);
    console.log(`Total Bookings: ${bookings.length}`);
    console.log(`Matched to Leads: ${matched}`);
    console.log(`Attributed to Meta Ads: ${attributedToMeta}`);

  } catch (error) {
    console.error("Error analyzing:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
