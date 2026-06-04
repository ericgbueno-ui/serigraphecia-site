import Image from "next/image";
import Link from "next/link";
import { Section } from "@/app/components/ui/SectionLayout";
import { Container } from "@/app/components/ui/ContainerLayout";
import { FadeUp } from "@/app/components/ui/FadeUp";
import { HeroBookingWidget } from "./HeroBookingWidget";

export function Hero() {
  return (
    <FadeUp>
      <Section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-20 px-6">
        {/* BACKGROUND DA FOTO COM OVERLAY PREMIUM */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/photos/serra/familia_in.webp"
            alt="Recepção Premium na Serra Gaúcha"
            fill
            className="object-cover object-top opacity-50"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#080b10]/90 via-[#080b10]/60 to-[#080b10]/90" />
        </div>

        <Container className="relative z-10 max-w-3xl text-center">
          {/* TAGS DE POSICIONAMENTO */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <span className="badge shadow-lg">
              Transfer Privativo Premium
            </span>
            <span className="badge bg-black/40 border-white/10 text-white/80 backdrop-blur-md">
              Porto Alegre → Serra Gaúcha
            </span>
          </div>

          {/* HEADLINE */}
          <h1 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[1.1] mb-5 text-white drop-shadow-lg">
            Chegou em Porto Alegre. Relaxa.
            <br className="hidden md:block" />
            <span className="text-shimmer"> A Serra Gaúcha começa aqui.</span>
          </h1>

          <p className="text-base md:text-lg text-white/80 font-light mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow">
            Monitoramos seu voo, buscamos você no desembarque e levamos direto ao hotel em Gramado
            ou Canela — sem aplicativo, sem fila, sem improviso.{" "}
            <span className="text-white font-medium">
              Transfer privativo exclusivo para você e sua família.
            </span>
          </p>

          {/* WIDGET DE RESERVA INLINE */}
          <HeroBookingWidget />

          {/* LINK DE ACESSO AOS ROTEIROS */}
          <p className="mt-5 text-xs md:text-sm text-white/50">
            🎁 Planejando sua viagem? Baixe o{" "}
            <Link href="/roteiros" className="text-[color:var(--mt-gold)] hover:underline font-semibold">
              Guia de Roteiros da Concierge Jolie
            </Link>{" "}
            ou solicite seu Roteiro Personalizado.
          </p>

          {/* TRUST BADGES */}
          <div className="mt-10 pt-8 border-t border-white/10 flex flex-wrap justify-center gap-6 md:gap-10 text-sm text-white/70">
            <div className="flex flex-col items-center gap-2 font-medium">
              <span className="text-[color:var(--mt-gold)] text-xl">⭐</span>
              <span>4.9 no Google</span>
            </div>
            <div className="flex flex-col items-center gap-2 font-medium">
              <span className="text-[color:var(--mt-gold)] text-xl">✈️</span>
              <span>Monitora seu voo</span>
            </div>
            <div className="flex flex-col items-center gap-2 font-medium text-center">
              <span className="text-[color:var(--mt-gold)] text-xl">🔒</span>
              <span>Veículo exclusivo</span>
            </div>
            <div className="flex flex-col items-center gap-2 font-medium">
              <span className="text-[color:var(--mt-gold)] text-xl">🕒</span>
              <span>Atendimento 24/7</span>
            </div>
            <div className="flex flex-col items-center gap-2 font-medium">
              <span className="text-[color:var(--mt-gold)] text-xl">💳</span>
              <span>PIX ou 4x sem juros</span>
            </div>
          </div>
        </Container>
      </Section>
    </FadeUp>
  );
}
