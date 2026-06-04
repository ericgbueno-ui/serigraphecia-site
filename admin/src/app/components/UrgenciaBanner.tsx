"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * UrgenciaBanner — banner de urgência contextual
 *
 * MUDANÇAS:
 * ─ Transformado em popup (toast flutuante) para as páginas internas.
 * ─ Modo "checkout" mantido inline com aviso de segurança.
 */

interface Props {
  mode?: "checkout";
  targetDate?: string; // "YYYY-MM-DD"
}

// Feriados prolongados e períodos de alta demanda
const HIGH_DEMAND_PERIODS: Array<{ label: string; start: string; end: string; title: string; copy: string }> = [
  { label: "Carnaval", start: "02-28", end: "03-05", title: "Carnaval em Gramado", copy: "A agenda do feriado já está fechando. Garanta seu transfer privativo." },
  { label: "Páscoa", start: "04-17", end: "04-22", title: "Páscoa na Serra", copy: "A agenda do feriado já está fechando. Garanta seu transfer privativo." },
  { label: "Inverno", start: "07-01", end: "07-31", title: "Alta Temporada", copy: "A agenda do Inverno já está fechando. Garanta seu transfer privativo." },
  { label: "Natal Luz", start: "11-01", end: "01-15", title: "Natal Luz", copy: "A agenda do Natal Luz já está fechando. Garanta seu transfer privativo." },
];

function getActivePeriod(date: Date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const today = `${mm}-${dd}`;

  for (const p of HIGH_DEMAND_PERIODS) {
    if (p.start <= p.end) {
      if (today >= p.start && today <= p.end) return p;
    } else {
      if (today >= p.start || today <= p.end) return p;
    }
  }
  return null;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 5 || day === 6 || day === 0; // sex, sáb, dom
}

export function UrgenciaBanner({ mode, targetDate }: Props) {
  const [isDismissed, setIsDismissed] = useState(false);
  const pathname = usePathname();

  const date = targetDate ? new Date(`${targetDate}T12:00:00`) : new Date();

  // Esconde o popup completamente nas rotas de painel interno e linktree
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/motorista") || pathname?.startsWith("/afiliado") || pathname?.startsWith("/links") || pathname?.startsWith("/agencia-de-viagem")) {
    return null;
  }

  // Modo checkout — aviso de segurança (sempre exibir inline)
  if (mode === "checkout") {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        <p className="font-semibold">⚡ Sua data ainda não está garantida</p>
        <p className="mt-0.5 text-xs text-amber-100/75">
          Confirme o pagamento para reservar sua vaga. Veículos executivos têm disponibilidade limitada.
        </p>
      </div>
    );
  }

  // Verificar se há razão real para exibir urgência ou segurança
  const activePeriod = getActivePeriod(date);
  const isWknd = isWeekend(date);

  if (isDismissed) return null;

  let title = "";
  let copy = "";
  let icon = "🔥";
  let color = "text-amber-500";
  let border = "border-amber-500/30";
  let bg = "bg-[#1a1a1a]/95";

  if (activePeriod) {
    title = activePeriod.title;
    copy = activePeriod.copy;
  } else if (isWknd) {
    title = "Fim de Semana";
    copy = "Sextas e Domingos possuem altíssima procura no aeroporto. Reserve para garantir seu Sedan Premium.";
  } else {
    title = "Tranquilidade Garantida";
    copy = "Seu motorista aguardando no desembarque com uma placa no seu nome. Sem filas, sem aplicativo.";
    icon = "✅";
    color = "text-emerald-400";
    border = "border-emerald-500/30";
  }

  return (
    <div className={`fixed top-24 right-4 md:right-6 z-[100] max-w-sm rounded-xl border ${border} ${bg} backdrop-blur-md px-5 py-4 text-sm shadow-2xl animate-in slide-in-from-top-8 fade-in duration-500`}>
      <button 
        onClick={() => setIsDismissed(true)} 
        className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        aria-label="Fechar aviso"
      >
        ✕
      </button>
      <div className="flex items-start gap-3 pr-4">
        <div className="text-xl">{icon}</div>
        <div>
          <p className={`font-semibold ${color}`}>{title}</p>
          <p className="mt-1 text-xs text-gray-300">
            {copy}
          </p>
        </div>
      </div>
    </div>
  );
}
