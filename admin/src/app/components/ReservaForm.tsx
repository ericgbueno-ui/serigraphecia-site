"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

import {
  calcularTransfer,
  brl,
  VEHICLE_CAPACITY,
  type CanonicalRoute,
  type PaxTier,
  type TripType,
} from "@/lib/pricing";
import { waLink, SITE } from "@/lib/site";
import { trackReserveClick, trackWhatsAppClick, trackInitiateCheckout } from "@/lib/tracking";

interface VehicleOption {
  id: PaxTier;
  label: string;
  icon: string;
  flow: "direct" | "whatsapp";
  image: string;
  badge?: string;
  featured?: boolean;
}

const VEHICLES: VehicleOption[] = [
  {
    id: "sedan",
    label: "Sedan Premium",
    icon: "🚗",
    flow: "direct",
    image: "/photos/veiculos/sedan.webp",
    badge: "Mais escolhido",
    featured: true,
  },
  {
    id: "van",
    label: "Spin 6 Lugares",
    icon: "🚐",
    flow: "direct",
    image: "/photos/veiculos/spin.webp",
    badge: "Mais espaço",
  },
  {
    id: "executivo",
    label: "Sedan Executivo",
    icon: "🚘",
    flow: "whatsapp",
    image: "/photos/veiculos/corolla.webp",
  },
  {
    id: "suv",
    label: "SUV",
    icon: "🚙",
    flow: "whatsapp",
    image: "/photos/veiculos/suv.webp",
  },
  {
    id: "suv_eletrico",
    label: "SUV Elétrico ⚡",
    icon: "⚡",
    flow: "whatsapp",
    image: "/photos/veiculos/byd.webp",
  },
];

const ROUTE_ID: CanonicalRoute = "poa_gramado";

// Número direto da Rita e Eric — para categorias executivas (consulta humana direta)
const WHATS_ERIC_RITA = "5551986876557";

const ROUTE_LABELS: Record<string, string> = {
  poa_gramado: "Porto Alegre → Gramado / Canela",
  caxias_gramado: "Caxias do Sul → Gramado / Canela",
};

function localDateValue(date: Date) {
  const off = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - off).toISOString().slice(0, 10);
}

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function buildWhatsMsg(opts: { vehicleLabel: string; routeLabel: string }) {
  return (
    `Olá! 👋\n\n` +
    `Estou na página da rota *${opts.routeLabel}* e gostaria de consultar disponibilidade e valores para a categoria *${opts.vehicleLabel}*.\n\n` +
    `Podem me ajudar?`
  );
}

export function ReservaForm({ routeId = ROUTE_ID }: { routeId?: string }) {
  const router = useRouter();
  const activeRouteId = routeId as CanonicalRoute;
  const routeLabel = ROUTE_LABELS[activeRouteId] ?? ROUTE_LABELS[ROUTE_ID];

  const handleSelectVehicle = (v: VehicleOption) => {
    if (v.flow === "whatsapp") {
      trackWhatsAppClick(`reserva_form_${v.id}`);
      const msg = buildWhatsMsg({
        vehicleLabel: v.label,
        routeLabel,
      });
      window.open(waLink(msg, WHATS_ERIC_RITA), "_blank", "noopener");
      return;
    }

    const basePrice = calcularTransfer({ pax: v.id, tripType: "ida_volta", payMethod: "pix", routeId: activeRouteId });
    trackReserveClick(`reserva_form_${v.id}`);
    trackInitiateCheckout(Math.round(basePrice.total * 100), v.label);

    const params = new URLSearchParams({
      routeId: activeRouteId,
      pax: v.id,
      fromWidget: "1",
    });

    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className="w-full">
      {/* Etapa 1: Vitrine de Veículos */}
      <div className="mb-10 text-center">
        <h2 className="font-display text-2xl font-semibold text-white mb-2">
          Escolha sua categoria
        </h2>
        <p className="text-sm text-white/55">
          Veículos premium com motorista exclusivo para o seu conforto.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {VEHICLES.map((v) => {
          // Calculate starting prices for display (baseline: ida_volta, pix)
          const basePrice = calcularTransfer({
            pax: v.id,
            tripType: "ida_volta",
            payMethod: "pix",
            routeId: activeRouteId,
          });

          return (
            <div
              key={v.id}
              className={`group relative flex flex-col overflow-hidden rounded-3xl border transition-all duration-300 border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10`}
            >
              <div className="relative h-48 w-full shrink-0 overflow-hidden">
                <Image
                  src={v.image}
                  alt={v.label}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {/* ── Fluxo badge (topo esquerdo) ── */}
                <div className="absolute top-4 left-4">
                  {v.flow === "direct" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      <span>⚡</span> Reserva instantânea
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#25D366]/90 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      <span>📲</span> Via WhatsApp
                    </span>
                  )}
                </div>

                {/* ── Badge opcional (topo direito) ── */}
                {v.badge && (
                  <div className="absolute top-4 right-4">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        v.featured
                          ? "bg-[color:var(--mt-gold)] text-black"
                          : "bg-black/50 text-white backdrop-blur-md"
                      }`}
                    >
                      {v.badge}
                    </span>
                  </div>
                )}

                <div className="absolute bottom-4 left-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{v.icon}</span>
                    <h3 className="text-xl font-bold text-white">{v.label}</h3>
                  </div>
                </div>
              </div>

              <div className="flex flex-col flex-1 p-5">
                <ul className="space-y-2 mb-4 flex-1 text-sm text-white/70">
                  <li className="flex items-center gap-2">
                    <span className="text-[color:var(--mt-gold)]">✓</span> Até{" "}
                    {VEHICLE_CAPACITY[v.id].max} pessoas
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[color:var(--mt-gold)]">✓</span>{" "}
                    {v.flow === "direct"
                      ? `A partir de ${brl(basePrice.total)} no PIX`
                      : "Valores e disponibilidade via WhatsApp"}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[color:var(--mt-gold)]">✓</span> Transfer privativo
                    exclusivo
                  </li>
                </ul>

                {v.flow === "whatsapp" && (
                  <p className="text-xs text-white/40 mb-4 leading-relaxed">
                    A Jolie coleta seus dados no WhatsApp e repassa para a Rita e o Eric organizarem sua agenda.
                  </p>
                )}
                {v.flow === "direct" && (
                  <p className="text-xs text-white/40 mb-4 leading-relaxed">
                    Confirmação imediata após o pagamento.
                  </p>
                )}

                <button
                  onClick={() => handleSelectVehicle(v)}
                  className={`w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-wide transition-all ${
                    v.flow === "whatsapp"
                      ? "bg-[#25D366] text-white hover:brightness-110"
                      : "bg-[color:var(--mt-gold)] text-black hover:brightness-110"
                  }`}
                >
                  {v.flow === "whatsapp" ? "Consultar no WhatsApp" : "Selecionar Veículo"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
