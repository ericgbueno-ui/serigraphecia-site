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

export type PaxTier = "sedan" | "van" | "executivo" | "suv" | "suv_eletrico";
export const PAX_TIERS = ["sedan", "van", "executivo", "suv", "suv_eletrico"] as const;
export const PAY_METHODS = ["pix", "cartao"] as const;
export type PayMethod = (typeof PAY_METHODS)[number];

export const MIN_PASSENGERS = 1;
export const MAX_PASSENGERS = 6;

/**
 * Base prices by season and vehicle tier.
 */
// Tabelas oficiais de preço por trecho (ida ou volta)
const BASE_PRICES: Record<CanonicalRoute, Record<PaxTier, Record<PayMethod, number>>> = {
  poa_gramado: {
    sedan: { pix: 249.9, cartao: 299.94 },
    van: { pix: 449.9, cartao: 502.63 },
    executivo: { pix: 349.9, cartao: 390.63 },
    suv: { pix: 349.9, cartao: 390.63 },
    suv_eletrico: { pix: 349.9, cartao: 390.63 },
  },
  caxias_gramado: {
    sedan: { pix: 299.9, cartao: 349.94 },
    van: { pix: 499.9, cartao: 552.63 },
    executivo: { pix: 399.9, cartao: 440.63 },
    suv: { pix: 399.9, cartao: 440.63 },
    suv_eletrico: { pix: 399.9, cartao: 440.63 },
  },
};

function getSeason(_date: Date): "low" | "high" {
  return "low"; // Preço único — sem sazonalidade
}

export const PAX_LABELS: Record<PaxTier, string> = {
  sedan: "Sedan Premium - até 4 pessoas",
  van: "Spin - até 6 pessoas",
  executivo: "Executivo - até 4 pessoas",
  suv_eletrico: "SUV Elétrico - até 4 pessoas",
  suv: "SUV - até 4 pessoas",
};

export const VEHICLE_TITLES: Record<PaxTier, string> = {
  sedan: "Sedan Premium (até 4 clientes)",
  van: "Spin (até 6 clientes)",
  executivo: "Executivo (até 4 clientes)",
  suv_eletrico: "SUV Elétrico (até 4 clientes)",
  suv: "SUV (até 4 clientes)",
};

export const VEHICLE_CAPACITY: Record<PaxTier, { max: number; luggage: string }> = {
  sedan: { max: 4, luggage: "2x23kg + 2x10kg" },
  van: { max: 6, luggage: "6x23kg + 6x10kg" },
  suv: { max: 4, luggage: "3x23kg + 3x10kg" },
  suv_eletrico: { max: 4, luggage: "2x23kg + 3x10kg" },
  executivo: { max: 4, luggage: "2x23kg + 2x10kg" },
};

export const TRIP_LABELS: Record<TripType, string> = {
  ida: "Somente Chegada In",
  volta: "Somente Retorno Out",
  ida_volta: "Chegada In + Retorno Out",
  so_citytour: "Só City Tour Privativo",
};

export const PAY_LABELS: Record<PayMethod, string> = {
  cartao: "Cartao (ate 4x sem juros)",
  pix: "Pix",
};

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

export const ADDONS: Record<
  AddonId,
  { label: string; price: number; maxQty: number; note?: string; free?: boolean }
> = {
  romantica: { label: "Rota Romantica", price: 190.9, maxQty: 1 },
  recepcao: { label: "Recepcao no aeroporto (placa com nome)", price: 35, maxQty: 1 },
  equipamento_infantil: {
    label: "Uso de equipamento de seguranca infantil",
    price: 25,
    maxQty: 6,
    note: "Valor por dispositivo solicitado para o transfer.",
    free: true,
  },
  hotel_porto_alegre: {
    label: "Saida ou retorno a hotel em Porto Alegre",
    price: 50,
    maxQty: 1,
  },
  chaves: { label: "Retirada/entrega de chaves (imobiliaria)", price: 20, maxQty: 1 },
  duas_hospedagens: { label: "Duas hospedagens (2 enderecos)", price: 20, maxQty: 1 },
  city_tour: { 
    label: "City Tour Privativo (Gramado e Canela)", 
    price: 399.9, 
    maxQty: 1, 
    note: "Um dia inteiro dedicado a você. Data agendada via WhatsApp." 
  },
};

export const CHILD_SEAT_LABELS: Record<ChildSeatId, string> = {
  bebe_conforto: "Bebe conforto",
  cadeirinha: "Cadeirinha",
  assento_elevacao: "Assento de elevacao",
};

export const CHILD_SEAT_DETAILS: Record<ChildSeatId, { label: string; hint: string }> = {
  bebe_conforto: {
    label: "Bebe conforto",
    hint: "Para bebes que precisam viajar com o equipamento apropriado.",
  },
  cadeirinha: {
    label: "Cadeirinha",
    hint: "Para criancas pequenas que precisam de retencao infantil adequada.",
  },
  assento_elevacao: {
    label: "Assento de elevacao",
    hint: "Para criancas que ja usam elevacao no banco traseiro.",
  },
};

export function paxToTier(count: number): PaxTier {
  return count <= 4 ? "sedan" : "van";
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

export function canVehicleHandlePassengers(vehicle: PaxTier, passengerCount: number) {
  const capacity = VEHICLE_CAPACITY[vehicle];
  if (!capacity) return false;
  return passengerCount > 0 && passengerCount <= capacity.max;
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

export type CanonicalRoute = "poa_gramado" | "caxias_gramado";
export const CANONICAL_ROUTES: CanonicalRoute[] = ["poa_gramado", "caxias_gramado"];

export const ROUTE_LABELS: Record<
  CanonicalRoute,
  { originName: string; destName: string; label: string }
> = {
  poa_gramado: {
    originName: "Aeroporto Porto Alegre (POA)",
    destName: "Gramado / Canela",
    label: "Aeroporto POA ↔ Gramado/Canela",
  },
  caxias_gramado: {
    originName: "Aeroporto de Caxias do Sul",
    destName: "Gramado / Canela",
    label: "Aeroporto Caxias ↔ Gramado/Canela",
  },
};

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
