import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

/** Verifica se a request atual tem sessão admin válida. */
export async function getIsAdmin(): Promise<boolean> {
  const jar = await cookies();
  const adminSecret = process.env.ADMIN_PASSWORD;
  if (!adminSecret) return false;
  return verifyAdminToken(jar.get(COOKIE_NAME)?.value ?? "", adminSecret);
}

export async function requireAdmin(): Promise<void> {
  if (!(await getIsAdmin())) redirect("/admin");
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
export const ADMIN_COOKIE_TTL = COOKIE_TTL;
