const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || "";
const WHATSAPP_TO = process.env.WHATSAPP_TEAM_NUMBER || "5551986876557";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";

function toE164Brazil(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  // Garante prefixo 55 (Brasil)
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

async function sendWhatsAppTo(to: string, message: string): Promise<void> {
  const phoneId = process.env.WHATSAPP_PHONE_ID || WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN || WHATSAPP_TOKEN;
  const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
  const phone = toE164Brazil(to);

  if (!phone) {
    console.error("[notify] ❌ Número inválido ou vazio:", to);
    return;
  }
  if (!phoneId || !token) {
    console.error("[notify] ❌ WHATSAPP_PHONE_ID ou WHATSAPP_TOKEN ausentes");
    return;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: message },
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Meta API ${res.status}: ${body}`);
  }
  console.log(`[notify] ✅ WhatsApp enviado para ${phone}`);
}

/** Notifica a equipe (Rita e Eric) via WhatsApp */
export async function notifyTeam(message: string): Promise<void> {
  await sendWhatsAppTo(WHATSAPP_TO, message);
}

/** Notifica o cliente via WhatsApp (enviado pelo número da Jolie) */
export async function notifyCliente(phone: string, message: string): Promise<void> {
  await sendWhatsAppTo(phone, message);
}
