/**
 * GET /api/cron/alerts
 *
 * Cron de vigilância — roda 2x/dia (9h e 17h BRT).
 * Verifica gatilhos e envia alertas no WhatsApp da equipe (Rita e Eric).
 *
 * Thresholds configuráveis via .env:
 *   ALERT_CPA_MAX          — CPA máximo aceitável em R$ (padrão: 100)
 *   ALERT_BOOKING_TARGET   — meta de reservas/mês (padrão: 8)
 *   ALERT_LEAD_IDLE_HOURS  — horas sem resposta para lead quente (padrão: 48)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyTeam } from "@/lib/notify";
import { fetchMetaAdInsights } from "@/lib/meta-ads";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CPA_MAX        = parseFloat(process.env.ALERT_CPA_MAX        ?? "100");
const BOOKING_TARGET = parseInt( process.env.ALERT_BOOKING_TARGET  ?? "8",  10);
const IDLE_HOURS     = parseInt( process.env.ALERT_LEAD_IDLE_HOURS ?? "48", 10);

function brl(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export async function GET(req: Request) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const alerts: string[] = [];
  const now = new Date();

  // ── 1. Leads quentes/prontos parados ────────────────────────────────────────
  const idleSince = new Date(now.getTime() - IDLE_HOURS * 60 * 60 * 1000);
  const idleLeads = await prisma.lead.findMany({
    where: {
      status: { in: ["quente", "pronto"] },
      updatedAt: { lt: idleSince },
    },
    select: { name: true, whatsapp: true, status: true, score: true, updatedAt: true },
    orderBy: { score: "desc" },
    take: 5,
  });

  if (idleLeads.length > 0) {
    const horasMax = Math.floor(
      (now.getTime() - idleLeads[0].updatedAt.getTime()) / (1000 * 60 * 60)
    );
    let msg = `🔥 *${idleLeads.length} lead${idleLeads.length > 1 ? "s quentes parados" : " quente parado"} há +${IDLE_HOURS}h*\n\n`;
    idleLeads.forEach((l) => {
      const h = Math.floor((now.getTime() - l.updatedAt.getTime()) / (1000 * 60 * 60));
      msg += `• ${l.name ?? l.whatsapp} — ${l.status} — ${h}h sem ação\n`;
    });
    msg += `\n👉 multitrip.com.br/admin/leads`;
    alerts.push(msg);
  }

  // ── 2. CPA acima da meta ────────────────────────────────────────────────────
  try {
    const day30 = new Date(now); day30.setDate(now.getDate() - 30);
    const todayStr = now.toISOString().slice(0, 10);
    const monthStr = day30.toISOString().slice(0, 10);

    const [insights, bookingsMonth] = await Promise.all([
      fetchMetaAdInsights(monthStr, todayStr),
      prisma.booking.count({ where: { status: "CONFIRMED", createdAt: { gte: day30 } } }),
    ]);

    const adSpend = insights.reduce((s, i) => s + (i.spend ?? 0), 0);
    if (adSpend > 0 && bookingsMonth > 0) {
      const cpa = adSpend / bookingsMonth;
      if (cpa > CPA_MAX) {
        alerts.push(
          `⚠️ *CPA acima da meta*\n\n` +
          `• CPA atual (30 dias): ${brl(cpa)}\n` +
          `• Meta configurada: ${brl(CPA_MAX)}\n` +
          `• Investimento: ${brl(adSpend * 100) /* já em reais */}\n` +
          `• Reservas: ${bookingsMonth}\n\n` +
          `👉 Revisar campanhas em multitrip.com.br/admin/analytics`
        );
      }
    }
  } catch { /* Meta Ads indisponível — silencioso */ }

  // ── 3. Dias sem reserva confirmada ──────────────────────────────────────────
  const lastBooking = await prisma.booking.findFirst({
    where: { status: "CONFIRMED" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (lastBooking) {
    const diasSemReserva = Math.floor(
      (now.getTime() - lastBooking.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diasSemReserva >= 5) {
      const hotCount = await prisma.lead.count({
        where: { status: { in: ["quente", "pronto"] } },
      });
      alerts.push(
        `📭 *${diasSemReserva} dias sem reserva confirmada*\n\n` +
        `• Leads quentes/prontos disponíveis: ${hotCount}\n` +
        `• Última reserva: ${lastBooking.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\n` +
        `👉 Ativar ação comercial urgente`
      );
    }
  }

  // ── 4. Meta de reservas do mês ───────────────────────────────────────────────
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const bookingsThisMonth = await prisma.booking.count({
    where: { status: "CONFIRMED", createdAt: { gte: startOfMonth } },
  });

  const diasNoMes = now.getDate();
  const diasTotais = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projecao = Math.round((bookingsThisMonth / diasNoMes) * diasTotais);

  if (diasNoMes >= 15 && projecao < BOOKING_TARGET) {
    alerts.push(
      `📊 *Projeção abaixo da meta do mês*\n\n` +
      `• Reservas confirmadas: ${bookingsThisMonth}\n` +
      `• Projeção para o mês: ~${projecao}\n` +
      `• Meta: ${BOOKING_TARGET} reservas\n` +
      `• Metade do mês passou — acelerar captação`
    );
  }

  // ── 5. Sazonalidade próxima ──────────────────────────────────────────────────
  const proximoMes = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const mesProximo = proximoMes.getMonth() + 1; // 1-12
  const altaTemporada = [7, 11, 12, 1];

  if (now.getDate() >= 20 && altaTemporada.includes(mesProximo)) {
    const nomeMes = proximoMes.toLocaleDateString("pt-BR", { month: "long" });
    alerts.push(
      `🏔️ *Alta temporada em ${Math.floor((proximoMes.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} dias!*\n\n` +
      `• ${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} é mês de alta demanda na Serra\n` +
      `• Verificar frota, preços e campanhas\n` +
      `• Campanhas devem estar rodando agora para capturar planejadores antecipados`
    );
  }

  // ── Disparo ──────────────────────────────────────────────────────────────────
  const fired: string[] = [];
  for (const msg of alerts) {
    try {
      await notifyTeam(msg);
      fired.push(msg.slice(0, 40));
    } catch (err: any) {
      console.error("[alerts] Falha ao enviar alerta:", err.message);
    }
  }

  return NextResponse.json({
    ok: true,
    alertsFired: fired.length,
    alerts: fired,
    checkedAt: now.toISOString(),
  });
}
