/**
 * Meta Instagram Messaging API — sender compartilhado
 * Usado pela rota /api/instagram para responder DMs.
 *
 * Pré-requisitos no Meta for Developers:
 * - Permissão: instagram_manage_messages
 * - Conta Instagram Business vinculada à Página do Facebook
 * - Webhook subscrito no objeto "instagram"
 */

const IG_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN ?? "";
const IG_PAGE_ID = process.env.INSTAGRAM_PAGE_ID ?? "";

/**
 * Envia uma mensagem de texto para um usuário do Instagram via IGSID.
 * @param igsid  Instagram-Scoped User ID (sender.id do webhook)
 * @param text   Texto da mensagem (máx. 1000 caracteres)
 */
export async function sendInstagram(igsid: string, text: string): Promise<void> {
  if (!IG_ACCESS_TOKEN || !IG_PAGE_ID) {
    throw new Error("INSTAGRAM_ACCESS_TOKEN ou INSTAGRAM_PAGE_ID não configurados.");
  }

  // Instagram limita mensagens a 1000 caracteres
  const truncated = text.length > 1000 ? text.slice(0, 997) + "…" : text;

  const url = `https://graph.facebook.com/v21.0/${IG_PAGE_ID}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${IG_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      recipient: { id: igsid },
      message: { text: truncated },
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok) {
    const body = await res.text();
    let errMsg = `Instagram API ${res.status}`;
    try {
      const json = JSON.parse(body);
      errMsg = json?.error?.message ?? errMsg;
    } catch {}
    console.error(`[Meta IG] Erro para ${igsid}: ${errMsg}`);
    throw new Error(errMsg);
  }
}
