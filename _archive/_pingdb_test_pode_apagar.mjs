import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
try {
  const r = await prisma.$queryRawUnsafe("SELECT 1 as ok");
  console.log("DB OK", r);
  const count = await prisma.pedido.count();
  console.log("Pedidos existentes:", count);
} catch (e) {
  console.error("DB ERROR", e.message);
} finally {
  await prisma.$disconnect();
}
