/**
 * GET /api/cron/weekly-report
 *
 * Disparado todo domingo às 20h BRT (23h UTC) via Vercel Cron.
 * Gera relatório semanal de leads, conversões e marketing.
 * Envia resumo no WhatsApp da equipe (Eric e Rita).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyTeam } from "@/lib/notify";
import { fetchMetaAdInsights } from "@/lib/meta-ads";
import { fetchGoogleAdsInsights, isGoogleAdsConfigured } from "@/lib/google-ads";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function brl(cents: number) {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
}

export async function GET(req: Request) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(weekStart.getDate() - 7);

    // ── Leads da semana ──
    const [
      leadsThisWeek,
      leadsPrevWeek,
      hotLeads,
      bookingsThisWeek,
      bookingsPrevWeek,
    ] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.lead.count({ where: { createdAt: { gte: prevWeekStart, lt: weekStart } } }),
      prisma.lead.findMany({
        where: {
          status: { in: ["quente", "pronto"] },
          updatedAt: { lt: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
        },
        select: { name: true, whatsapp: true, status: true },
        take: 5,
        orderBy: { score: "desc" },
      }),
      prisma.booking.findMany({
        where: { status: "CONFIRMED", createdAt: { gte: weekStart } },
        select: { totalCents: true, payMethod: true, tripType: true },
      }),
      prisma.booking.count({
        where: { status: "CONFIRMED", createdAt: { gte: prevWeekStart, lt: weekStart } },
      }),
    ]);

    // ── Cálculos ──
    const reservasThisWeek = bookingsThisWeek.length;
    const faturamentoSemana = bookingsThisWeek.reduce((s, b) => s + b.totalCents, 0);
    const ticketMedio = reservasThisWeek > 0 ? Math.round(faturamentoSemana / reservasThisWeek) : 0;
    const taxaConv = leadsThisWeek > 0 ? Math.round((reservasThisWeek / leadsThisWeek) * 100) : 0;

    const varLeads = leadsPrevWeek > 0
      ? `${leadsThisWeek >= leadsPrevWeek ? "+" : ""}${Math.round(((leadsThisWeek - leadsPrevWeek) / leadsPrevWeek) * 100)}% vs semana anterior`
      : "primeira semana";

    const varReservas = bookingsPrevWeek > 0
      ? `${reservasThisWeek >= bookingsPrevWeek ? "+" : ""}${reservasThisWeek - bookingsPrevWeek} vs semana anterior`
      : "";

    // ── Meta Ads ──
    let adSpend = 0;
    let cpa = 0;
    let googleAdSpend = 0;
    let googleCpa = 0;
    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const todayStr = now.toISOString().slice(0, 10);

    try {
      const insights = await fetchMetaAdInsights(weekStartStr, todayStr);
      adSpend = insights.reduce((s, i) => s + (i.spend ?? 0), 0);
      cpa = reservasThisWeek > 0 ? adSpend / reservasThisWeek : 0;
    } catch {}

    // ── Google Ads (quando configurado) ──
    if (isGoogleAdsConfigured()) {
      try {
        const gInsights = await fetchGoogleAdsInsights(weekStartStr, todayStr);
        if (gInsights) {
          googleAdSpend = gInsights.totalSpend;
          googleCpa = reservasThisWeek > 0 ? googleAdSpend / reservasThisWeek : 0;
        }
      } catch {}
    }

    // ── Leads sem resposta há +48h ──
    const leadsQueimando = hotLeads.length;

    // ── Monta mensagem ──
    const semanaLabel = `${fmtDate(weekStart)} a ${fmtDate(now)}`;

    let msg = `📊 *RELATÓRIO SEMANAL — Multi Trip*\n`;
    msg += `📅 Semana: ${semanaLabel}\n\n`;

    msg += `*LEADS*\n`;
    msg += `• Captados: ${leadsThisWeek} (${varLeads})\n`;
    msg += `• Taxa de conversão: ${taxaConv}%\n`;
    if (leadsQueimando > 0) {
      msg += `• ⚠️ Leads quentes sem ação >48h: ${leadsQueimando}\n`;
    }

    msg += `\n*RESERVAS*\n`;
    msg += `• Confirmadas: ${reservasThisWeek}${varReservas ? ` (${varReservas})` : ""}\n`;
    msg += `• Faturamento: ${brl(faturamentoSemana)}\n`;
    if (ticketMedio > 0) msg += `• Ticket médio: ${brl(ticketMedio)}\n`;

    if (adSpend > 0 || googleAdSpend > 0) {
      msg += `\n*ADS*\n`;
      if (adSpend > 0) {
        msg += `• Meta Ads: R$ ${adSpend.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
        if (cpa > 0) msg += ` (CPA R$ ${cpa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`;
        msg += `\n`;
      }
      if (googleAdSpend > 0) {
        msg += `• Google Ads: R$ ${googleAdSpend.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
        if (googleCpa > 0) msg += ` (CPA R$ ${googleCpa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`;
        msg += `\n`;
      }
      const totalAds = adSpend + googleAdSpend;
      if (totalAds > 0 && reservasThisWeek > 0) {
        const cpaTotal = totalAds / reservasThisWeek;
        msg += `• CPA Total: R$ ${cpaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n`;
      }
    }

    // ── Análise Jolie ──
    msg += `\n*ANÁLISE*\n`;
    if (leadsQueimando > 0) {
      msg += `🔥 ${leadsQueimando} lead${leadsQueimando > 1 ? "s quentes precisam" : " quente precisa"} de ação agora:\n`;
      hotLeads.forEach((l) => {
        msg += `  • ${l.name ?? l.whatsapp} (${l.status})\n`;
      });
    }
    if (taxaConv >= 20) {
      msg += `✅ Semana forte: ${taxaConv}% de conversão. Considere escalar verba.\n`;
    } else if (taxaConv > 0 && taxaConv < 10) {
      msg += `⚠️ Taxa baixa (${taxaConv}%). Revisar qualidade dos leads ou velocidade de atendimento.\n`;
    }
    if (reservasThisWeek === 0) {
      msg += `❗ Nenhuma reserva confirmada na semana. Verificar funil e atendimento.\n`;
    }

    msg += `\n🔗 multitrip.com.br/admin/leads`;

    await notifyTeam(msg);

    return NextResponse.json({
      ok: true,
      week: semanaLabel,
      leadsThisWeek,
      reservasThisWeek,
      faturamentoSemana,
      adSpend,
      hotLeadsAlert: leadsQueimando,
    });
  } catch (err: any) {
    console.error("[weekly-report] Erro:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
