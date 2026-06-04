import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  // Encontra os leads com source: "checkout"
  const checkoutLeads = await prisma.lead.findMany({
    where: { source: "checkout" },
    orderBy: { createdAt: "desc" },
  });

  console.log("=== LEADS DE CHECKOUT ===");
  console.log(JSON.stringify(checkoutLeads, null, 2));

  // Para cada lead, verifica se existe um booking associado
  for (const lead of checkoutLeads) {
    const customer = await prisma.customer.findFirst({
      where: { phone: lead.whatsapp },
    });
    if (customer) {
      const bookings = await prisma.booking.findMany({
        where: { customerId: customer.id },
      });
      console.log(`Lead: ${lead.name} (${lead.whatsapp}) -> Customer: ${customer.name}. Bookings:`, bookings.length);
      for (const b of bookings) {
        console.log(`  Booking ID: ${b.id}, Status: ${b.status}, Total: R$ ${b.totalCents / 100}, CreatedAt: ${b.createdAt}`);
      }
    } else {
      console.log(`Lead: ${lead.name} (${lead.whatsapp}) -> Sem Customer correspondente.`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
