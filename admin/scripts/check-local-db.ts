import dotenv from "dotenv";
import path from "path";

// Forçar carregamento do .env.local com override
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";

async function main() {
  console.log("DATABASE_URL carregada:", process.env.DATABASE_URL);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  const count = await prisma.booking.count();
  console.log("Total bookings no banco do .env.local:", count);

  const topBookings = await prisma.booking.findMany({
    select: {
      id: true,
      createdAt: true,
      customer: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 5
  });

  console.log("Top 5 bookings no banco do .env.local:");
  console.log(JSON.stringify(topBookings, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
