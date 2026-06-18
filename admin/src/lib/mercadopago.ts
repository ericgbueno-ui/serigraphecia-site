import crypto from "node:crypto";

import { prisma } from "@/lib/db";
// BookingStatus removed — status is now stored as plain string in DB
import {
  notifyPaymentConfirmed,
  notifyPaymentFailed,
  type NotifyPaymentExtra,
} from "@/lib/notifications";
import { SITE } from "@/lib/site";

export interface MpPayment {
  id: number;
  status: string;
  status_detail?: string | null;
  external_reference?: string | null;
  transaction_amount?: number | null;
  currency_id?: string | null;
  date_approved?: string | null;
  payment_type_id?: string | null;
  metadata?: {
    booking_id?: string | null;
    [key: string]: unknown;
  } | null;
}

export function getMercadoPagoToken() {
  return (process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN || "").trim();
}

function getMercadoPagoWebhookSecret() {
  return (process.env.MP_WEBHOOK_SECRET || process.env.MERCADOPAGO_WEBHOOK_SECRET || "").trim();
}

export function resolveMercadoPagoSiteUrl() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || SITE.url || "").trim().replace(/\/$/, "");

  if (!raw) {
    return {
      ok: false as const,
      error:
        "Configure NEXT_PUBLIC_SITE_URL com a URL publica do site antes de ativar o Mercado Pago.",
    };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(raw);
  } catch {
    return {
      ok: false as const,
      error:
        "NEXT_PUBLIC_SITE_URL invalida. Use uma URL completa, por exemplo https://multitrip.com.br.",
    };
  }

  if (parsedUrl.protocol !== "https:") {
    return {
      ok: false as const,
      error:
        "O checkout do Mercado Pago exige NEXT_PUBLIC_SITE_URL publica em https:// para back_urls e webhook.",
    };
  }

  return {
    ok: true as const,
    url: parsedUrl.toString().replace(/\/$/, ""),
  };
}

export function getMercadoPagoPayerPhone(whatsapp: string) {
  const digits = String(whatsapp || "").replace(/\D/g, "");
  const localDigits =
    digits.length > 11 && digits.startsWith("55") ? digits.slice(-11) : digits.slice(-11);

  return {
    area_code: localDigits.slice(0, 2) || "51",
    number: localDigits.slice(2) || localDigits || "000000000",
  };
}

export function getMercadoPagoPaymentMethodsConfig(payMethod: string, maxInstallments = 4) {
  if (payMethod === "pix") {
    return {
      default_payment_method_id: "pix",
      installments: 1,
      excluded_payment_types: [
        { id: "credit_card" },
        { id: "debit_card" },
        { id: "ticket" },
        { id: "atm" },
        { id: "prepaid_card" },
      ],
    };
  }

  return {
    installments: maxInstallments,
    default_installments: 1,
    excluded_payment_types: [
      { id: "bank_transfer" },
      { id: "ticket" },
      { id: "atm" },
      { id: "debit_card" },
      { id: "prepaid_card" },
    ],
  };
}

export async function parseMercadoPagoJson(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function fetchMercadoPagoPayment(paymentId: string): Promise<MpPayment | null> {
  const mpToken = getMercadoPagoToken();
  if (!mpToken) return null;

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) return null;
    return (await response.json()) as MpPayment;
  } catch {
    return null;
  }
}

export function mpStatusToBookingStatus(mpStatus: string): string {
  switch (mpStatus) {
    case "approved":
      return "CONFIRMED";
    case "rejected":
    case "cancelled":
    case "refunded":
    case "charged_back":
      return "CANCELLED";
    default:
      return "PENDING";
  }
}

function resolveNextBookingStatus(currentStatus: string, mpStatus: string): string {
  const incomingStatus = mpStatusToBookingStatus(mpStatus);

  if (incomingStatus === "CONFIRMED") return "CONFIRMED";
  if (currentStatus === "CONFIRMED") return "CONFIRMED";
  if (incomingStatus === "PENDING") return "PENDING";
  return "CANCELLED";
}

function buildMercadoPagoNotifyExtra(payment: MpPayment, amountCents: number): NotifyPaymentExtra {
  return {
    paymentId: String(payment.id),
    mpStatus: payment.status,
    amountCents,
  };
}

export async function syncBookingFromMercadoPagoPaymentId(
  paymentId: string,
  options?: { notify?: boolean }
) {
  const payment = await fetchMercadoPagoPayment(String(paymentId || "").trim());
  if (!payment) {
    return { ok: false as const, reason: "payment_not_found" };
  }

  return syncBookingFromMercadoPagoPayment(payment, options);
}

export async function syncBookingFromMercadoPagoPayment(
  payment: MpPayment,
  options?: { notify?: boolean }
) {
  const providerId = String(payment.id || "").trim();
  const bookingId = String(payment.external_reference || payment.metadata?.booking_id || "").trim();

  if (!providerId || !bookingId) {
    return { ok: false as const, reason: "missing_reference" };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      payMethod: true,
    },
  });

  if (!booking) {
    return { ok: false as const, reason: "booking_not_found", bookingId };
  }

  const previousPayment = await prisma.payment.findUnique({
    where: { providerId },
    select: { status: true },
  });

  const amountCents = Math.round(Number(payment.transaction_amount ?? 0) * 100);
  const nextBookingStatus = resolveNextBookingStatus(booking.status, payment.status);

  await prisma.payment.upsert({
    where: { providerId },
    create: {
      bookingId,
      method: booking.payMethod || "pix",
      status: payment.status,
      amountCents,
      providerId,
      paidAt: payment.date_approved ? new Date(payment.date_approved) : null,
    },
    update: {
      status: payment.status,
      amountCents,
      paidAt: payment.date_approved ? new Date(payment.date_approved) : null,
    },
  });

  if (nextBookingStatus !== booking.status) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: nextBookingStatus },
    });
  }

  if (options?.notify !== false) {
    const extra = buildMercadoPagoNotifyExtra(payment, amountCents);
    const becamePaid = nextBookingStatus === "CONFIRMED" && booking.status !== "CONFIRMED";
    const shouldNotifyFailure =
      nextBookingStatus === "CANCELLED" &&
      booking.status !== "CONFIRMED" &&
      (booking.status !== "CANCELLED" || previousPayment?.status !== payment.status);

    if (becamePaid) {
      await notifyPaymentConfirmed(bookingId, extra).catch(() => {});

      // Garante que a URL do contrato está registrada (PDF gerado on-demand por /api/contracts/[id])
      prisma.booking
        .update({
          where: { id: bookingId },
          data: { contractPdfUrl: `/api/contracts/${bookingId}` },
        })
        .catch(() => {});
    } else if (shouldNotifyFailure) {
      await notifyPaymentFailed(bookingId, extra).catch(() => {});
    }
  }

  return {
    ok: true as const,
    bookingId,
    bookingStatus: nextBookingStatus,
    paymentStatus: payment.status,
    amountCents,
  };
}

export function extractMercadoPagoWebhookEvent(req: Request, body: unknown) {
  const url = new URL(req.url);
  const bodyObj = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const bodyData =
    bodyObj.data && typeof bodyObj.data === "object"
      ? (bodyObj.data as Record<string, unknown>)
      : {};

  const type = String(
    bodyObj.type ||
      bodyObj.topic ||
      url.searchParams.get("type") ||
      url.searchParams.get("topic") ||
      ""
  )
    .trim()
    .toLowerCase();

  const action = String(bodyObj.action || url.searchParams.get("action") || "")
    .trim()
    .toLowerCase();
  const dataId = String(
    bodyData.id || url.searchParams.get("data.id") || url.searchParams.get("id") || ""
  ).trim();

  return { type, action, dataId };
}

function parseMercadoPagoSignature(header: string) {
  const parsed = new Map<string, string>();

  for (const entry of header.split(",")) {
    const [rawKey, rawValue] = entry.split("=");
    const key = String(rawKey || "").trim();
    const value = String(rawValue || "").trim();
    if (key && value) parsed.set(key, value);
  }

  return {
    ts: parsed.get("ts") || "",
    v1: parsed.get("v1") || "",
  };
}

export function verifyMercadoPagoWebhookSignature(req: Request) {
  const secret = getMercadoPagoWebhookSecret();
  if (!secret) {
    return { valid: true as const, skipped: true as const };
  }

  const signatureHeader = req.headers.get("x-signature") || "";
  const requestId = req.headers.get("x-request-id") || "";
  const dataId =
    new URL(req.url).searchParams.get("data.id") || new URL(req.url).searchParams.get("id") || "";

  if (!signatureHeader || !requestId || !dataId) {
    return { valid: false as const, reason: "missing_signature_headers" };
  }

  const { ts, v1 } = parseMercadoPagoSignature(signatureHeader);
  if (!ts || !v1) {
    return { valid: false as const, reason: "invalid_signature_header" };
  }

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    const receivedBuffer = Buffer.from(v1, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (receivedBuffer.length !== expectedBuffer.length) {
      return { valid: false as const, reason: "signature_length_mismatch" };
    }

    const valid = crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
    return valid
      ? { valid: true as const }
      : { valid: false as const, reason: "signature_mismatch" };
  } catch {
    return { valid: false as const, reason: "signature_parse_failed" };
  }
}
