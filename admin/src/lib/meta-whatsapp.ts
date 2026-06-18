/**
 * Meta WhatsApp Business API — sender compartilhado
 * Usado tanto pela rota /api/whatsapp como pelas Server Actions do admin.
 */

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN ?? "";
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID ?? "";

/**
 * Envia uma mensagem de texto simples via Meta WhatsApp Business API.
 * @param to  Número E.164 sem "+" (ex: "5551999999999")
 * @param text Texto da mensagem
 */
export async function sendWhatsApp(to: string, text: string): Promise<void> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    throw new Error("WHATSAPP_TOKEN ou WHATSAPP_PHONE_ID não configurados.");
  }

  const url = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok) {
    const body = await res.text();
    let errMsg = `Meta API ${res.status}`;
    let code: number | null = null;
    let subcode: number | null = null;
    try {
      const json = JSON.parse(body);
      errMsg = json?.error?.message ?? errMsg;
      code = json?.error?.code ?? null;
      subcode = json?.error?.error_subcode ?? null;
    } catch {}
    const codeStr = code !== null ? `#${code}${subcode !== null ? `.${subcode}` : ""}` : "";
    let hint = "";
    if (code === 100) hint = " — Verifique WHATSAPP_PHONE_ID (pode estar errado para esta conta)";
    if (code === 190) hint = " — Token expirado, regenere em Meta for Developers";
    console.error(`[Meta WA] Erro ${codeStr}: ${errMsg}${hint} | para: ${to}`);
    throw new Error(`${codeStr} ${errMsg}`.trim());
  }
}

/**
 * Envia uma mensagem usando um template aprovado pela Meta.
 * @param to           Número E.164 sem "+"
 * @param templateName Nome do template aprovado
 * @param langCode     Código de idioma (padrão: "pt_BR")
 * @param components   Componentes do template (parâmetros de body, header, etc.)
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  langCode = "pt_BR",
  components?: object[]
): Promise<void> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    throw new Error("WHATSAPP_TOKEN ou WHATSAPP_PHONE_ID não configurados.");
  }

  const url = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: langCode },
        ...(components ? { components } : {}),
      },
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok) {
    const body = await res.text();
    let errMsg = `Meta API ${res.status}`;
    let code: number | null = null;
    let subcode: number | null = null;
    try {
      const json = JSON.parse(body);
      errMsg = json?.error?.message ?? errMsg;
      code = json?.error?.code ?? null;
      subcode = json?.error?.error_subcode ?? null;
    } catch {}
    const codeStr = code !== null ? `#${code}${subcode !== null ? `.${subcode}` : ""}` : "";
    let hint = "";
    if (code === 100) hint = " — Verifique WHATSAPP_PHONE_ID (pode estar errado para esta conta)";
    if (code === 190) hint = " — Token expirado, regenere em Meta for Developers";
    console.error(`[Meta WA Template] Erro ${codeStr}: ${errMsg}${hint} | para: ${to} (${templateName})`);
    throw new Error(`${codeStr} ${errMsg}`.trim());
  }
}
