import { Section } from "@/app/components/ui/SectionLayout";
import { Container } from "@/app/components/ui/ContainerLayout";
import { FadeUp } from "@/app/components/ui/FadeUp";

export function FleetStandardNotice() {
  return (
    <Section className="py-10 px-6 bg-white/[0.02] border-y border-white/5">
      <Container className="max-w-4xl text-center">
        <FadeUp>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="h-[1px] w-8 bg-[color:var(--mt-gold)]/30"></span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[color:var(--mt-gold)]/80">
              Transparência & Padrão Executivo
            </span>
            <span className="h-[1px] w-8 bg-[color:var(--mt-gold)]/30"></span>
          </div>
          <p className="text-sm md:text-base text-white/60 leading-relaxed font-light">
            Os veículos ilustrados em nossos canais representam o{" "}
            <strong className="text-white/80 font-medium">padrão de excelência inegociável</strong>{" "}
            da frota Multi Trip. A curadoria do modelo exato para a sua recepção é definida pela
            nossa inteligência logística, em total alinhamento com a disponibilidade da nossa agenda
            exclusiva no dia.
          </p>
          <p className="text-sm md:text-base text-white/60 leading-relaxed font-light mt-3">
            Mais do que a máquina, o nosso maior compromisso é garantir a sua{" "}
            <strong className="text-white/80 font-medium">
              pontualidade britânica, tranquilidade absoluta e segurança psicológica
            </strong>{" "}
            em cada detalhe do seu acolhimento.
          </p>
        </FadeUp>
      </Container>
    </Section>
  );
}
