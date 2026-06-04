import Image from "next/image";
import { Section } from "@/app/components/ui/SectionLayout";
import { Container } from "@/app/components/ui/ContainerLayout";
import { FadeUp } from "@/app/components/ui/FadeUp";

export function BenefitsSection() {
  return (
    <Section className="relative py-20 px-6 border-y border-white/5 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/photos/serra/portico.webp"
          alt="Pórtico de Gramado"
          fill
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080b10] via-[#080b10]/50 to-[#080b10]" />
      </div>
      <Container className="relative z-10 max-w-6xl">
        <FadeUp>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="chip bg-[color:var(--mt-gold)]/10 border-[color:var(--mt-gold)]/40 text-[color:var(--mt-gold)] mb-4 inline-block font-semibold tracking-wider uppercase text-xs">
              O Padrão Inegociável
            </span>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-6 text-white">
              O privilégio de uma jornada sem imprevistos
            </h2>
            <p className="text-lg md:text-xl text-white/80 font-light leading-relaxed">
              Não entregamos apenas um deslocamento. Asseguramos que a sua experiência na Serra
              Gaúcha começará com o mais alto nível de acolhimento, discrição e segurança
              psicológica.
            </p>
          </div>
        </FadeUp>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FadeUp delay={100}>
            <div className="card-soft p-8 h-full border-t-2 border-white/10 hover:border-[color:var(--mt-gold)] transition-colors">
              <div className="text-[color:var(--mt-gold)] text-4xl mb-5 drop-shadow-md">✈️</div>
              <h3 className="text-xl font-bold text-white mb-3">Voo monitorado em tempo real</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Atrasou? O motorista já sabe. Adiantou? Também. Monitoramos seu voo e adaptamos a
                recepção automaticamente — sem você precisar avisar nada.
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={200}>
            <div className="card-soft p-8 h-full border-t-2 border-white/10 hover:border-[color:var(--mt-gold)] transition-colors">
              <div className="text-[color:var(--mt-gold)] text-4xl mb-5 drop-shadow-md">🚘</div>
              <h3 className="text-xl font-bold text-white mb-3">Veículo 100% exclusivo</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Nenhum outro passageiro. Nenhuma parada no meio do caminho. O veículo é inteiramente
                dedicado a você e sua família do embarque ao destino final.
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={300}>
            <div className="card-soft p-8 h-full border-t-2 border-white/10 hover:border-[color:var(--mt-gold)] transition-colors">
              <div className="text-[color:var(--mt-gold)] text-4xl mb-5 drop-shadow-md">💬</div>
              <h3 className="text-xl font-bold text-white mb-3">Atendimento humano real</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                A Jolie responde em minutos. A Rita e o Eric acompanham pessoalmente. Você fala com
                quem cuida da sua viagem — não com um bot ou uma central genérica.
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={400}>
            <div className="card-soft p-8 h-full border-t-2 border-white/10 hover:border-[color:var(--mt-gold)] transition-colors">
              <div className="text-[color:var(--mt-gold)] text-4xl mb-5 drop-shadow-md">🛡️</div>
              <h3 className="text-xl font-bold text-white mb-3">Segurança Total</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Operação conduzida por especialistas com mais de 10 anos de estrada. Sua única
                preocupação será desfrutar a paisagem da Rota Romântica.
              </p>
            </div>
          </FadeUp>
        </div>
      </Container>
    </Section>
  );
}
