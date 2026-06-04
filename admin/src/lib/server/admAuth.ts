import "server-only";
import crypto from "crypto";

export const runtime = "nodejs";

const COOKIE_NAME = "mt_aff_sess";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 dias

export type AffiliateSession = {
  username: string;
  code: string;
  iat: number;
  exp: number;
};

function b64urlEncode(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecode(str: string) {
  const pad = "=".repeat((4 - (str.length % 4)) % 4);
  const s = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(s, "base64");
}

function getSecret() {
  const s = process.env.ADM_AUTH_SECRET;
  if (!s) {
    throw new Error("ADM_AUTH_SECRET não configurado. Defina essa env na Vercel (.env).");
  }
  return s;
}

function sign(data: string) {
  const secret = getSecret();
  const h = crypto.createHmac("sha256", secret).update(data).digest();
  return b64urlEncode(h);
}

export function createSessionToken(
  input: { username: string; code: string },
  ttlSeconds = SESSION_TTL_SECONDS
) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSeconds;
  const payload: AffiliateSession = { username: input.username, code: input.code, iat, exp };
  const body = b64urlEncode(Buffer.from(JSON.stringify(payload), "utf-8"));
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string): AffiliateSession | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  try {
    const expected = sign(body);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;

    const json = b64urlDecode(body).toString("utf-8");
    const payload = JSON.parse(json) as AffiliateSession;
    if (!payload?.username || !payload?.code || !payload?.exp) return null;

    const now = Math.floor(Date.now() / 1000);
    if (now >= payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

export const AdmCookie = {
  name: COOKIE_NAME,
  ttlSeconds: SESSION_TTL_SECONDS,
  cookieOptions: (isProd: boolean) => ({
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProd,
    path: "/",
  }),
};
