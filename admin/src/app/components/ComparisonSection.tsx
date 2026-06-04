import { Section } from "@/app/components/ui/SectionLayout";
import { Container } from "@/app/components/ui/ContainerLayout";
import { FadeUp } from "@/app/components/ui/FadeUp";

type Row = {
  feature: string;
  multitrip: string | true | false;
  apps: string | true | false;
  shared: string | true | false;
};

const ROWS: Row[] = [
  {
    feature: "Veículo exclusivo (sem dividir)",
    multitrip: true,
    apps: "Depende do motorista",
    shared: false,
  },
  {
    feature: "Monitoramento de voo automático",
    multitrip: true,
    apps: false,
    shared: false,
  },
  {
    feature: "Motorista sabe seu nome antes de você chegar",
    multitrip: true,
    apps: false,
    shared: false,
  },
  {
    feature: "Horário de saída escolhido por você",
    multitrip: true,
    apps: true,
    shared: false,
  },
  {
    feature: "Sem paradas no trajeto",
    multitrip: true,
    apps: true,
    shared: false,
  },
  {
    feature: "Pagamento parcelado em 4x sem juros",
    multitrip: true,
    apps: false,
    shared: false,
  },
  {
    feature: "Atendimento humano 24h pelo WhatsApp",
    multitrip: true,
    apps: false,
    shared: "Limitado",
  },
  {
    feature: "Cancela com mais de 24h sem custo",
    multitrip: true,
    apps: "Varia",
    shared: "Varia",
  },
  {
    feature: "Rota Romântica com paradas fotográficas",
    multitrip: true,
    apps: false,
    shared: false,
  },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return <span className="text-emerald-400 font-bold text-lg">✓</span>;
  }
  if (value === false) {
    return <span className="text-white/25 font-bold text-lg">✗</span>;
  }
  return <span className="text-white/55 text-sm">{value}</span>;
}

export function ComparisonSection() {
  return (
    <Section className="py-20 px-4 md:px-6 border-t border-white/5">
      <Container className="max-w-5xl">
        <FadeUp>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="chip bg-[color:var(--mt-gold)]/10 border-[color:var(--mt-gold)]/40 text-[color:var(--mt-gold)] mb-4 inline-block font-semibold tracking-wider uppercase text-xs">
              Comparativo
            </span>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4 text-white">
              Por que a Multi Trip e não outra opção?
            </h2>
            <p className="text-base text-white/65 leading-relaxed">
              Antes de decidir, compare. O preço de um aplicativo pode parecer menor — até você
              lembrar que precisa de cadeirinha, o motorista some, ou o voo atrasa.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={100}>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 md:p-5 text-white/50 font-medium w-1/2">
                    O que importa na prática
                  </th>
                  <th className="p-4 md:p-5 text-center">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span className="text-[color:var(--mt-gold)] font-bold text-sm md:text-base">
                        Multi Trip
                      </span>
                      <span className="text-[8px] md:text-[10px] text-[color:var(--mt-gold)]/70 uppercase tracking-wider font-semibold">
                        Transfer Privativo
                      </span>
                    </div>
                  </th>
                  <th className="p-4 md:p-5 text-center text-white/40 font-medium text-xs md:text-sm">
                    Aplicativos
                  </th>
                  <th className="p-4 md:p-5 text-center text-white/40 font-medium text-xs md:text-sm">
                    Van Compartilhada
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-white/5 last:border-0 ${
                      i % 2 === 0 ? "bg-white/[0.02]" : ""
                    }`}
                  >
                    <td className="p-4 md:p-5 text-white/75 text-xs md:text-sm leading-relaxed">
                      {row.feature}
                    </td>
                    <td className="p-4 md:p-5 text-center bg-[color:var(--mt-gold)]/[0.04]">
                      <Cell value={row.multitrip} />
                    </td>
                    <td className="p-4 md:p-5 text-center">
                      <Cell value={row.apps} />
                    </td>
                    <td className="p-4 md:p-5 text-center">
                      <Cell value={row.shared} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeUp>

        <FadeUp delay={200}>
          <p className="mt-6 text-center text-xs text-white/35 leading-relaxed">
            Comparativo baseado em características gerais das categorias. Resultados individuais
            podem variar por operador.
          </p>
        </FadeUp>
      </Container>
    </Section>
  );
}
