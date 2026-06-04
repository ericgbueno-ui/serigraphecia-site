"use client";

/**
 * FastReservaForm — widget rápido de entrada (hero sections)
 *
 * REESCRITO (auditoria CRO):
 * ─ Antes: apenas redirecionava para a homepage sem passar dados
 * ─ Agora: coleta data + nº de pessoas e redireciona para /reserva
 *   com os parâmetros corretos + fromWidget=1 para pular step 0
 *
 * Props:
 *   routeId — rota a pré-preencher (padrão: poa_gramado)
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

function localDateValue(date: Date) {
  const off = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - off).toISOString().slice(0, 10);
}

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

interface Props {
  routeId?: string;
  className?: string;
}

export function FastReservaForm({ routeId = "poa_gramado", className = "" }: Props) {
  const router = useRouter();
  const [data, setData] = useState(localDateValue(addDays(2)));
  const [pessoas, setPessoas] = useState("2");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      routeId,
      data,
      pessoas,
      trip: "ida_volta",
      fromWidget: "1",
    });
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white/10 backdrop-blur-md border border-[color:var(--mt-gold)]/30 rounded-2xl shadow-xl w-full max-w-xl mx-auto flex flex-col sm:flex-row items-end gap-3 p-4 sm:p-5 relative z-20 ${className}`}
    >
      <div className="flex-1 w-full text-left">
        <label className="block text-xs font-medium text-white/70 mb-1.5 ml-1">
          Data de chegada
        </label>
        <input
          type="date"
          required
          value={data}
          min={localDateValue(new Date())}
          onChange={(e) => setData(e.target.value)}
          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[color:var(--mt-gold)] outline-none transition-colors"
        />
      </div>
      <div className="w-full sm:w-36 text-left">
        <label className="block text-xs font-medium text-white/70 mb-1.5 ml-1">Pessoas</label>
        <select
          value={pessoas}
          onChange={(e) => setPessoas(e.target.value)}
          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[color:var(--mt-gold)] outline-none transition-colors"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "pessoa" : "pessoas"}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="w-full sm:w-auto rounded-xl bg-[color:var(--mt-gold)] px-6 py-3 text-sm font-bold text-black transition hover:brightness-105 whitespace-nowrap"
      >
        Ver preços →
      </button>
    </form>
  );
}
