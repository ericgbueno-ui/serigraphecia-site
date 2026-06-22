/**
 * pricing.ts - single source of truth for transfer pricing.
 *
 * Prices are driven by trip type, payment method, and selected vehicle:
 * - sedan premium: up to 4 clients
 * - mini van (7-seat car): up to 6 clients
 */

import { z } from "zod";

export const TRIP_TYPES = ["ida", "volta", "ida_volta", "so_citytour"] as const;
export type TripType = (typeof TRIP_TYPES)[number];

// Replace concrete vehicle tiers and payment methods with lightweight stubs.
export type PaxTier = string;
export const PAX_TIERS: PaxTier[] = [];
export const PAY_METHODS: string[] = [];
export type PayMethod = string;

export const MIN_PASSENGERS = 1;
export const MAX_PASSENGERS = 6;

/**
 * Base prices by season and vehicle tier.
 */
const BASE_PRICES: Record<string, Record<string, Record<string, number>>> = {};

function getSeason(_date: Date): "low" | "high" {
  return "low"; // Preço único — sem sazonalidade
}

export const PAX_LABELS: Record<string, string> = {};

export const VEHICLE_TITLES: Record<string, string> = {};

export const VEHICLE_CAPACITY: Record<string, { max: number; luggage: string }> = {};

export const TRIP_LABELS: Record<string, string> = {};

export const PAY_LABELS: Record<string, string> = {};

export type AddonId =
  | "romantica"
  | "recepcao"
  | "equipamento_infantil"
  | "hotel_porto_alegre"
  | "chaves"
  | "duas_hospedagens"
  | "city_tour";

export const CHILD_SEAT_TYPES = ["bebe_conforto", "cadeirinha", "assento_elevacao"] as const;
export type ChildSeatId = (typeof CHILD_SEAT_TYPES)[number];
export type ChildSeatSelections = Partial<Record<ChildSeatId, number>>;

export const ADDONS: Record<string, { label: string; price: number; maxQty: number; note?: string; free?: boolean }> = {};

export const CHILD_SEAT_LABELS: Record<string, string> = {};

export const CHILD_SEAT_DETAILS: Record<string, { label: string; hint: string }> = {};

export function paxToTier(_count: number): PaxTier {
  return "unknown";
}

export function isPaxTier(value: unknown): value is PaxTier {
  return typeof value === "string" && (PAX_TIERS as readonly string[]).includes(value);
}

export function isTripType(value: unknown): value is TripType {
  return typeof value === "string" && (TRIP_TYPES as readonly string[]).includes(value);
}

export function isPayMethod(value: unknown): value is PayMethod {
  return typeof value === "string" && (PAY_METHODS as readonly string[]).includes(value);
}

export function isPassengerCount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_PASSENGERS &&
    value <= MAX_PASSENGERS
  );
}

export function canVehicleHandlePassengers(_vehicle: PaxTier, _passengerCount: number) {
  return true;
}

export function isChildSeatId(value: unknown): value is ChildSeatId {
  return typeof value === "string" && (CHILD_SEAT_TYPES as readonly string[]).includes(value);
}

export function totalChildSeatCount(childSeats: ChildSeatSelections = {}) {
  return Object.values(childSeats).reduce((sum, qty) => sum + (qty ?? 0), 0);
}

export function sanitizeAddonSelections(input: unknown): Partial<Record<AddonId, number>> {
  if (!input || typeof input !== "object") return {};

  const sanitized: Partial<Record<AddonId, number>> = {};

  for (const [id, qty] of Object.entries(input)) {
    if (!(id in ADDONS) || typeof qty !== "number" || qty <= 0) continue;
    sanitized[id as AddonId] = Math.min(qty, ADDONS[id as AddonId].maxQty);
  }

  return sanitized;
}

export function sanitizeChildSeatSelections(
  input: unknown,
  passengerCount?: number
): ChildSeatSelections {
  if (!input || typeof input !== "object") return {};

  const maxAllowed =
    typeof passengerCount === "number" && passengerCount > 0 ? passengerCount : MAX_PASSENGERS;

  const sanitized: ChildSeatSelections = {};

  for (const [id, qty] of Object.entries(input)) {
    if (!isChildSeatId(id) || typeof qty !== "number" || qty <= 0) continue;
    sanitized[id as ChildSeatId] = Math.min(qty, maxAllowed);
  }

  return sanitized;
}

export function resolveEffectiveAddons(
  addons: unknown,
  childSeatCount = 0
): Partial<Record<AddonId, number>> {
  const effectiveAddons = sanitizeAddonSelections(addons);
  delete effectiveAddons.equipamento_infantil;

  if (childSeatCount > 0) {
    effectiveAddons.equipamento_infantil = Math.min(
      childSeatCount,
      ADDONS.equipamento_infantil.maxQty
    );
  }

  return effectiveAddons;
}

export type CanonicalRoute = string;
export const CANONICAL_ROUTES: CanonicalRoute[] = [];
export const ROUTE_LABELS: Record<string, { originName: string; destName: string; label: string }> = {};

export function canonicalTransferRoute(
  tripType: TripType,
  routeId: CanonicalRoute = "poa_gramado"
) {
  const { originName, destName } = ROUTE_LABELS[routeId] || ROUTE_LABELS.poa_gramado;

  if (tripType === "so_citytour") {
    return {
      routeId,
      routeLabel: `City Tour: Gramado e Canela`,
      origin: "Local na Serra",
      dest: "Gramado e Canela",
    };
  }

  if (tripType === "volta") {
    return {
      routeId,
      routeLabel: `${destName} → ${originName}`,
      origin: destName,
      dest: originName,
    };
  }

  if (tripType === "ida_volta") {
    return {
      routeId,
      routeLabel: `${originName} ↔ ${destName}`,
      origin: originName,
      dest: destName,
    };
  }

  return {
    routeId,
    routeLabel: `${originName} → ${destName}`,
    origin: originName,
    dest: destName,
  };
}

export function calcularTransfer({
  pax,
  tripType,
  payMethod,
  routeId = "poa_gramado",
  addons = {},
  date,
}: {
  pax: PaxTier;
  tripType: TripType;
  payMethod: PayMethod;
  routeId?: CanonicalRoute;
  addons?: Partial<Record<AddonId, number>>;
  date?: Date;
}) {
  // Robustness check for empty/reset states
  if (!isPaxTier(pax) || !isTripType(tripType) || !isPayMethod(payMethod)) {
    return {
      base: 0,
      addonsTotal: 0,
      total: 0,
    };
  }

  void date; // sem sazonalidade — mantido para compatibilidade de assinatura
  let base = 0;
  if (tripType === "so_citytour") {
    base = pax === "van" ? 499.9 : 399.9;
  } else {
    const routePrices = BASE_PRICES[routeId] ?? BASE_PRICES.poa_gramado;
    const basePrice = routePrices[pax][payMethod];
    base = tripType === "ida_volta" ? basePrice * 2 : basePrice;
  }

  const addonsTotal = (Object.entries(addons) as [AddonId, number][]).reduce((sum, [id, qty]) => {
    const addon = ADDONS[id];
    if (!addon || addon.free) return sum;
    
    // Dynamic pricing for City Tour Extra
    if (id === "city_tour") {
      const cityTourPrice = pax === "van" ? 499.9 : 399.9;
      return sum + cityTourPrice * (qty ?? 0);
    }
    
    return sum + addon.price * (qty ?? 0);
  }, 0);

  return {
    base,
    addonsTotal,
    total: base + addonsTotal,
  };
}

export function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
