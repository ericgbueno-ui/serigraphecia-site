"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROTAS = [
  {
    value: "porto-alegre-gramado",
    label: "✈️ Aeroporto Porto Alegre (POA)",
    badge: "A partir de R$ 249,90",
    trecho: "POA → Gramado / Canela",
  },
  {
    value: "caxias-gramado",
    label: "✈️ Aeroporto Caxias do Sul (CXJ)",
    badge: "A partir de R$ 299,90",
    trecho: "CXJ → Gramado / Canela",
  },
];

const TRECHOS = [
  { value: "ida_volta", label: "Chegada In + Retorno Out" },
  { value: "ida", label: "Só Chegada In" },
  { value: "volta", label: "Só Retorno Out" },
  { value: "so_citytour", label: "Só City Tour" },
];

export function BookingWidget() {
  const router = useRouter();
  const [rotaIdx, setRotaIdx] = useState(0);
  const [trecho, setTrecho] = useState("ida_volta");

  const rota = ROTAS[rotaIdx];

  function handleReservar() {
    const slug = rota.value;
    const params = new URLSearchParams({ trip: trecho });
    router.push(`/transfer/${slug}?${params.toString()}`);
  }

  return (
    <div className="w-full max-w-xl mx-auto bg-white/10 backdrop-blur-md border border-[color:var(--mt-gold)]/30 rounded-2xl shadow-2xl overflow-hidden mt-8 text-left relative z-20">
      <div className="p-6 md:p-8 space-y-5">
        {/* ORIGEM */}
        {trecho !== "so_citytour" && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-white/50 mb-2">
              Destino
            </label>
            <div className="flex flex-col gap-2">
              {ROTAS.map((r, i) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRotaIdx(i)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                    rotaIdx === i
                      ? "border-[color:var(--mt-gold)] bg-[color:var(--mt-gold)]/10"
                      : "border-white/10 bg-black/30 hover:border-white/25"
                  }`}
                >
                  <span
                    className={`text-sm font-semibold ${rotaIdx === i ? "text-[color:var(--mt-gold)]" : "text-white/80"}`}
                  >
                    {r.label}
                  </span>
                  <span className="text-[11px] text-white/40 font-medium">{r.badge}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TRECHO */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-white/50 mb-2">
            Trecho
          </label>
          <div className="flex flex-wrap gap-2 bg-black/30 p-1 rounded-xl border border-white/10">
            {TRECHOS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTrecho(t.value)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition ${
                  trecho === t.value
                    ? "bg-[color:var(--mt-gold)] text-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* DESTINO — fixo */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-white/50 mb-2">
            Destino
          </label>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-black/20">
            <span className="text-lg">🏔️</span>
            <span className="text-sm font-semibold text-white/80">Gramado / Canela — RS</span>
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleReservar}
          className="w-full btn-primary py-4 font-bold text-base rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all"
        >
          Ver veículos e preços →
        </button>

        <p className="text-center text-xs text-white/40">
          Veículo exclusivo · Preço fixo · Sem compartilhamento
        </p>
      </div>

      {/* WHATSAPP FALLBACK */}
      <div className="bg-black/30 border-t border-white/10 py-3 text-center">
        <a
          href="https://wa.me/5551989129376"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-white/60 hover:text-[color:var(--mt-gold)] transition-colors"
        >
          📲 Prefiro reservar pelo WhatsApp
        </a>
      </div>
    </div>
  );
}
