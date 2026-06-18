import crypto from "crypto";

function getSecret() {
  return process.env.ADMIN_PASSWORD ?? "mt_unsub_secret";
}

/** Gera token HMAC para o e-mail — impede cancelamentos forjados */
export function signUnsubscribe(email: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(email.toLowerCase())
    .digest("hex");
}

/** Valida o token */
export function verifyUnsubscribe(email: string, token: string): boolean {
  const expected = signUnsubscribe(email.toLowerCase());
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

/** Gera URL completa de cancelamento */
export function unsubscribeUrl(email: string): string {
  const base = (process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL || "https://multitrip.com.br").replace(/^\uFEFF/, '').trim();
  const e = Buffer.from(email.toLowerCase()).toString("base64url");
  const t = signUnsubscribe(email);
  return `${base}/api/unsubscribe?e=${e}&t=${t}`;
}
