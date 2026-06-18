/**
 * POST /api/admin/jolie-analytics
 *
 * Recebe uma pergunta do admin, busca dados reais do banco,
 * formata contexto e chama Claude para análise inteligente.
 * Retorna streaming de texto.
 */

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getIsAdmin } from "@/lib/server/adminAuth";
import { prisma } from "@/lib/db";
import { fetchMetaAdInsights } from "@/lib/meta-ads";
import { isGoogleAdsConfigured, fetchGoogleAdsInsights } from "@/lib/google-ads";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function buildDataContext(): Promise<string> {
  const now = new Date();
  const day30 = new Date(now); day30.setDate(now.getDate() - 30);
  const day7  = new Date(now); day7.setDate(now.getDate() - 7);

  const [
    totalLeads,
    leadsThisWeek,
    leadsThisMonth,
    leadsByStatus,
    hotLeads,
    bookingsTotal,
    bookingsThisMonth,
    bookingsThisWeek,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: day7 } } }),
    prisma.lead.count({ where: { createdAt: { gte: day30 } } }),
    prisma.lead.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.lead.findMany({
      where: { status: { in: ["quente", "pronto"] } },
      select: { name: true, whatsapp: true, status: true, score: true, travelDate: true, valueCents: true },
      orderBy: { score: "desc" },
      take: 10,
    }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.findMany({
      where: { status: "CONFIRMED", createdAt: { gte: day30 } },
      select: { totalCents: true, payMethod: true, tripType: true, createdAt: true },
    }),
    prisma.booking.findMany({
      where: { status: "CONFIRMED", createdAt: { gte: day7 } },
      select: { totalCents: true },
    }),
  ]);

  const faturamentoMes = bookingsThisMonth.reduce((s, b) => s + b.totalCents, 0);
  const faturamentoSemana = bookingsThisWeek.reduce((s, b) => s + b.totalCents, 0);
  const ticketMedio = bookingsThisMonth.length > 0
    ? Math.round(faturamentoMes / bookingsThisMonth.length)
    : 0;

  const statusMap = Object.fromEntries(leadsByStatus.map((s) => [s.status, s._count.status]));
  const convertidos = statusMap["convertido"] ?? 0;
  const taxaConvMes = leadsThisMonth > 0
    ? Math.round((bookingsThisMonth.length / leadsThisMonth) * 100)
    : 0;

  // Meta Ads últimos 7 dias
  let adSpendWeek = 0;
  let adSpendMonth = 0;
  try {
    const todayStr = now.toISOString().slice(0, 10);
    const weekStr  = day7.toISOString().slice(0, 10);
    const monthStr = day30.toISOString().slice(0, 10);
    const [wInsights, mInsights] = await Promise.all([
      fetchMetaAdInsights(weekStr, todayStr),
      fetchMetaAdInsights(monthStr, todayStr),
    ]);
    adSpendWeek  = wInsights.reduce((s, i) => s + (i.spend ?? 0), 0);
    adSpendMonth = mInsights.reduce((s, i) => s + (i.spend ?? 0), 0);
  } catch {}

  // Google Ads (quando configurado)
  let googleAdSpendMonth = 0;
  if (isGoogleAdsConfigured()) {
    try {
      const g = await fetchGoogleAdsInsights(day30.toISOString().slice(0, 10), now.toISOString().slice(0, 10));
      if (g) googleAdSpendMonth = g.totalSpend;
    } catch {}
  }

  const cpaMonth = bookingsThisMonth.length > 0 && (adSpendMonth + googleAdSpendMonth) > 0
    ? (adSpendMonth + googleAdSpendMonth) / bookingsThisMonth.length
    : 0;

  const brl = (cents: number) =>
    `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return `
=== DADOS REAIS DA MULTI TRIP — ${now.toLocaleDateString("pt-BR")} ===

LEADS (CRM):
- Total geral: ${totalLeads}
- Últimos 7 dias: ${leadsThisWeek}
- Últimos 30 dias: ${leadsThisMonth}
- Por status: Frio(${statusMap.frio ?? 0}) | Interessado(${statusMap.interessado ?? 0}) | Quente(${statusMap.quente ?? 0}) | Pronto(${statusMap.pronto ?? 0}) | Convertido(${convertidos})
- Taxa de conversão (30 dias): ${taxaConvMes}%

LEADS QUENTES/PRONTOS AGORA:
${hotLeads.length === 0 ? "- Nenhum no momento" : hotLeads.map((l) =>
  `- ${l.name ?? l.whatsapp} | Status: ${l.status} | Score: ${l.score}${l.travelDate ? ` | Viagem: ${new Date(l.travelDate).toLocaleDateString("pt-BR")}` : ""}${l.valueCents ? ` | Valor est: ${brl(l.valueCents)}` : ""}`
).join("\n")}

RESERVAS CONFIRMADAS:
- Total histórico: ${bookingsTotal}
- Últimos 30 dias: ${bookingsThisMonth.length}
- Últimos 7 dias: ${bookingsThisWeek.length}
- Faturamento (30 dias): ${brl(faturamentoMes)}
- Faturamento (7 dias): ${brl(faturamentoSemana)}
- Ticket médio (30 dias): ${ticketMedio > 0 ? brl(ticketMedio) : "sem dados"}

MARKETING / ADS:
- Meta Ads gasto (7 dias): R$ ${adSpendWeek.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Meta Ads gasto (30 dias): R$ ${adSpendMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
${googleAdSpendMonth > 0 ? `- Google Ads gasto (30 dias): R$ ${googleAdSpendMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "- Google Ads: não configurado"}
- CPA estimado (30 dias): ${cpaMonth > 0 ? `R$ ${cpaMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "sem dados suficientes"}

=== FIM DOS DADOS ===
`.trim();
}

export async function POST(req: Request) {
  if (!(await getIsAdmin())) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
  }

  const { question, history = [] } = await req.json().catch(() => ({ question: "", history: [] }));

  if (!question?.trim()) {
    return NextResponse.json({ error: "Pergunta vazia." }, { status: 400 });
  }

  const dataContext = await buildDataContext();

  const systemPrompt = `Você é a Jolie — analista de inteligência de negócios da Multi Trip Receptivos e Viagens.
A Multi Trip oferece transfer privativo premium entre o Aeroporto de Porto Alegre (POA) e Gramado/Canela, na Serra Gaúcha.
Fundadores: Eric Bueno (+10 anos em transporte) e Rita (mulher, negra, mão atípica) — sempre "Rita e Eric".

Você tem acesso a dados reais e atualizados do sistema. Use-os para responder com precisão.
Seja direta, objetiva e estratégica. Não use rodeios. Aponte o que importa e sugira ações concretas.
Use emojis com moderação. Responda em português brasileiro.
Nunca invente dados — se não souber, diga que não tem a informação.

DADOS ATUAIS DO SISTEMA:
${dataContext}`;

  const messages: Anthropic.MessageParam[] = [
    ...history.map((h: { role: string; content: string }) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user", content: question },
  ];

  // Streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.stream({
          model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
          max_tokens: 1024,
          system: systemPrompt,
          messages,
        });

        for await (const chunk of response) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } catch (err: any) {
        controller.enqueue(encoder.encode(`\n\nErro: ${err.message}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
