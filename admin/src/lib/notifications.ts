import { prisma } from "@/lib/db";
import { ADDONS, CHILD_SEAT_LABELS, type AddonId, type ChildSeatId } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import { sendEmail } from "@/lib/email";
import { notifyCliente, notifyTeam } from "@/lib/notify";

export type NotifyPaymentExtra = {
  paymentId?: string;
  mpStatus?: string;
  amountCents?: number;
};

function truthyEnv(v: string | undefined, defaultValue = true) {
  if (v === undefined || v === null || String(v).trim() === "") return defaultValue;
  const s = String(v).trim().toLowerCase();
  if (["0", "false", "no", "off"].includes(s)) return false;
  if (["1", "true", "yes", "on"].includes(s)) return true;
  return defaultValue;
}

function parseEmails(v: string | undefined): string[] {
  if (!v) return [];
  return v
    .split(/[;,\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function brlFromCents(cents: number) {
  const value = cents / 100;
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
}

function getSiteBaseUrl() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || SITE.url || "").trim();
  return raw ? raw.replace(/\/$/, "") : "";
}

function adminBookingUrl(bookingId: string, publicToken: string | null | undefined) {
  const base = getSiteBaseUrl();
  return base && publicToken ? `${base}/reserva/dados?bookingId=${bookingId}&t=${publicToken}` : "";
}

function parseBookingOptionals(raw: string | null | undefined) {
  if (!raw) {
    return {
      addonsSummary: [] as string[],
      childSeatSummary: [] as string[],
    };
  }

  try {
    const parsed = JSON.parse(raw);
    const addonsSource =
      parsed && typeof parsed === "object" && parsed.addons && typeof parsed.addons === "object"
        ? parsed.addons
        : parsed;
    const childSeatsSource =
      parsed &&
      typeof parsed === "object" &&
      parsed.childSeats &&
      typeof parsed.childSeats === "object"
        ? parsed.childSeats
        : {};

    const addonsSummary = Object.entries(addonsSource || {})
      .filter(([id, qty]) => id in ADDONS && typeof qty === "number" && Number(qty) > 0)
      .map(([id, qty]) => `${ADDONS[id as AddonId].label} x${qty}`);

    const childSeatSummary = Object.entries(childSeatsSource || {})
      .filter(([id, qty]) => id in CHILD_SEAT_LABELS && typeof qty === "number" && Number(qty) > 0)
      .map(([id, qty]) => `${CHILD_SEAT_LABELS[id as ChildSeatId]} x${qty}`);

    return { addonsSummary, childSeatSummary };
  } catch {
    return {
      addonsSummary: [] as string[],
      childSeatSummary: [] as string[],
    };
  }
}

async function fetchBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      payments: { orderBy: { createdAt: "desc" }, take: 5 },
      passengers: { orderBy: { fullName: "asc" } },
    },
  });

  if (!booking) return null;

  return {
    ...booking,
    customer: booking.customer
      ? {
          name: booking.customer.name,
          phone: booking.customer.phone,
          whatsapp: booking.customer.phone,
          email: booking.customer.email,
        }
      : null,
  } as NotifyBooking;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), Math.max(200, timeoutMs));
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/**
 * EMAIL (Resend) — recomendado pela simplicidade e estabilidade em Vercel
 * Vars:
 * - RESEND_API_KEY
 * - RESEND_FROM (ex: "Multi Trip <reservas@multitrip.com.br>")
 * - NOTIFY_EMAIL_TO (um ou mais e-mails, separados por vírgula)
 */
async function sendEmailResend(args: { subject: string; text: string; html?: string }) {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  const to = parseEmails(process.env.NOTIFY_EMAIL_TO);
  const from = (process.env.RESEND_FROM || "").trim();

  if (!apiKey || !to.length || !from)
    return { ok: false, skipped: true as const, reason: "missing_env" };

  const timeoutMs = Number(process.env.NOTIFY_TIMEOUT_MS || 3500);

  const res = await fetchWithTimeout(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: args.subject,
        text: args.text,
        ...(args.html ? { html: args.html } : {}),
      }),
      cache: "no-store",
    },
    timeoutMs
  );

  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`Resend email failed (${res.status}): ${details || res.statusText}`);
  }

  return { ok: true as const };
}

/**
 * WHATSAPP — usa notify.ts (Cloud API Meta) como implementação única
 */
async function sendWhatsApp(args: { message: string; payload?: unknown }) {
  await notifyTeam(args.message);
  return { ok: true as const, method: "cloud" as const };
}

export interface NotifyBooking {
  id?: string;
  customer?: {
    name?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
  } | null;
  routeLabel?: string | null;
  payMethod?: string | null;
  hotel?: string | null;
  idaDate?: Date | string | null;
  idaFlightTime?: string | null;
  idaFlightNumber?: string | null;
  voltaDate?: Date | string | null;
  voltaFlightTime?: string | null;
  voltaFlightNumber?: string | null;
  pax?: string | null;
  passengerCount?: number | null;
  hotelAddress?: string | null;
  totalCents?: number | null;
  depositCents?: number | null;
  remainderCents?: number | null;
  optionalsJson?: string | null;
  publicToken?: string | null;
}

function buildAdminMessage(booking: NotifyBooking, title: string, extraLines: string[] = []) {
  const id = booking?.id || "";
  const customerName = booking?.customer?.name || "";
  const customerWhats = booking?.customer?.phone || booking?.customer?.whatsapp || "";
  const customerEmail = booking?.customer?.email || "";
  const routeLabel = booking?.routeLabel || "";
  const payMethod = booking?.payMethod || "";
  const hotel = booking?.hotel || "";
  const idaDate = booking?.idaDate || "";
  const idaTime = booking?.idaFlightTime || "";
  const idaFlight = booking?.idaFlightNumber || "";
  const voltaDate = booking?.voltaDate || "";
  const voltaTime = booking?.voltaFlightTime || "";
  const voltaFlight = booking?.voltaFlightNumber || "";
  const pax = booking?.pax || "";
  const passengerCount = booking?.passengerCount ?? "";
  const hotelAddress = booking?.hotelAddress || "";
  const totalCents = Number(booking?.totalCents || 0);
  const depositCents = Number(booking?.depositCents || 0);
  const remainderCents = Number(booking?.remainderCents || 0);
  const { addonsSummary, childSeatSummary } = parseBookingOptionals(booking?.optionalsJson);

  const adminUrl = adminBookingUrl(id, booking?.publicToken);

  const lines = [
    `📌 ${title}`,
    `#${id}`,
    "",
    `👤 Cliente: ${customerName}`,
    `📱 Whats: ${customerWhats}`,
    `📧 Email: ${customerEmail}`,
    "",
    `🧭 Rota: ${routeLabel}`,
    `👥 Pax: ${pax} | Real: ${passengerCount}`,
    `💳 Pagamento: ${payMethod}`,
    "",
    `🏨 Hotel: ${hotel}`,
    hotelAddress ? `📝 Operação: ${hotelAddress}` : "",
    idaDate || idaTime || idaFlight
      ? `✈️ Chegada In: ${idaDate || "-"} ${idaTime || ""} ${idaFlight ? `(${idaFlight})` : ""}`.trim()
      : "",
    voltaDate || voltaTime || voltaFlight
      ? `↩️ Retorno Out: ${voltaDate || "-"} ${voltaTime || ""} ${voltaFlight ? `(${voltaFlight})` : ""}`.trim()
      : "",
    childSeatSummary.length ? `🧒 Transporte infantil: ${childSeatSummary.join(", ")}` : "",
    addonsSummary.length ? `➕ Adicionais: ${addonsSummary.join(", ")}` : "",
    "",
    `💰 Total: ${brlFromCents(totalCents)}`,
    `💸 Sinal: ${brlFromCents(depositCents)} | Saldo: ${brlFromCents(remainderCents)}`,
    "",
    ...(extraLines.length ? extraLines : []),
    ...(adminUrl ? [`🔗 Admin: ${adminUrl}`] : []),
  ].filter((l) => l !== "");

  return lines.join("\n");
}

function buildEmailHtmlFromText(text: string) {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const html = `<div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5;">
  <pre style="white-space:pre-wrap; background:#0b0b0b; color:#f3f3f3; padding:16px; border-radius:12px;">${esc(text)}</pre>
</div>`;
  return html;
}

function buildCustomerMessage(booking: NotifyBooking, isPaid: boolean) {
  const name = booking?.customer?.name?.split(" ")[0] || "Cliente";
  const id = booking?.id || "";
  const routeLabel = booking?.routeLabel || "";
  const lines = [
    `Olá, ${name}.`,
    "",
    `A sua experiência na rota ${routeLabel} (Reserva #${id}) foi registrada pela nossa equipe.`,
    "",
    isPaid
      ? `💎 Fique tranquilo. O pagamento foi recebido e seu veículo premium já está garantido e aguardando sua chegada.`
      : `⚠️ Aguardamos a efetivação do pagamento do sinal via Checkout Seguro para travar a agenda do seu veículo.`,
    "",
    `Nosso serviço de Concierge está ativo. Para qualquer alinhamento, orçamentos adicionais ou personalização do seu trajeto, basta responder esta mensagem.`,
    "",
    `Aguardamos você para esta jornada.`,
    `— Equipe Multi Trip Receptivo Executivo`,
  ];
  return lines.join("\n");
}

async function notifyAllChannels(subject: string, messageText: string, payload?: unknown) {
  const emailEnabled = truthyEnv(process.env.NOTIFY_EMAIL_ENABLED, true);
  const whatsappEnabled = truthyEnv(process.env.NOTIFY_WHATSAPP_ENABLED, true);

  const results: Record<string, unknown> = {};

  if (emailEnabled) {
    try {
      const html = buildEmailHtmlFromText(messageText);
      results.email = await sendEmailResend({ subject, text: messageText, html });
    } catch (e: unknown) {
      results.email = { ok: false, error: String(e instanceof Error ? e.message : e) };
    }
  } else {
    results.email = { ok: false, skipped: true, reason: "disabled" };
  }

  if (whatsappEnabled) {
    try {
      results.whatsapp = await sendWhatsApp({ message: messageText, payload });
    } catch (e: unknown) {
      results.whatsapp = { ok: false, error: String(e instanceof Error ? e.message : e) };
    }
  } else {
    results.whatsapp = { ok: false, skipped: true, reason: "disabled" };
  }

  return results;
}

export async function notifyBookingCreated(bookingId: string) {
  if (!truthyEnv(process.env.NOTIFY_ON_BOOKING_CREATED, true))
    return { ok: false, skipped: true as const, reason: "disabled" };

  const booking = await fetchBooking(bookingId);
  if (!booking) return { ok: false, skipped: true as const, reason: "not_found" };

  const title = "NOVA RESERVA (pendente de pagamento)";
  const msg = buildAdminMessage(booking, title);
  const subject = `Nova reserva #${bookingId} - ${booking.routeLabel || "Multi Trip"}`;

  try {
    const customerMsg = buildCustomerMessage(booking, false);
    if (booking.customer?.email)
      Promise.resolve(
        sendEmail(
          booking.customer.email,
          `Reserva Multi Trip #${bookingId}`,
          buildEmailHtmlFromText(customerMsg)
        )
      ).catch(() => {});
    const customerWhats = booking.customer?.phone || booking.customer?.whatsapp;
    if (customerWhats) Promise.resolve(notifyCliente(customerWhats, customerMsg)).catch(() => {});
  } catch (err) {
    console.error(`❌ Erro ao notificar cliente sobre a reserva #${bookingId}:`, err);
  }
  return notifyAllChannels(subject, msg, { event: "booking_created", bookingId });
}

export async function notifyPaymentConfirmed(bookingId: string, extra?: NotifyPaymentExtra) {
  if (!truthyEnv(process.env.NOTIFY_ON_PAYMENT_CONFIRMED, true))
    return { ok: false, skipped: true as const, reason: "disabled" };

  const booking = await fetchBooking(bookingId);
  if (!booking) return { ok: false, skipped: true as const, reason: "not_found" };

  const extraLines: string[] = [];
  if (extra?.paymentId) extraLines.push(`🧾 Pagamento ID: ${extra.paymentId}`);
  if (extra?.mpStatus) extraLines.push(`✅ Status MP: ${extra.mpStatus}`);
  if (typeof extra?.amountCents === "number")
    extraLines.push(`💳 Valor pago: ${brlFromCents(extra.amountCents)}`);

  const title = "PAGAMENTO CONFIRMADO ✅";
  const msg = buildAdminMessage(booking, title, extraLines);
  const subject = `Pagamento confirmado #${bookingId} - ${booking.routeLabel || "Multi Trip"}`;

  try {
    const customerMsg = buildCustomerMessage(booking, true);
    if (booking.customer?.email)
      Promise.resolve(
        sendEmail(
          booking.customer.email,
          `Pagamento Confirmado - Reserva #${bookingId}`,
          buildEmailHtmlFromText(customerMsg)
        )
      ).catch(() => {});
    const customerWhats = booking.customer?.phone || booking.customer?.whatsapp;
    if (customerWhats) Promise.resolve(notifyCliente(customerWhats, customerMsg)).catch(() => {});
  } catch (err) {
    console.error(`❌ Erro ao notificar cliente sobre o pagamento #${bookingId}:`, err);
  }
  return notifyAllChannels(subject, msg, { event: "payment_confirmed", bookingId, extra });
}

// ─── NOTIFICAÇÃO DE LEAD JOLIE ───────────────────────────────────────────────

export interface JolieLeadNotifyArgs {
  phone: string | null;
  sessionId: string;
  history: Array<{ role: string; content: string; timestamp?: string }>;
  intent: string | null;
  handoffReason?: string;
  cvcDestination?: string;
}

/**
 * Notifica Rita e Eric via WhatsApp quando Jolie identifica um lead quente.
 * Enviado nos casos:
 *  - handoffToHuman = true (cliente pediu humano, mencionou SUV/executivo, etc.)
 *  - intent de pacote CVC com destino identificado
 */
export async function notifyJolieHandoff(args: JolieLeadNotifyArgs): Promise<void> {
  const { phone, sessionId, history, intent, handoffReason, cvcDestination } = args;

  // Extrai últimas mensagens do cliente para contexto
  const clientMessages = history
    .filter((h) => h.role === "user")
    .slice(-5)
    .map((h) => `• ${h.content.slice(0, 120)}`)
    .join("\n");

  const jolieLastReply = history
    .filter((h) => h.role === "assistant")
    .at(-1)?.content?.slice(0, 200) ?? "";

  const lines = [
    `🔔 *LEAD JOLIE — ${handoffReason ? "HANDOFF" : "PACOTE CVC"}*`,
    "",
    phone ? `📱 WhatsApp: wa.me/${phone.replace(/\D/g, "")}` : `📱 Sessão site: ${sessionId}`,
    intent ? `🎯 Intenção: ${intent}` : "",
    cvcDestination ? `🌍 Destino CVC: ${cvcDestination}` : "",
    handoffReason ? `🔄 Motivo handoff: ${handoffReason}` : "",
    "",
    `💬 *Últimas mensagens do cliente:*`,
    clientMessages || "— sem histórico —",
    "",
    `🤖 *Última resposta da Jolie:*`,
    jolieLastReply || "—",
    "",
    `⏱️ ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
  ].filter((l) => l !== "").join("\n");

  await notifyTeam(lines);
}

export async function notifyPaymentFailed(bookingId: string, extra?: NotifyPaymentExtra) {
  if (!truthyEnv(process.env.NOTIFY_ON_PAYMENT_FAILED, true))
    return { ok: false, skipped: true as const, reason: "disabled" };

  const booking = await fetchBooking(bookingId);
  if (!booking) return { ok: false, skipped: true as const, reason: "not_found" };

  const extraLines: string[] = [];
  if (extra?.paymentId) extraLines.push(`🧾 Pagamento ID: ${extra.paymentId}`);
  if (extra?.mpStatus) extraLines.push(`⚠️ Status MP: ${extra.mpStatus}`);
  if (typeof extra?.amountCents === "number")
    extraLines.push(`💳 Valor: ${brlFromCents(extra.amountCents)}`);

  const title = "PAGAMENTO FALHOU / CANCELADO ⚠️";
  const msg = buildAdminMessage(booking, title, extraLines);
  const subject = `Pagamento falhou #${bookingId} - ${booking.routeLabel || "Multi Trip"}`;

  return notifyAllChannels(subject, msg, { event: "payment_failed", bookingId, extra });
}
