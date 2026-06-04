import crypto from "crypto";

const COOKIE_NAME = "mt_admin_token";
const COOKIE_TTL = 60 * 60 * 8; // 8h

function deriveToken(secret: string): string {
  return crypto.createHmac("sha256", secret).update("mt_admin_v1").digest("hex");
}

export function createAdminToken(secret: string): string {
  return deriveToken(secret);
}

export function verifyAdminToken(cookieValue: string, secret: string): boolean {
  if (!cookieValue || !secret) return false;
  const expected = deriveToken(secret);
  try {
    const a = Buffer.from(cookieValue, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function getIsAdmin(cookieValue: string): boolean {
  const adminSecret = process.env.ADMIN_PASSWORD;
  if (!adminSecret) return false;
  return verifyAdminToken(cookieValue, adminSecret);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
export const ADMIN_COOKIE_TTL = COOKIE_TTL;
