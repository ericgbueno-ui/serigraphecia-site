/**
 * GET /api/cron/morning-briefing
 *
 * Briefing diário das 7h BRT (10h UTC) enviado no WhatsApp da equipe.
 *
 * O que faz:
 *  1. Mostra as viagens operacionais do dia
 *  2. Lista leads quentes parados > 24h
 *  3. Para leads COM histórico de conversa → Jolie reativa automaticamente
 *  4. Para leads SEM histórico → texto pronto para Eric copiar/enviar
 *  5. Progresso da meta do mês + valores a receber
 */

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db";
import { notifyTeam } from "@/lib/notify";
import { sendWhatsApp } from "@/lib/meta-whatsapp";
import { toBrtDateString } from "@/lib/meta-ads";
import { saveInteraction } from "@/lib/lead";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function brl(cents: number) {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function fmtHora(h: string | null | undefined) {
  return h ?? "—";
}

/**
 * Gera mensagem de reativação personalizada.
 * Cascade: Gemini → Claude → ChatGPT
 */
async function gerarMensagemReativacao(lead: {
  name: string | null;
  whatsapp: string;
  status: string;
  score: number;
  travelDate: Date | null;
  origin: string | null;
  destination: string | null;
  valueCents: number | null;
  lastMessage: string | null;
  idleHours: number;
}): Promise<string> {
  const dataViagem = lead.travelDate
    ? lead.travelDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })
    : null;

  const prompt = `Você é a Jolie, concierge da Multi Trip — transfer privativo premium entre Porto Alegre e Gramado/Canela.

Contexto do lead:
- Nome: ${lead.name ?? "não informado"}
- Status: ${lead.status} (score ${lead.score})
- Parado há: ${lead.idleHours}h sem resposta
- Viagem planejada: ${dataViagem ?? "data não informada"}
- Trecho: ${lead.origin ?? "POA"} → ${lead.destination ?? "Gramado/Canela"}
- Valor estimado: ${lead.valueCents ? brl(lead.valueCents) : "não informado"}
- Última mensagem do lead: "${lead.lastMessage ?? "sem registro"}"

Crie UMA mensagem curta de reativação para enviar via WhatsApp.
Regras:
- Máximo 3 linhas
- Tom caloroso, humano, sem pressão
- Referencia a viagem ou algo específico se possível
- Termine com uma pergunta aberta ou convite leve
- NÃO use emojis em excesso (máximo 2)
- NÃO mencione prazo ou urgência agressiva
- Assine como Jolie | Multi Trip

Responda APENAS com o texto da mensagem, sem explicações.`;

  // ── 1. Gemini (primário) ────────────────────────────────────────────────────
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY ?? "";
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) return text;
    } catch (err: any) {
      console.warn("[morning-briefing] Gemini falhou:", err.message);
    }
  }

  // ── 2. Claude (fallback 1) ──────────────────────────────────────────────────
  const anthropicKey = process.env.ANTHROPIC_API_KEY ?? "";
  if (anthropicKey) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
          max_tokens: 200,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text?.trim();
        if (text) return text;
      }
    } catch (err: any) {
      console.warn("[morning-briefing] Claude falhou:", err.message);
    }
  }

  // ── 3. ChatGPT (fallback 2) ─────────────────────────────────────────────────
  const openaiKey = process.env.OPENAI_API_KEY ?? "";
  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch (err: any) {
      console.warn("[morning-briefing] ChatGPT falhou:", err.message);
    }
  }

  // Fallback estático se todas as IAs falharem
  const primeiroNome = (lead.name ?? "").split(" ")[0] || "oi";
  return `Oi ${primeiroNome}, tudo bem? 🤎 Ainda pensando na viagem para a Serra Gaúcha? Estou aqui para ajudar quando quiser. — Jolie | Multi Trip`;
}

export async function GET(req: Request) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const now = new Date();
  const todayBRT = toBrtDateString(); // "YYYY-MM-DD"
  const todayStart = new Date(`${todayBRT}T00:00:00-03:00`);
  const todayEnd   = new Date(`${todayBRT}T23:59:59-03:00`);

  // ── 1. Viagens operacionais de hoje ─────────────────────────────────────────
  const todayBookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      OR: [
        { idaDate:   { gte: todayStart, lte: todayEnd } },
        { voltaDate: { gte: todayStart, lte: todayEnd } },
      ],
    },
    select: {
      id: true,
      tripType: true,
      vehicleType: true,
      passengerCount: true,
      hotel: true,
      idaDate: true,
      idaFlightTime: true,
      idaFlightNumber: true,
      voltaDate: true,
      voltaFlightTime: true,
      voltaFlightNumber: true,
      driverInName: true,
      driverInCar: true,
      driverOutName: true,
      driverOutCar: true,
      idaConcluida: true,
      voltaConcluida: true,
      remainderCents: true,
      customer: { select: { name: true, phone: true } },
    },
    orderBy: { idaDate: "asc" },
  });

  // ── 2. Leads quentes/prontos parados > 24h ──────────────────────────────────
  const idleSince24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const idleLeads = await prisma.lead.findMany({
    where: {
      status: { in: ["quente", "pronto"] },
      updatedAt: { lt: idleSince24h },
    },
    select: {
      id: true,
      whatsapp: true,
      name: true,
      status: true,
      score: true,
      travelDate: true,
      origin: true,
      destination: true,
      valueCents: true,
      updatedAt: true,
      interactions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { role: true, content: true },
      },
    },
    orderBy: { score: "desc" },
    take: 5,
  });

  // ── 3. Meta do mês + faturamento ────────────────────────────────────────────
  const bookingTarget = parseInt(process.env.ALERT_BOOKING_TARGET ?? "8", 10);
  const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);

  const [bookingsThisMonth, pendingAmount] = await Promise.all([
    prisma.booking.count({ where: { status: "CONFIRMED", createdAt: { gte: startOfMonth } } }),
    prisma.booking.aggregate({
      where: { status: "CONFIRMED", remainderCents: { gt: 0 } },
      _sum: { remainderCents: true },
    }),
  ]);

  const metaPct = Math.round((bookingsThisMonth / bookingTarget) * 100);
  const totalPendente = pendingAmount._sum.remainderCents ?? 0;

  // ── 4. Reativação automática (leads COM histórico de conversa) ────────────────
  const reativados: { name: string; msg: string }[] = [];
  const paraAprovacao: { name: string; whatsapp: string; msg: string }[] = [];

  for (const lead of idleLeads) {
    const temHistorico = lead.interactions.length > 0;
    const idleHours = Math.floor((now.getTime() - lead.updatedAt.getTime()) / (1000 * 60 * 60));
    const lastMsg = lead.interactions[0]?.content ?? null;

    try {
      const msg = await gerarMensagemReativacao({
        name: lead.name,
        whatsapp: lead.whatsapp,
        status: lead.status,
        score: lead.score,
        travelDate: lead.travelDate,
        origin: lead.origin,
        destination: lead.destination,
        valueCents: lead.valueCents,
        lastMessage: lastMsg,
        idleHours,
      });

      if (temHistorico) {
        // Envia direto
        await sendWhatsApp(lead.whatsapp, msg);
        await saveInteraction({ whatsapp: lead.whatsapp, role: "jolie", content: msg });
        reativados.push({ name: lead.name ?? lead.whatsapp, msg });
      } else {
        // Prepara para aprovação manual
        paraAprovacao.push({ name: lead.name ?? lead.whatsapp, whatsapp: lead.whatsapp, msg });
      }
    } catch (err: any) {
      console.error(`[morning-briefing] Falha ao reativar ${lead.whatsapp}:`, err.message);
    }
  }

  // ── 5. Monta o briefing ──────────────────────────────────────────────────────
  const dataFormatada = new Date(todayBRT + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long",
  });

  let msg = `☀️ *BOM DIA, RITA E ERIC!*\n`;
  msg += `📅 ${dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)}\n`;

  // Operação
  if (todayBookings.length > 0) {
    msg += `\n*🚗 OPERAÇÃO DE HOJE (${todayBookings.length} viagem${todayBookings.length > 1 ? "s" : ""})*\n`;
    for (const b of todayBookings) {
      const nome = b.customer?.name ?? "—";
      const isIda  = b.idaDate && new Date(b.idaDate) >= todayStart && new Date(b.idaDate) <= todayEnd;
      const isVolta = b.voltaDate && new Date(b.voltaDate) >= todayStart && new Date(b.voltaDate) <= todayEnd;

      if (isIda) {
        msg += `✈️ IN: ${nome} · ${fmtHora(b.idaFlightTime)}${b.idaFlightNumber ? ` (${b.idaFlightNumber})` : ""}\n`;
        msg += `   🚗 ${b.vehicleType} · ${b.passengerCount}p · ${b.hotel ?? "—"}\n`;
        msg += `   👤 Motorista: ${b.driverInName ?? "❗ não designado"}\n`;
      }
      if (isVolta) {
        const busca = b.voltaFlightTime
          ? (() => { const [h, m] = b.voltaFlightTime.split(":"); return `${String(parseInt(h) - 4).padStart(2, "0")}:${m}`; })()
          : null;
        msg += `🛫 OUT: ${nome} · voo ${fmtHora(b.voltaFlightTime)}${b.voltaFlightNumber ? ` (${b.voltaFlightNumber})` : ""}\n`;
        msg += `   🕐 Busca: ${busca ?? "verificar"} · ${b.hotel ?? "—"}\n`;
        msg += `   👤 Motorista: ${b.driverOutName ?? "❗ não designado"}\n`;
      }
      if (b.remainderCents > 0) {
        msg += `   💰 Cobrar no check-in: ${brl(b.remainderCents)}\n`;
      }
    }
  } else {
    msg += `\n✅ Sem viagens operacionais hoje.\n`;
  }

  // Meta do mês
  msg += `\n*📊 META DO MÊS*\n`;
  msg += `${bookingsThisMonth}/${bookingTarget} reservas`;
  const barFilled = Math.round(metaPct / 10);
  msg += ` · ${"█".repeat(barFilled)}${"░".repeat(10 - barFilled)} ${metaPct}%\n`;
  if (totalPendente > 0) {
    msg += `💰 A receber (geral): ${brl(totalPendente)}\n`;
  }

  // Reativações automáticas
  if (reativados.length > 0) {
    msg += `\n*🤖 JOLIE REATIVOU ${reativados.length} LEAD${reativados.length > 1 ? "S" : ""}*\n`;
    reativados.forEach(r => {
      msg += `• ${r.name}\n`;
    });
  }

  // Leads para aprovação manual
  if (paraAprovacao.length > 0) {
    msg += `\n*📝 LEADS P/ VOCÊ ENTRAR EM CONTATO*\n`;
    paraAprovacao.forEach((l, i) => {
      msg += `${i + 1}. *${l.name}* · wa.me/${l.whatsapp}\n`;
      msg += `_"${l.msg}"_\n\n`;
    });
  }

  // Sem leads pendentes
  if (idleLeads.length === 0) {
    msg += `\n✅ Nenhum lead quente parado. Bom sinal!\n`;
  }

  msg += `\n👉 multitrip.com.br/admin`;

  await notifyTeam(msg);

  return NextResponse.json({
    ok: true,
    date: todayBRT,
    todayBookings: todayBookings.length,
    leadsReativados: reativados.length,
    leadsParaAprovacao: paraAprovacao.length,
    metaPct,
  });
}
