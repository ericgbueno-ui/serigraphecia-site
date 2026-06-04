"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addAffiliateRefToWhatsHref } from "@/lib/attribution";
import { trackReserveClick, trackWhatsAppClick } from "@/lib/tracking";

// Preços base por rota × veículo (ida e volta no PIX)
const PRICES: Record<string, Record<string, { pix: number; cartao4x: number; direct: boolean }>> = {
  poa_gramado: {
    sedan: { pix: 499.8, cartao4x: 149.97, direct: true },
    van: { pix: 899.8, cartao4x: 251.31, direct: true },
    executivo: { pix: 799.8, cartao4x: 199.97, direct: false },
    suv: { pix: 799.8, cartao4x: 199.97, direct: false },
    suv_eletrico: { pix: 799.8, cartao4x: 199.97, direct: false },
  },
  caxias_gramado: {
    sedan: { pix: 599.8, cartao4x: 174.99, direct: true },
    van: { pix: 999.8, cartao4x: 276.65, direct: true },
    executivo: { pix: 799.8, cartao4x: 199.97, direct: false },
    suv: { pix: 799.8, cartao4x: 199.97, direct: false },
    suv_eletrico: { pix: 799.8, cartao4x: 199.97, direct: false },
  },
};

const ROTAS = [
  { id: "poa_gramado", slug: "porto-alegre-gramado", label: "Aeroporto Porto Alegre (POA)", icon: "✈" },
  { id: "caxias_gramado", slug: "caxias-gramado", label: "Aeroporto Caxias do Sul (CXJ)", icon: "✈" },
  { id: "city_tour", slug: "city-tour-gramado", label: "City Tour Gramado / Canela", icon: "🏙️" },
];

const VEHICLES = [
  { id: "sedan", label: "Sedan Premium", sub: "até 4 pessoas" },
  { id: "van", label: "Spin 6 Lugares", sub: "até 6 pessoas" },
  { id: "executivo", label: "Sedan Executivo", sub: "até 4 pessoas" },
  { id: "suv", label: "SUV", sub: "até 4 pessoas" },
  { id: "suv_eletrico", label: "SUV Elétrico", sub: "até 4 pessoas" },
];

const TRIP_TYPES = [
  { id: "ida_volta", label: "Chegada In + Retorno Out" },
  { id: "ida", label: "Só Chegada In" },
  { id: "volta", label: "Só Retorno Out" },
];

export function HeroBookingWidget() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState("sedan");
  const [tripType, setTripType] = useState("ida_volta");
  const [rota, setRota] = useState("poa_gramado");
  const [showVehicles, setShowVehicles] = useState(false);
  const [showRotas, setShowRotas] = useState(false);

  const rotaData = PRICES[rota] ?? PRICES.poa_gramado;
  const selected = rotaData[vehicle] ?? rotaData.sedan;
  const multiplier = tripType === "ida_volta" ? 1 : 0.5;
  let pix = selected.pix * multiplier;
  let cartao4x = selected.cartao4x * multiplier;
  if (rota === "city_tour") {
    pix = vehicle === "van" ? 499.9 : 399.9;
    cartao4x = pix / 4;
  }
  const selectedVehicle = VEHICLES.find((v) => v.id === vehicle)!;
  const selectedRota = ROTAS.find((r) => r.id === rota)!;

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    if (!showVehicles && !showRotas) return;
    const close = () => {
      setShowVehicles(false);
      setShowRotas(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showVehicles, showRotas]);

  const handleReservar = () => {
    if (!selected.direct) {
      trackWhatsAppClick("hero_widget_consulta");
      const msg = encodeURIComponent(
        `Olá! Gostaria de verificar a disponibilidade do ${selectedVehicle.label} para minha viagem a Gramado saindo de ${selectedRota.label}.`
      );
      window.open(addAffiliateRefToWhatsHref(`https://wa.me/5551986876557?text=${msg}`), "_blank");
      return;
    }
    trackReserveClick("hero_widget");
    const params = new URLSearchParams({
      routeId: rota === "city_tour" ? "poa_gramado" : rota,
      pax: vehicle,
      trip: rota === "city_tour" ? "so_citytour" : tripType,
      fromWidget: "1",
    });
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 relative z-20">
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
        {/* Linha 1: Rota + Tipo de trecho */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Rota */}
          <div className="flex flex-col">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">
              Origem
            </label>
            <div className="relative flex-1 flex flex-col">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRotas((v) => !v);
                }}
                className="w-full flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left flex justify-between items-center hover:border-white/20 transition-colors"
              >
                <span className="text-white text-sm font-medium">{selectedRota.icon} {selectedRota.label}</span>
                <span className="text-white/30 text-xs ml-2 shrink-0">▾</span>
              </button>

              {showRotas && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 bg-[#0f1015] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {ROTAS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setRota(r.id);
                        if (r.id === "city_tour" && !["sedan", "van"].includes(vehicle)) {
                          setVehicle("sedan");
                        }
                        setShowRotas(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm font-medium hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${
                        rota === r.id ? "text-amber-400 bg-amber-500/10" : "text-white"
                      }`}
                    >
                      {r.icon} {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tipo de trecho */}
          <div className="flex flex-col">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">
              Trecho
            </label>
              <div className="flex flex-wrap gap-1.5 w-full flex-1">
                {rota === "city_tour" ? (
                  <div className="w-full rounded-xl text-[11px] font-bold transition-all px-2 py-3 bg-white/5 border border-white/10 text-white/50 opacity-50 flex items-center justify-center">
                     Apenas Passeio
                  </div>
                ) : (
                  TRIP_TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTripType(t.id)}
                      className={`${
                        t.id === "ida_volta" ? "w-full" : "flex-1 min-w-[45%]"
                      } rounded-xl text-[11px] font-bold transition-all px-2 py-2 ${
                        tripType === t.id
                          ? "bg-amber-500/20 border border-amber-500/50 text-amber-400"
                          : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))
                )}
              </div>
          </div>
        </div>

        {/* Linha 2: Veículo */}
        <div className="mb-3">
          <div className="relative w-full">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">
              Veículo
            </label>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowVehicles((v) => !v);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left flex justify-between items-center hover:border-white/20 transition-colors"
            >
              <div>
                <span className="text-white text-sm font-medium">{selectedVehicle.label}</span>
                <span className="text-white/40 text-xs ml-2">{selectedVehicle.sub}</span>
              </div>
              <span className="text-white/30 text-xs ml-2 flex-shrink-0">▾</span>
            </button>

            {/* Dropdown */}
            {showVehicles && (
              <div
                className="absolute top-full left-0 right-0 mt-1 bg-[#0f1015] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {VEHICLES.filter(v => rota === "city_tour" ? (v.id === "sedan" || v.id === "van") : true).map((v) => {
                  const vData = rotaData[v.id];
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setVehicle(v.id);
                        setShowVehicles(false);
                      }}
                      className={`w-full px-4 py-3 text-left flex justify-between items-center hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${
                        vehicle === v.id ? "bg-amber-500/10" : ""
                      }`}
                    >
                      <div>
                        <span
                          className={`text-sm font-medium ${vehicle === v.id ? "text-amber-400" : "text-white"}`}
                        >
                          {v.label}
                        </span>
                        <span className="text-white/40 text-xs ml-2">{v.sub}</span>
                      </div>
                      {!vData.direct && (
                        <span className="text-[10px] text-blue-400/70 font-bold bg-blue-400/10 px-2 py-0.5 rounded-full flex-shrink-0">
                          Consulta
                        </span>
                      )}
                      {vData.direct && (
                        <span className="text-[10px] text-green-400/70 font-bold flex-shrink-0">
                          ⚡ Direto
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Linha 3: Preço + CTA — lado a lado */}
        <div className="flex items-center gap-3 mb-3">
          {/* Preço em tempo real */}
          <div className="flex-1 text-left">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">
              PIX
            </div>
            <div className="text-2xl font-black text-green-400 leading-none">
              R$ {pix.toFixed(2).replace(".", ",")}
            </div>
            <div className="text-[10px] text-white/30 mt-0.5">
              ou 4x R$ {cartao4x.toFixed(2).replace(".", ",")}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleReservar}
            className={`font-black py-3 px-5 rounded-xl hover:brightness-110 active:scale-[0.97] transition-all text-sm uppercase tracking-wider whitespace-nowrap ${
              selected.direct
                ? "bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                : "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            }`}
          >
            {selected.direct ? "Garantir →" : "WhatsApp →"}
          </button>
        </div>

        {/* Rodapé do widget */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <p className="text-[10px] text-white/30 font-medium">
            🔒 SSL · Mercado Pago · Detalhes do voo após o pagamento
          </p>
          {selected.direct ? (
            <span className="text-[10px] font-bold text-green-400/70 uppercase tracking-wider">
              ⚡ Confirmação imediata
            </span>
          ) : (
            <span className="text-[10px] font-bold text-blue-400/70 uppercase tracking-wider">
              💬 Verificar disponibilidade
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
