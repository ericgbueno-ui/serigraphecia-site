import crypto from "crypto";
import type { PrismaClient } from "@prisma/client";

function formatDateParts(date: Date): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  return `${values.year}${values.month}${values.day}-${values.hour}${values.minute}${values.second}`;
}

function gerarSufixo(): string {
  return crypto.randomBytes(2).toString("hex").toUpperCase();
}

export async function gerarNumeroPedido(prisma: PrismaClient): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const numeroPedido = `SG-${formatDateParts(new Date())}-${gerarSufixo()}`;
    const existente = await prisma.booking.findUnique({
      where: { numeroPedido },
      select: { id: true },
    });

    if (!existente) {
      return numeroPedido;
    }
  }

  throw new Error("Nao foi possivel gerar um numero de pedido unico.");
}
