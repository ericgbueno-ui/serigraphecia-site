import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.booking.count();
  console.log("Total bookings:", count);

  const histBookings = await prisma.booking.findMany({
    where: {
      publicToken: {
        startsWith: "hist_"
      }
    },
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
    take: 10
  });

  console.log("Top 10 historical bookings by createdAt:");
  console.log(JSON.stringify(histBookings, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
