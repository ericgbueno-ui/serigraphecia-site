import crypto from "crypto";
import jwt from "jsonwebtoken";

// Renomeado de "mt_admin_token" para "admin_session" em 2026-07-01 — o nome
// antigo era um resquício copiado de outro projeto (Multi Trip). Trocar o
// nome do cookie desloga sessões ativas (todos precisam logar de novo), mas
// não afeta nenhum dado.
const COOKIE_NAME = "admin_session";
const COOKIE_TTL = 60 * 60 * 8; // 8h

function sessionSecret(): string {
  // Preferir uma chave dedicada; se não configurada, cair para ADMIN_PASSWORD
  // para não quebrar ambientes existentes que ainda não definiram SESSION_SECRET.
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function deriveLegacyToken(secret: string): string {
  return crypto.createHmac("sha256", secret).update("mt_admin_v1").digest("hex");
}

/** Token legado: senha única compartilhada (mantido por compatibilidade). */
export function createAdminToken(secret: string): string {
  return deriveLegacyToken(secret);
}

export function verifyAdminToken(cookieValue: string, secret: string): boolean {
  if (!cookieValue || !secret) return false;
  const expected = deriveLegacyToken(secret);
  try {
    const a = Buffer.from(cookieValue, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export interface AdminSessionPayload {
  sub: string; // userId
  email: string;
  name: string;
  role: string;
}

/** Token novo: sessão por usuário individual (login com e-mail + senha). */
export function createUserToken(payload: AdminSessionPayload): string {
  const secret = sessionSecret();
  return jwt.sign(payload, secret, { expiresIn: COOKIE_TTL });
}

export function verifyUserToken(cookieValue: string): AdminSessionPayload | null {
  const secret = sessionSecret();
  if (!cookieValue || !secret) return null;
  try {
    const decoded = jwt.verify(cookieValue, secret) as AdminSessionPayload;
    if (!decoded?.sub) return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Continua funcionando exatamente como antes para qualquer código existente:
 * true se a sessão (legada OU de usuário) é válida.
 */
export function getIsAdmin(cookieValue: string): boolean {
  const adminSecret = process.env.ADMIN_PASSWORD;
  if (adminSecret && verifyAdminToken(cookieValue, adminSecret)) return true;
  return !!verifyUserToken(cookieValue);
}

/**
 * Novo: retorna o usuário autenticado (para auditoria/HistoricoAlteracao).
 * Retorna null em sessões legadas (senha compartilhada, sem usuário associado)
 * ou quando não autenticado.
 */
export function getCurrentUser(cookieValue: string): AdminSessionPayload | null {
  return verifyUserToken(cookieValue);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
export const ADMIN_COOKIE_TTL = COOKIE_TTL;
