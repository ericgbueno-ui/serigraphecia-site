// ─── CVC B2B API — Aéreo + Hotéis ────────────────────────────────────────────
//
// Autenticação: POST /api/v1/token com clientId + clientSecret + user/pass.
// accessToken expira em ~1h; refreshToken em ~24h.
// O cache de token vive no módulo (por instância serverless).

const CVC_BASE = (
  process.env.CVC_B2B_API_URL || "https://conectaas.cvccorp.com.br/ic/sandbox/b2b"
).replace(/\/$/, "");

// ─── Token cache ──────────────────────────────────────────────────────────────

type TokenCache = {
  accessToken: string;
  accessExpiresAt: number;   // ms timestamp
  refreshToken: string;
  refreshExpiresAt: number;  // ms timestamp
};

let _cache: TokenCache | null = null;

async function _fetchToken(useRefresh = false): Promise<string> {
  const body: Record<string, string> = {
    clientId: process.env.CVC_CLIENT_ID ?? "",
    clientSecret: process.env.CVC_CLIENT_SECRET ?? "",
  };

  if (useRefresh && _cache?.refreshToken) {
    body.refreshToken = _cache.refreshToken;
  } else {
    body.username = process.env.CVC_B2B_USERNAME ?? "";
    body.password = process.env.CVC_B2B_PASSWORD ?? "";
  }

  const res = await fetch(`${CVC_BASE}/api/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`CVC auth falhou (${res.status}): ${text}`);
  }

  const data = await res.json();
  const now = Date.now();
  const ONE_MIN = 60_000;
  // expiresIn / refreshExpiresIn vêm em minutos conforme a doc
  const accessMs = (Number(data.expiresIn ?? 60)) * 60_000 - ONE_MIN;
  const refreshMs = (Number(data.refreshExpiresIn ?? 1440)) * 60_000 - ONE_MIN;

  _cache = {
    accessToken: data.accessToken,
    accessExpiresAt: now + accessMs,
    refreshToken: data.refreshToken ?? "",
    refreshExpiresAt: now + refreshMs,
  };

  return _cache.accessToken;
}

async function _getToken(): Promise<string> {
  const now = Date.now();
  if (_cache && _cache.accessExpiresAt > now) return _cache.accessToken;
  if (_cache?.refreshToken && _cache.refreshExpiresAt > now) return _fetchToken(true);
  return _fetchToken(false);
}

function _headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type CvcSearchParams = {
  routes: string; // "POA,GRU,2025-12-01+GRU,POA,2025-12-10"
  pax: number;
  maxResults?: number;
  businessClass?: "ONLY" | "ALSO" | "NO";
  maxNumberOfStops?: number;
  domain?: "AGENCIA" | "CORPORATIVO";
};

export async function cvcSearchFlights(params: CvcSearchParams) {
  const token = await _getToken();
  const q = new URLSearchParams({
    routes: params.routes,
    pax: String(params.pax),
    maxResults: String(params.maxResults ?? 10),
    businessClass: params.businessClass ?? "ALSO",
    maxNumberOfStops: String(params.maxNumberOfStops ?? 2),
    domain: params.domain ?? "AGENCIA",
  });
  const res = await fetch(`${CVC_BASE}/api/v1/air/flights?${q}`, {
    headers: _headers(token),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function cvcPriceFlights(productTokens: string[]) {
  const token = await _getToken();
  const res = await fetch(`${CVC_BASE}/api/v1/air/flights/price`, {
    method: "POST",
    headers: _headers(token),
    body: JSON.stringify({ productTokens }),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function cvcGetAirports() {
  const token = await _getToken();
  const res = await fetch(`${CVC_BASE}/api/v1/locations/airports`, {
    headers: _headers(token),
    next: { revalidate: 86400 },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function cvcCreateBooking(payload: unknown) {
  const token = await _getToken();
  const res = await fetch(`${CVC_BASE}/api/v1/air/bookings`, {
    method: "POST",
    headers: _headers(token),
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function cvcCommitBooking(bookingId: string, payment: unknown) {
  const token = await _getToken();
  const res = await fetch(`${CVC_BASE}/api/v1/air/bookings/${bookingId}/commit`, {
    method: "POST",
    headers: _headers(token),
    body: JSON.stringify({ payment }),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function cvcGetBooking(bookingId: string) {
  const token = await _getToken();
  const res = await fetch(`${CVC_BASE}/api/v1/air/bookings/${bookingId}`, {
    headers: _headers(token),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function cvcCancelBooking(bookingId: string, reasonForCancellation: string) {
  const token = await _getToken();
  const res = await fetch(`${CVC_BASE}/api/v1/air/bookings/${bookingId}`, {
    method: "DELETE",
    headers: _headers(token),
    body: JSON.stringify({ reasonForCancellation }),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

// ─── Hotels ───────────────────────────────────────────────────────────────────

export async function cvcGetLocations() {
  const token = await _getToken();
  const res = await fetch(`${CVC_BASE}/api/v1/locations`, {
    headers: _headers(token),
    next: { revalidate: 86400 },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function cvcGetHotelPortfolio() {
  const token = await _getToken();
  const res = await fetch(`${CVC_BASE}/api/v1/hotel/hotelPortfolio`, {
    headers: _headers(token),
    next: { revalidate: 86400 },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function cvcSearchHotels(payload: unknown) {
  const token = await _getToken();
  const res = await fetch(`${CVC_BASE}/api/v1/hotel/search`, {
    method: "POST",
    headers: _headers(token),
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function cvcPriceHotel(payload: unknown) {
  const token = await _getToken();
  const res = await fetch(`${CVC_BASE}/api/v1/hotel/price`, {
    method: "POST",
    headers: _headers(token),
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function cvcHotelDetail(payload: unknown) {
  const token = await _getToken();
  const res = await fetch(`${CVC_BASE}/api/v1/hotel/detail`, {
    method: "POST",
    headers: _headers(token),
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function cvcHotelSearchBookingRules(payload: unknown) {
  const token = await _getToken();
  const res = await fetch(`${CVC_BASE}/api/v1/hotel/searchBookingRules`, {
    method: "POST",
    headers: _headers(token),
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

// BookingCommit = emissão imediata (booking + commit em uma chamada)
export async function cvcHotelBookingCommit(payload: unknown) {
  const token = await _getToken();
  const res = await fetch(`${CVC_BASE}/api/v1/hotel/booking/bookingCommit`, {
    method: "POST",
    headers: _headers(token),
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

// Commit = apenas pagamento de uma reserva já criada
export async function cvcCommitHotelBooking(groupNumber: string, payload: unknown) {
  const token = await _getToken();
  const res = await fetch(`${CVC_BASE}/api/v1/hotel/booking/${groupNumber}/commit`, {
    method: "POST",
    headers: _headers(token),
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

// BookingSearch = pesquisa reservas (sem ID no path — filtros no body/query)
export async function cvcGetHotelBooking(params?: Record<string, string>) {
  const token = await _getToken();
  const q = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await fetch(`${CVC_BASE}/api/v1/hotel/booking/bookingSearch${q}`, {
    headers: _headers(token),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function cvcCancelHotelBooking(groupNumber: string) {
  const token = await _getToken();
  const res = await fetch(`${CVC_BASE}/api/v1/hotel/booking/${groupNumber}/cancellation`, {
    method: "DELETE",
    headers: _headers(token),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function cvcGetPaymentModes(payload?: unknown) {
  const token = await _getToken();
  const res = await fetch(`${CVC_BASE}/api/v1/paymentModes`, {
    method: "POST",
    headers: _headers(token),
    body: payload ? JSON.stringify(payload) : undefined,
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}
