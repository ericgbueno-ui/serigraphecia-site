import { Section } from "@/app/components/ui/SectionLayout";
import { Container } from "@/app/components/ui/ContainerLayout";
import { FadeUp } from "@/app/components/ui/FadeUp";

const TESTIMONIALS = [
  {
    text: "O motorista estava no aeroporto antes de eu sair do desembarque. O veículo era muito confortável e a viagem foi tranquila do início ao fim. Depois de um voo longo, isso fez toda a diferença. Recomendo a qualquer pessoa que queira chegar a Gramado com qualidade e sem preocupações.",
    name: "Carlos E. Silva",
    city: "São Paulo · SP",
    vehicle: "Sedan Premium",
    initial: "C",
  },
  {
    text: "Fizemos a Rota Romântica no trajeto e foi a melhor decisão da viagem. As paradas foram bem escolhidas, o motorista conhecia cada detalhe do caminho e o atendimento foi atencioso do início ao fim. A experiência começa muito antes de chegar em Gramado.",
    name: "Mariana Fontes",
    city: "Porto Alegre · RS",
    vehicle: "Rota Romântica",
    initial: "M",
  },
  {
    text: "Viajamos em família com três crianças pequenas e precisávamos de segurança e conforto acima de tudo. A Jolie organizou tudo com antecedência, o motorista foi super atencioso com as crianças e chegamos a Gramado descansados. Contratamos de volta também. Nota dez.",
    name: "Fernanda Lopes",
    city: "Curitiba · PR",
    vehicle: "Spin 6 Lugares",
    initial: "F",
  },
  {
    text: "Já usei vários serviços de transfer na Serra Gaúcha. A Multi Trip foi de longe o melhor. Pontualidade perfeita, carro impecável e um atendimento que faz você sentir que está sendo cuidado, não só transportado. Preço justo pelo que entrega.",
    name: "Ricardo Motta",
    city: "Florianópolis · SC",
    vehicle: "Sedan Premium",
    initial: "R",
  },
  {
    text: "Lua de mel perfeita começa na chegada. Contratamos o transfer e foi uma surpresa positiva desde o primeiro contato. O carro estava limpo, cheirava bem, o motorista discreto e gentil. Chegamos em Gramado no clima certo para aproveitar cada momento.",
    name: "Juliana e André",
    city: "Belo Horizonte · MG",
    vehicle: "Sedan Executivo",
    initial: "J",
  },
];

export function TestimonialsSection() {
  return (
    <Section className="py-20 px-6 bg-black/20 border-y border-white/5">
      <Container className="max-w-6xl">
        <FadeUp>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="chip bg-[color:var(--mt-gold)]/10 border-[color:var(--mt-gold)]/40 text-[color:var(--mt-gold)] mb-4 inline-block font-semibold tracking-wider uppercase text-xs">
              ★★★★★ Avaliações reais
            </span>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-6 text-white">
              Quem já viajou sabe a diferença
            </h2>
            <p className="text-base text-white/60">
              Clientes de todo o Brasil que escolheram a Multi Trip para chegar a Gramado com
              conforto, pontualidade e tranquilidade.
            </p>
          </div>
        </FadeUp>

        {/* Linha destaque — depoimento principal */}
        <FadeUp delay={50}>
          <div className="card-gold p-8 md:p-10 rounded-3xl mb-6 relative overflow-hidden">
            <div className="absolute top-6 right-8 text-[color:var(--mt-gold)]/15 text-8xl font-serif leading-none select-none">
              &ldquo;
            </div>
            <div className="text-[color:var(--mt-gold)] text-xl mb-4 tracking-widest">★★★★★</div>
            <p className="text-white text-xl md:text-2xl font-light italic leading-relaxed mb-8 max-w-3xl">
              &ldquo;{TESTIMONIALS[0].text}&rdquo;
            </p>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[color:var(--mt-gold)]/20 border border-[color:var(--mt-gold)]/40 flex items-center justify-center text-[color:var(--mt-gold)] font-bold text-lg shrink-0">
                {TESTIMONIALS[0].initial}
              </div>
              <div>
                <p className="text-sm font-bold text-white tracking-wide">{TESTIMONIALS[0].name}</p>
                <p className="text-xs text-white/50 uppercase tracking-wider mt-0.5">
                  {TESTIMONIALS[0].city} · {TESTIMONIALS[0].vehicle}
                </p>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Grade 2×2 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {TESTIMONIALS.slice(1, 5).map((t, i) => (
            <FadeUp key={t.name} delay={(i + 1) * 100}>
              <div className="card-soft p-7 h-full border border-white/10 hover:border-[color:var(--mt-gold)]/40 transition-colors rounded-3xl flex flex-col">
                <div className="text-[color:var(--mt-gold)] text-lg mb-4 tracking-widest">
                  ★★★★★
                </div>
                <p className="text-white/80 text-base italic leading-relaxed mb-6 flex-1">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t border-white/10 pt-5">
                  <div className="h-10 w-10 rounded-full bg-[color:var(--mt-gold)]/10 border border-[color:var(--mt-gold)]/30 flex items-center justify-center text-[color:var(--mt-gold)] font-bold text-sm shrink-0">
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white tracking-wide">{t.name}</p>
                    <p className="text-xs text-white/50 uppercase tracking-wider mt-0.5">
                      {t.city} · {t.vehicle}
                    </p>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Rodapé de confiança */}
        <FadeUp delay={500}>
          <p className="text-center text-xs text-white/35 tracking-wider uppercase mt-4">
            Depoimentos de clientes reais · Avaliações verificadas · Porto Alegre para Gramado e
            Canela
          </p>
        </FadeUp>
      </Container>
    </Section>
  );
}
