import { Section } from "@/app/components/ui/SectionLayout";
import { Container } from "@/app/components/ui/ContainerLayout";
import { FadeUp } from "@/app/components/ui/FadeUp";

export function RouteSeoContent() {
  return (
    <Section className="py-20 px-6 bg-black/40 border-t border-white/5">
      <Container className="max-w-4xl text-center md:text-left">
        <FadeUp>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-8 justify-center md:justify-start">
            <span className="hidden md:block h-[1px] w-12 bg-[color:var(--mt-gold)]/50"></span>
            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest text-[color:var(--mt-gold)]">
              A sua rota para a Serra Gaúcha
            </h2>
          </div>
          <div className="space-y-6 text-sm md:text-base text-white/60 leading-relaxed font-light">
            <p>
              O <strong>transfer de Porto Alegre para Gramado</strong> é o primeiro passo para quem
              busca conforto, segurança psicológica e total privacidade ao chegar na Serra Gaúcha.
              Nossa curadoria logística inicia a sua recepção diretamente no{" "}
              <strong>Aeroporto Salgado Filho</strong>, ou em qualquer endereço da capital,
              conduzindo você e sua família até Gramado, Canela e as principais cidades da região.
            </p>
            <p>
              Muitos clientes pesquisam o{" "}
              <strong>valor de um transfer de Porto Alegre para Gramado</strong> buscando o melhor
              custo-benefício. Na Multi Trip, nós elevamos essa expectativa: entregamos não apenas
              um transporte, mas uma reserva blindada com motoristas especialistas, padrão executivo
              imaculado e suporte de Concierge 24 horas.
            </p>
            <p>
              O percurso de aproximadamente duas horas deixa de ser um mero deslocamento e se torna
              uma extensão da sua jornada. Diferente da incerteza gerada por aplicativos de
              transporte convencionais, nossa operação privativa monitora o seu voo em tempo real,
              garantindo a sua recepção pontual, seja de madrugada, em finais de semana ou feriados.
            </p>
            <p>
              Se a sua busca é por um <strong>transfer privativo em Gramado</strong>, um{" "}
              <strong>traslado de Porto Alegre para Canela</strong> seguro ou o{" "}
              <strong>melhor transfer para o seu hotel na Serra Gaúcha</strong>, a Multi Trip
              materializa essa necessidade. Elimine as surpresas da sua viagem e assegure que a sua
              experiência comece com o mais alto nível de acolhimento.
            </p>
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}
