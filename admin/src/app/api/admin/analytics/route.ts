// GET /api/admin/analytics?period=7|15|30|90|180|365
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getIsAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

function startOf(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getSalesDate(b: { publicToken?: string | null; createdAt: Date; idaDate: Date | null; voltaDate: Date | null }) {
  if (b.publicToken?.startsWith("hist_")) {
    return b.idaDate ?? b.voltaDate ?? b.createdAt;
  }
  return b.createdAt;
}

export async function GET(req: NextRequest) {
  if (!(await getIsAdmin()))
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  // Suporta 7, 15, 30, 90, 180 (6m), 365 (1 ano)
  const period = Number(req.nextUrl.searchParams.get("period") ?? "30");
  const since = startOf(period);
  const today = startOfToday();

  // ── Queries paralelas ──────────────────────────────────────────────────────
  const [
    totalLeads,
    leadsNoPeriodo,
    leadsHoje,
    leadsConverted,
    totalBookings,
    confirmedBookings,
    totalCustomers,
    // Funil — LeadEvents
    evPageView,
    evWhatsapp,
    evQuote,
    evCheckout,
    evPurchase,
    // Canais
    leadsBySource,
    leadsByUtm,
    // Meta Ads
    metaAdsAgg,
    // Follow-ups
    followupInteractions,
    // Leads para timeline
    leadsTimeline,
    // Todos os Bookings confirmados para processar via lógica híbrida
    allConfirmedBookings,
    // Leads do Meta Ads para cálculo de conversão real
    metaLeads,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: since } } }),
    prisma.lead.count({ where: { createdAt: { gte: today } } }),
    prisma.lead.count({ where: { status: "convertido" } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.customer.count(),
    // LeadEvents no período
    prisma.leadEvent.count({ where: { type: "page_view", createdAt: { gte: since } } }),
    prisma.leadEvent.count({ where: { type: "whatsapp_click", createdAt: { gte: since } } }),
    prisma.leadEvent.count({ where: { type: "quote_request", createdAt: { gte: since } } }),
    prisma.leadEvent.count({ where: { type: "checkout_start", createdAt: { gte: since } } }),
    prisma.leadEvent.count({ where: { type: "purchase", createdAt: { gte: since } } }),
    // Canais
    prisma.lead.groupBy({
      by: ["source"],
      _count: { id: true },
      where: { createdAt: { gte: since } },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.lead.groupBy({
      by: ["utmSource"],
      _count: { id: true },
      where: { createdAt: { gte: since }, utmSource: { not: null } },
      orderBy: { _count: { id: "desc" } },
    }),
    // Meta Ads
    prisma.metaAdSpend.aggregate({
      _sum: { spend: true, clicks: true, impressions: true, reach: true },
      where: {
        date: {
          gte: since.toISOString().slice(0, 10),
        },
      },
    }),
    // Follow-ups — conta por engine
    prisma.interaction.groupBy({
      by: ["aiEngine"],
      _count: { id: true },
      where: {
        aiEngine: { in: ["followup_d1", "followup_d3", "followup_d7", "reactivation_d30", "reactivation_d60", "reactivation_d90"] },
        createdAt: { gte: since },
      },
    }),
    // Leads para timeline
    prisma.lead.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    // Bookings para processamento híbrido
    prisma.booking.findMany({
      where: { status: "CONFIRMED" },
      select: {
        id: true,
        publicToken: true,
        createdAt: true,
        idaDate: true,
        voltaDate: true,
        totalCents: true,
        routeLabel: true,
        customer: {
          select: {
            phone: true,
            name: true,
          }
        }
      },
    }),
    // Leads do Meta Ads para atribuição de faturamento
    prisma.lead.findMany({
      where: {
        OR: [
          { source: "whatsapp_ad" },
          { utmSource: "whatsapp", utmMedium: "cpc" },
          { utmSource: { contains: "facebook" } },
          { utmSource: { contains: "instagram" } },
          { utmSource: { contains: "Facebook" } },
          { utmSource: { contains: "Instagram" } },
        ],
      },
      select: { whatsapp: true, source: true, createdAt: true, id: true },
    }),
  ]);

  // ── Cálculos derivados baseados na lógica híbrida ──────────────────────────

  const mappedBookings = allConfirmedBookings.map((b) => {
    const salesDate = getSalesDate(b);
    return {
      ...b,
      salesDate,
    };
  });

  const faturamentoTotal = mappedBookings.reduce((sum, b) => sum + b.totalCents, 0);

  const confirmedNoPeriodoList = mappedBookings.filter((b) => b.salesDate.getTime() >= since.getTime());
  const confirmedNoPeriodo = confirmedNoPeriodoList.length;
  const faturamentoPeriodo = confirmedNoPeriodoList.reduce((sum, b) => sum + b.totalCents, 0);

  // ── Atribuição Meta Ads ──────────────────────────────────────────────────
  const metaPhones = new Set(metaLeads.map((l) => l.whatsapp));
  const confirmedMetaNoPeriodoList = confirmedNoPeriodoList.filter((b) => 
    b.customer?.phone && metaPhones.has(b.customer.phone)
  );
  const faturamentoMetaPeriodo = confirmedMetaNoPeriodoList.reduce((sum, b) => sum + b.totalCents, 0);
  const conversoesMetaPeriodo = confirmedMetaNoPeriodoList.length;

  const ticketMedio =
    confirmedBookings > 0 ? Math.round(faturamentoTotal / confirmedBookings) : 0;
  const taxaConversao = totalLeads > 0 ? leadsConverted / totalLeads : 0;
  const taxaAbandono =
    evCheckout > 0 ? ((evCheckout - evPurchase) / evCheckout) : 0;

  const metaSpend = metaAdsAgg._sum.spend ?? 0;
  const metaClicks = metaAdsAgg._sum.clicks ?? 0;
  const metaImpressions = metaAdsAgg._sum.impressions ?? 0;
  const metaReach = metaAdsAgg._sum.reach ?? 0;

  // Filtra leads gerados do Meta Ads específicos do período
  const metaLeadsNoPeriodoList = metaLeads.filter((l) => l.createdAt.getTime() >= since.getTime());
  const metaLeadsNoPeriodo = metaLeadsNoPeriodoList.length;

  const metaCtr = metaImpressions > 0 ? metaClicks / metaImpressions : 0;
  const metaCpm = metaImpressions > 0 ? (metaSpend / metaImpressions) * 1000 : 0;
  const metaCpc = metaClicks > 0 ? metaSpend / metaClicks : 0;
  const metaCpa = conversoesMetaPeriodo > 0 ? metaSpend / conversoesMetaPeriodo : 0;
  const metaCpl = metaLeadsNoPeriodo > 0 ? metaSpend / metaLeadsNoPeriodo : 0;
  const metaCac = conversoesMetaPeriodo > 0 ? metaSpend / conversoesMetaPeriodo : 0;
  
  const metaRoas = metaSpend > 0 ? (faturamentoMetaPeriodo / 100) / metaSpend : 0;
  const metaRoi = metaSpend > 0 ? ((faturamentoMetaPeriodo / 100) - metaSpend) / metaSpend : 0;
  
  // CBR (Conversion Rate): Cliques -> Reservas
  const metaCbr = metaClicks > 0 ? conversoesMetaPeriodo / metaClicks : 0;
  
  // AOV (Average Order Value / Ticket Médio)
  const metaAov = conversoesMetaPeriodo > 0 ? (faturamentoMetaPeriodo / 100) / conversoesMetaPeriodo : 0;

  // LTV (Lifetime Value): total gasto por esses clientes adquiridos via Meta Ads
  const metaCustomersBookings = allConfirmedBookings.filter((b) => 
    b.customer?.phone && metaPhones.has(b.customer.phone)
  );
  const totalSpentByMetaCustomers = metaCustomersBookings.reduce((sum, b) => sum + b.totalCents, 0);
  const uniqueMetaCustomersCount = new Set(metaCustomersBookings.map((b) => b.customer?.phone).filter(Boolean)).size;
  const metaLtv = uniqueMetaCustomersCount > 0 ? (totalSpentByMetaCustomers / 100) / uniqueMetaCustomersCount : 0;

  // ── Timeline — agrupa por dia ──────────────────────────────────────────────
  const leadsMap: Record<string, number> = {};
  const bookingsMap: Record<string, number> = {};

  // preenche todos os dias do período com 0
  for (let i = 0; i <= period; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const k = dateKey(d);
    leadsMap[k] = 0;
    bookingsMap[k] = 0;
  }

  for (const l of leadsTimeline) leadsMap[dateKey(l.createdAt)] = (leadsMap[dateKey(l.createdAt)] ?? 0) + 1;
  for (const b of mappedBookings) {
    const k = dateKey(b.salesDate);
    if (bookingsMap[k] !== undefined) {
      bookingsMap[k] = (bookingsMap[k] ?? 0) + 1;
    }
  }

  const allDates = Object.keys(leadsMap).sort();
  const timeline = allDates.map((date) => ({
    date,
    leads: leadsMap[date] ?? 0,
    reservas: bookingsMap[date] ?? 0,
  }));

  // ── Follow-ups map ─────────────────────────────────────────────────────────
  const followupMap: Record<string, number> = {};
  for (const f of followupInteractions) {
    if (f.aiEngine) followupMap[f.aiEngine] = f._count.id;
  }

  // ── Resposta ───────────────────────────────────────────────────────────────
  return NextResponse.json({
    period,
    kpis: {
      leads: { total: totalLeads, periodo: leadsNoPeriodo, hoje: leadsHoje },
      reservas: {
        confirmadas: confirmedBookings,
        periodo: confirmedNoPeriodo,
        faturamentoTotal,
        faturamentoPeriodo,
      },
      clientes: { total: totalCustomers },
      taxaConversao,
      taxaAbandono,
      ticketMedio,
    },
    funil: [
      { stage: "Visitas (eventos)", count: evPageView },
      { stage: "Clique WhatsApp", count: evWhatsapp },
      { stage: "Pediu Orçamento", count: evQuote },
      { stage: "Iniciou Checkout", count: evCheckout },
      { stage: "Compra Finalizada", count: evPurchase },
    ],
    canais: leadsBySource.map((r) => ({ canal: r.source ?? "—", count: r._count.id })),
    utms: leadsByUtm.map((r) => ({ source: r.utmSource ?? "—", count: r._count.id })),
    metaAds: {
      spend: metaSpend,
      clicks: metaClicks,
      impressions: metaImpressions,
      reach: metaReach,
      cpc: metaCpc,
      cpl: metaCpl,
      ctr: metaCtr,
      cpm: metaCpm,
      cpa: metaCpa,
      cac: metaCac,
      roas: metaRoas,
      roi: metaRoi,
      cbr: metaCbr,
      aov: metaAov,
      ltv: metaLtv,
      leads: metaLeadsNoPeriodo,
      faturamento: faturamentoMetaPeriodo,
      conversoes: conversoesMetaPeriodo,
      bookings: confirmedMetaNoPeriodoList.map((b) => {
        const lead = metaLeads.find((l) => l.whatsapp === b.customer?.phone);
        const originType = lead?.source === "whatsapp_ad" ? "WhatsApp (Direto)" : "Site (Checkout)";
        return {
          id: b.id,
          createdAt: b.createdAt,
          totalCents: b.totalCents,
          routeLabel: b.routeLabel,
          customerName: b.customer?.name ?? "Cliente",
          customerPhone: b.customer?.phone ?? "",
          originType,
        };
      }),
    },
    followups: {
      d1: followupMap["followup_d1"] ?? 0,
      d3: followupMap["followup_d3"] ?? 0,
      d7: followupMap["followup_d7"] ?? 0,
      r30: followupMap["reactivation_d30"] ?? 0,
      r60: followupMap["reactivation_d60"] ?? 0,
      r90: followupMap["reactivation_d90"] ?? 0,
    },
    timeline,
  });
}
