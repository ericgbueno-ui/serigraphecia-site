import Link from "next/link";
import Image from "next/image";
import { Section } from "@/app/components/ui/SectionLayout";
import { Container } from "@/app/components/ui/ContainerLayout";
import { FadeUp } from "@/app/components/ui/FadeUp";
import { ADDONS, brl } from "@/lib/pricing";

export function ExperienceUpgradeSection() {
  return (
    <Section className="py-20 px-6 border-y border-[color:var(--mt-gold)]/20 relative overflow-hidden">
      {/* IMAGEM DE FUNDO COM TONS TERROSOS */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/photos/serra/rota-romantica.webp"
          alt="Paisagem da Rota Romântica na Serra Gaúcha"
          fill
          className="object-cover opacity-50"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1000]/80 via-[#2D1500]/60 to-[#1A1000]/80" />
      </div>

      <Container className="max-w-6xl relative z-10">
        <FadeUp>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="chip bg-[color:var(--mt-gold)]/10 border-[color:var(--mt-gold)]/40 text-[color:var(--mt-gold)] mb-4 inline-block font-semibold tracking-wider">
              Add-on opcional
            </span>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-6 text-white">
              Inclua a sua experiência:{" "}
              <span className="text-[color:var(--mt-gold)] italic font-light block mt-2">
                Rota Romântica
              </span>
            </h2>
            <p className="text-lg md:text-xl text-white/80 font-light leading-relaxed">
              Transforme parte do trajeto em uma memória especial da Serra Gaúcha. As paradas
              selecionadas em Nova Petrópolis deixam a chegada mais contemplativa e memorável.
            </p>
          </div>
        </FadeUp>

        {/* EMPILHAMENTO DE 3 BENEFÍCIOS (REGRA DE CONVERSÃO) ANTES DO PREÇO */}
        <FadeUp delay={100}>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="card-soft p-8 border-t-2 border-white/10 hover:border-[color:var(--mt-gold)] transition-colors">
              <div className="text-[color:var(--mt-gold)] text-4xl mb-5 drop-shadow-md">📸</div>
              <h4 className="text-xl font-bold text-white mb-3">Paradas selecionadas</h4>
              <p className="text-sm text-white/70 leading-relaxed">
                Paradas cuidadosamente selecionadas no <strong>Parque Histórico Jorge Kuhn</strong>,
                no charmoso <strong>Labirinto Verde</strong> e no imponente{" "}
                <strong>Mirante da Torre</strong>.
              </p>
            </div>

            <div className="card-soft p-8 border-t-2 border-white/10 hover:border-[color:var(--mt-gold)] transition-colors">
              <div className="text-[color:var(--mt-gold)] text-4xl mb-5 drop-shadow-md">⏳</div>
              <h4 className="text-xl font-bold text-white mb-3">Ritmo sem pressa</h4>
              <p className="text-sm text-white/70 leading-relaxed">
                A pressa não faz parte desta experiência. Seu motorista estará à inteira disposição
                para que você e sua família desfrutem de cada cenário com absoluta calma e
                privacidade.
              </p>
            </div>

            <div className="card-soft p-8 border-t-2 border-white/10 hover:border-[color:var(--mt-gold)] transition-colors">
              <div className="text-[color:var(--mt-gold)] text-4xl mb-5 drop-shadow-md">💎</div>
              <h4 className="text-xl font-bold text-white mb-3">Contexto cultural</h4>
              <p className="text-sm text-white/70 leading-relaxed">
                Inicie o seu acolhimento conhecendo a rica herança da colonização alemã por meio de
                especialistas que vivenciam a história e o design da região.
              </p>
            </div>
          </div>
        </FadeUp>

        {/* PREÇO, ESCASSEZ E CTA */}
        <FadeUp delay={200}>
          <div className="card border border-[color:var(--mt-gold)]/30 bg-gradient-to-r from-black/80 to-[color:var(--mt-gold)]/10 p-8 md:p-10 rounded-3xl flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
            <div className="text-center lg:text-left">
              <h4 className="text-xl font-semibold text-white mb-2">
                Adicione esta experiência à sua reserva
              </h4>
              <div className="flex flex-col sm:flex-row items-center lg:items-end gap-2 lg:gap-3 mb-3">
                <span className="text-4xl font-bold text-[color:var(--mt-gold)]">
                  {brl(ADDONS.romantica.price)}
                </span>
                <span className="text-sm text-white/60 mb-1">
                  / acréscimo único ao valor da categoria escolhida
                </span>
              </div>
            </div>
            <div className="shrink-0 w-full lg:w-auto">
              <Link
                href="#valores"
                className="group relative overflow-hidden btn-primary w-full flex items-center justify-center px-10 py-5 text-lg font-bold shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="relative z-10">Quero adicionar à minha reserva</span>
              </Link>
            </div>
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}
