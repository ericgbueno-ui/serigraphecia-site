import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AFF_COOKIE = "mt_aff_session";

const API_RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const API_RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 120);

// Limite máximo de entradas para evitar memory leak em instâncias de longa duração
const RATE_LIMIT_MAX_ENTRIES = 5_000;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function evictExpiredRateLimitEntries() {
  if (rateLimitStore.size < RATE_LIMIT_MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
    if (rateLimitStore.size < RATE_LIMIT_MAX_ENTRIES * 0.8) break;
  }
}

function getSecretString() {
  return (
    process.env.AFF_JWT_SECRET ??
    process.env.ADM_SECRET ??
    process.env.ADM_AUTH_SECRET ??
    ""
  ).trim();
}

function getAllowedOrigins() {
  const configured = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaults = [process.env.NEXT_PUBLIC_SITE_URL, process.env.APP_ORIGIN]
    .map((origin) => (origin || "").trim())
    .filter(Boolean);

  const dev = ["http://localhost:3000", "http://127.0.0.1:3000"];

  return new Set([
    ...configured,
    ...defaults,
    ...(process.env.NODE_ENV !== "production" ? dev : []),
  ]);
}

function base64UrlToUint8Array(base64Url: string) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function verifyAffToken(token: string): Promise<boolean> {
  try {
    const secret = getSecretString();

    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [header, body, sig] = parts;

    const encoder = new TextEncoder();
    const data = encoder.encode(`${header}.${body}`);
    const signature = base64UrlToUint8Array(sig);

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(getSecretString()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const isValid = await crypto.subtle.verify("HMAC", key, signature, data);

    if (!isValid) return false;

    const payloadStr = new TextDecoder().decode(base64UrlToUint8Array(body));
    const payload = JSON.parse(payloadStr) as { exp?: number };

    return typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function hexToUint8Array(hex: string) {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function timingSafeBytesEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function verifyAdminToken(token: string, secret: string): Promise<boolean> {
  try {
    const tokenBytes = hexToUint8Array(token);
    if (!tokenBytes) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode("mt_admin_v1"));
    return timingSafeBytesEqual(tokenBytes, new Uint8Array(signature));
  } catch {
    return false;
  }
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
}

function applyCorsHeaders(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get("origin") || "";
  if (!origin) return;

  const allowedOrigins = getAllowedOrigins();

  if (allowedOrigins.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }
}

function getClientIdentifier(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (!path.startsWith("/api/")) return false;
  if (path === "/api/health" || path === "/api/ping") return false;

  const clientId = getClientIdentifier(request);
  const key = `${clientId}:${path}`;
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetAt) {
    evictExpiredRateLimitEntries();
    rateLimitStore.set(key, { count: 1, resetAt: now + API_RATE_LIMIT_WINDOW_MS });
    return false;
  }

  existing.count += 1;
  return existing.count > API_RATE_LIMIT_MAX_REQUESTS;
}

export async function middleware(request: NextRequest) {
  const isApiRequest = request.nextUrl.pathname.startsWith("/api/");

  if (isApiRequest && request.method === "OPTIONS") {
    const preflight = new NextResponse(null, { status: 204 });
    applySecurityHeaders(preflight);
    applyCorsHeaders(request, preflight);
    return preflight;
  }

  if (isRateLimited(request)) {
    const response = NextResponse.json({ error: "Too many requests" }, { status: 429 });
    applySecurityHeaders(response);
    applyCorsHeaders(request, response);
    return response;
  }

  if (request.nextUrl.pathname.startsWith("/afiliado/painel")) {
    const token = request.cookies.get(AFF_COOKIE)?.value ?? "";
    const isValid = await verifyAffToken(token);
    if (!isValid) {
      const redirectResponse = NextResponse.redirect(new URL("/afiliado/entrar", request.url));
      applySecurityHeaders(redirectResponse);
      return redirectResponse;
    }
  }

  // Protege todas as rotas /admin/** e /api/admin/** exceto a própria página de login
  if (
    request.nextUrl.pathname.startsWith("/admin/") ||
    request.nextUrl.pathname.startsWith("/api/admin/") ||
    (request.nextUrl.pathname === "/admin" && request.nextUrl.search.includes("error"))
  ) {
    const adminSecret = process.env.ADMIN_PASSWORD;
    const adminToken = request.cookies.get("mt_admin_token")?.value ?? "";
    const isAdmin = !!adminSecret && !!adminToken && (await verifyAdminToken(adminToken, adminSecret));
    if (!isAdmin) {
      const redirectResponse = NextResponse.redirect(new URL("/admin", request.url));
      applySecurityHeaders(redirectResponse);
      return redirectResponse;
    }
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);
  if (isApiRequest) {
    applyCorsHeaders(request, response);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
