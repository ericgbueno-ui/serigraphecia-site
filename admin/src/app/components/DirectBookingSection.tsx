"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FadeUp } from "@/app/components/ui/FadeUp";
import { Section } from "@/app/components/ui/SectionLayout";
import { Container } from "@/app/components/ui/ContainerLayout";
import { ADDONS, brl } from "@/lib/pricing";

const investmentMap: Record<string, number> = {
  "Sedan Premium (até 4 clientes)": 499.8,
  "Categoria Minivan (até 6 clientes)": 899.8,
  "Sedan Executivo / SUV / SUV Elétrico": 699.8,
};
const upgradePrice = ADDONS.romantica.price;

export function DirectBookingSection() {
  const searchParams = useSearchParams();
  const [vehicle, setVehicle] = useState("Sedan Premium (até 4 clientes)");
  const [includeUpgrade, setIncludeUpgrade] = useState(false);

  useEffect(() => {
    const vehicleParam = searchParams.get("vehicle");
    if (vehicleParam && investmentMap[vehicleParam]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVehicle(vehicleParam);
    }
    if (searchParams.get("upgrade") === "true") {
      setIncludeUpgrade(true);
    }
  }, [searchParams]);

  const baseInvestment = investmentMap[vehicle] || 0;
  const totalInvestment = baseInvestment + (includeUpgrade ? upgradePrice : 0);
  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalInvestment);
  const formattedInstallments = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalInvestment / 4);

  const paxId = vehicle.includes("Minivan")
    ? "van"
    : vehicle.includes("Executivo")
      ? "executivo"
      : "sedan";

  return (
    <Section className="py-20 px-6 relative overflow-hidden" id="reservar">
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80" />

      <Container className="max-w-2xl relative z-10">
        <FadeUp>
          <div className="card p-8 md:p-10 border border-[color:var(--mt-gold)]/20 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Curadoria da Sua Experiência</h2>
              <p className="text-sm text-white/60">
                Selecione as opções para uma reserva blindada e sem fricção.
              </p>
            </div>

            <div className="space-y-6">
              {/* Vehicle Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[color:var(--mt-gold)] uppercase tracking-wider">
                  1. Curadoria de Frota
                </label>
                <select
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[color:var(--mt-gold)]/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="Sedan Premium (até 4 clientes)">
                    Sedan Premium (até 4 clientes) - Mais escolhido
                  </option>
                  <option value="Categoria Minivan (até 6 clientes)">
                    Spin 6 Lugares (até 6 clientes)
                  </option>
                  <option value="Sedan Executivo / SUV / SUV Elétrico">
                    Sedan Executivo / SUV / SUV Elétrico
                  </option>
                </select>
              </div>

              {/* Upgrade Checkbox */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[color:var(--mt-gold)] uppercase tracking-wider">
                  2. Elevação da Jornada (Opcional)
                </label>
                <label className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[color:var(--mt-gold)]/30 cursor-pointer transition-colors has-[:checked]:border-[color:var(--mt-gold)] has-[:checked]:bg-[color:var(--mt-gold)]/10">
                  <input
                    type="checkbox"
                    checked={includeUpgrade}
                    onChange={(e) => setIncludeUpgrade(e.target.checked)}
                    className="h-5 w-5 mt-0.5 shrink-0 rounded bg-black/50 border-white/20 text-[color:var(--mt-gold)] focus:ring-offset-0 focus:ring-1 focus:ring-[color:var(--mt-gold)]"
                  />
                  <span className="flex-1 text-sm">
                    <span className="font-semibold text-white">
                      Adicionar Curadoria Rota Romântica
                    </span>
                    <span className="block text-xs text-white/50 mt-1">
                      Paradas contemplativas em Nova Petrópolis. Acréscimo de {brl(upgradePrice)}.
                    </span>
                  </span>
                </label>
              </div>

              {/* Total */}
              <div className="pt-6 border-t border-white/10">
                <div className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-white/5 to-[color:var(--mt-gold)]/10 border border-[color:var(--mt-gold)]/20 gap-2">
                  <span className="text-sm font-semibold text-white/90 uppercase tracking-wider">
                    Investimento Total
                  </span>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-[color:var(--mt-gold)]">
                      {formattedTotal}
                    </span>
                    <span className="block text-xs font-medium text-white/70">
                      ou em 4x de {formattedInstallments}
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="mt-6 relative">
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                  @keyframes pixPulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 rgba(250,204,21,0); }
                    50% { transform: scale(1.02); box-shadow: 0 0 16px rgba(250,204,21,0.25); }
                    100% { transform: scale(1); box-shadow: 0 0 0 rgba(250,204,21,0); }
                  }
                  .btn-pix {
                    background: linear-gradient(135deg, #111827, #1f2937);
                    color: #facc15;
                    border: 1px solid rgba(250, 204, 21, 0.5);
                    animation: pixPulse 2.4s infinite ease-in-out;
                  }
                  .btn-pix:hover {
                    transform: scale(1.03);
                    box-shadow: 0 0 22px rgba(250, 204, 21, 0.45);
                    border-color: rgba(250, 204, 21, 0.9);
                    animation: none;
                  }
                `,
                  }}
                />
                <Link
                  href={`/checkout?routeId=poa_gramado&pax=${paxId}&fromWidget=1${includeUpgrade ? "&addon=romantica" : ""}`}
                  className="btn-pix w-full flex items-center justify-center py-4 text-lg rounded-xl font-bold transition-all duration-300 relative"
                >
                  <span className="absolute -top-3 -right-2 bg-yellow-400 text-gray-900 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-md shadow-md">
                    Mais econômico
                  </span>
                  ⚡ Garantir reserva no PIX
                </Link>
                <p className="text-center text-xs text-white/40 mt-4 flex items-center justify-center gap-2">
                  <span>🔒</span> Ambiente 100% seguro com confirmação imediata.
                </p>
              </div>
            </div>
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}
