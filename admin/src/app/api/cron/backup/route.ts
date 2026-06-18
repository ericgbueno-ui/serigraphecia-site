import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const [bookings, customers, payments, affiliates, drivers] = await Promise.all([
      prisma.booking.count(),
      prisma.customer.count(),
      prisma.payment.count(),
      prisma.affiliate.count(),
      prisma.driver.count(),
    ]);

    const snapshot = {
      timestamp: new Date().toISOString(),
      counts: { bookings, customers, payments, affiliates, drivers },
    };

    // Envia alerta se banco parecer vazio inesperadamente
    if (bookings === 0 && customers === 0) {
      console.error("[BACKUP-CRON] ⚠️ ALERTA: banco aparentemente vazio!", snapshot);
    } else {
      console.log("[BACKUP-CRON] ✅ Banco saudável:", JSON.stringify(snapshot));
    }

    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    console.error("[BACKUP-CRON] Erro ao verificar banco:", error);
    return NextResponse.json({ error: "Falha ao verificar banco" }, { status: 500 });
  }
}
