"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SITE, waLink } from "@/lib/site";
import { ADDONS, brl } from "@/lib/pricing";
import { trackWhatsAppClick } from "@/lib/tracking";
import { WhatsLink } from "./WhatsLink";
import { Section } from "@/app/components/ui/SectionLayout";
import { Container } from "@/app/components/ui/ContainerLayout";
import { FadeUp } from "@/app/components/ui/FadeUp";

export function ReservationSection() {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [vehicle, setVehicle] = useState("Sedan Executivo / SUV / SUV Elétrico");
  const [includeUpgrade, setIncludeUpgrade] = useState(false);

  useEffect(() => {
    if (searchParams.get("upgrade") === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIncludeUpgrade(true);
    }
  }, [searchParams]);

  // Lógica de Preços (Feedback Constante & Transparência)
  const investmentMap: Record<string, number> = {
    "Sedan Premium (até 4 clientes)": 499.8,
    "Sedan Executivo / SUV / SUV Elétrico": 699.8,
    "Categoria Minivan (até 6 clientes)": 899.8,
  };
  const baseInvestment = investmentMap[vehicle] || 699.8;
  const totalInvestment = baseInvestment + (includeUpgrade ? ADDONS.romantica.price : 0);
  const formattedTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalInvestment);

  // Validação simples para Feedback Constante
  const isFormValid = name.trim().length > 2 && phone.trim().length > 10 && date !== "";

  // Mensagem dinâmica gerada para a Concierge
  const whatsMessage = `Olá, Jolie! Gostaria de solicitar a disponibilidade para a minha jornada na Serra Gaúcha.\n\n*Titular:* ${name}\n*Contato:* ${phone}\n*Data da Experiência:* ${date.split("-").reverse().join("/")}\n*Categoria Selecionada:* ${vehicle}${includeUpgrade ? "\n*Curadoria Adicional:* Rota Romântica" : ""}\n*Investimento Previsto:* ${formattedTotal}`;

  return (
    <Section className="py-20 px-6 relative overflow-hidden" id="reservar">
      {/* Fundo com efeito de luxo sutil */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80" />

      <Container className="max-w-4xl relative z-10">
        <FadeUp>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="chip bg-[color:var(--mt-gold)]/10 border-[color:var(--mt-gold)]/40 text-[color:var(--mt-gold)] mb-4 inline-block font-semibold tracking-wider uppercase text-xs">
              Atendimento Exclusivo
            </span>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4 text-white">
              A sua reserva blindada
            </h2>
            <p className="text-lg text-white/70 font-light">
              Preencha os dados abaixo para que a nossa equipe de Concierge organize a sua recepção
              na Serra Gaúcha com pontualidade e discrição.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={100}>
          <div className="card p-8 md:p-10 border border-[color:var(--mt-gold)]/20 shadow-2xl">
            <form className="grid md:grid-cols-2 gap-6" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-[color:var(--mt-gold)] uppercase tracking-wider">
                  Nome do Titular
                </label>
                <input
                  type="text"
                  placeholder="Como gostaria de ser chamado?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-[color:var(--mt-gold)]/50 focus:bg-white/10 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[color:var(--mt-gold)] uppercase tracking-wider">
                  WhatsApp para Contato
                </label>
                <input
                  type="tel"
                  placeholder="(51) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-[color:var(--mt-gold)]/50 focus:bg-white/10 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[color:var(--mt-gold)] uppercase tracking-wider">
                  Data da Chegada
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/30 focus:outline-none focus:border-[color:var(--mt-gold)]/50 focus:bg-white/10 transition-all [color-scheme:dark]"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-[color:var(--mt-gold)] uppercase tracking-wider">
                  Curadoria de Frota
                </label>
                <select
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[color:var(--mt-gold)]/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="Sedan Premium (até 4 clientes)">
                    Sedan Premium (até 4 clientes)
                  </option>
                  <option value="Sedan Executivo / SUV / SUV Elétrico">
                    Sedan Executivo / SUV / SUV Elétrico (A mais escolhida)
                  </option>
                  <option value="Categoria Minivan (até 6 clientes)">
                    Categoria Minivan (até 6 clientes)
                  </option>
                </select>
              </div>

              <div className="md:col-span-2 mt-2">
                <label className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[color:var(--mt-gold)]/30 cursor-pointer transition-colors has-[:checked]:border-[color:var(--mt-gold)] has-[:checked]:bg-[color:var(--mt-gold)]/10">
                  <input
                    type="checkbox"
                    checked={includeUpgrade}
                    onChange={(e) => setIncludeUpgrade(e.target.checked)}
                    className="h-5 w-5 rounded bg-black/50 border-white/20 text-[color:var(--mt-gold)] focus:ring-offset-0 focus:ring-1 focus:ring-[color:var(--mt-gold)]"
                  />
                  <span className="flex-1 text-sm">
                    <span className="font-semibold text-white">
                      Sim, desejo elevar minha jornada com a Curadoria Rota Romântica.
                    </span>
                    <span className="block text-xs text-white/50 mt-1">
                      Acréscimo de {brl(ADDONS.romantica.price)} ao valor total.
                    </span>
                  </span>
                </label>
              </div>

              <div className="md:col-span-2 mt-4 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-white/5 to-[color:var(--mt-gold)]/10 border border-[color:var(--mt-gold)]/20 mb-2 gap-2">
                  <span className="text-sm font-semibold text-white/90 uppercase tracking-wider">
                    Investimento Previsto
                  </span>
                  <span className="text-2xl font-bold text-[color:var(--mt-gold)]">
                    {formattedTotal}
                  </span>
                </div>

                <WhatsLink
                  href={waLink(whatsMessage, SITE.whatsE164)}
                  className={`btn-primary w-full justify-center py-5 text-lg shadow-[0_0_20px_rgba(212,175,55,0.15)] ${!isFormValid ? "opacity-50 pointer-events-none grayscale-[50%]" : "hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]"}`}
                  onClick={() => trackWhatsAppClick("reservar_section")}
                >
                  👉 Quero confirmar disponibilidade com a Jolie
                </WhatsLink>
                <p className="text-center text-xs text-white/40 flex items-center justify-center gap-2">
                  <span>🔒</span> O pagamento só será solicitado após a confirmação da reserva pela
                  nossa equipe.
                </p>
              </div>
            </form>
          </div>
        </FadeUp>

        {/* Contato Alternativo */}
        <FadeUp delay={200}>
          <div className="mt-10 text-center flex flex-col items-center justify-center gap-3">
            <p className="text-sm text-white/60">Prefere um atendimento inteiramente humano?</p>
            <WhatsLink
              href={waLink(
                "Olá, Jolie! Gostaria de organizar a minha recepção na Serra Gaúcha.",
                SITE.whatsE164
              )}
              className="text-[color:var(--mt-gold)] hover:text-white transition-colors text-sm font-semibold flex items-center gap-2 border-b border-[color:var(--mt-gold)]/30 hover:border-white pb-0.5"
            >
              💬 Tire minhas dúvidas com a Jolie
            </WhatsLink>
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}
