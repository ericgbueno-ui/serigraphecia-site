import Link from "next/link";
import { SITE, waLink } from "@/lib/site";
import { WhatsLink } from "./WhatsLink";
import { FadeUp } from "@/app/components/ui/FadeUp";

const STEPS = [
  {
    num: "01",
    icon: "🚗",
    title: "Escolha o veículo ideal",
    description:
      "Sedan para até 4 pessoas, Spin para famílias maiores. Se quiser, adicione a Rota Romântica — a entrada mais bonita para a Serra Gaúcha.",
  },
  {
    num: "02",
    icon: "📋",
    title: "Preencha os dados da viagem",
    description:
      "Data, horário do voo, endereço de destino. Leva menos de 2 minutos e nos permite preparar tudo sem perguntas de última hora.",
  },
  {
    num: "03",
    icon: "💳",
    title: "Escolha como pagar",
    description:
      "PIX com 50% na reserva e 50% no embarque, ou cartão em até 4x sem juros. Confirmação instantânea assim que o pagamento é processado.",
  },
  {
    num: "04",
    icon: "✅",
    title: "Relaxa — está feito",
    description:
      "Você recebe a confirmação. No dia, monitoramos seu voo e o motorista estará lá. Qualquer dúvida, a Jolie responde em minutos pelo WhatsApp.",
  },
] as const;

type HowItWorksSectionProps = {
  whatsMessage: string;
};

export function HowItWorksSection({ whatsMessage }: HowItWorksSectionProps) {
  return (
    <section className="card p-6 md:p-10">
      <FadeUp>
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Como funciona — do site ao desembarque
          </h2>
          <p className="text-white/60 text-sm md:text-base max-w-2xl">
            Quatro passos simples. Você cuida da viagem, a gente cuida do transfer.
          </p>
        </div>
      </FadeUp>

      <div className="grid gap-5 md:grid-cols-4">
        {STEPS.map((step, i) => (
          <FadeUp key={step.num} delay={i * 100}>
            <div className="card-soft p-6 h-full relative overflow-hidden group hover:border-[color:var(--mt-gold)]/40 transition-colors border border-white/10">
              {/* Número em background decorativo */}
              <div className="absolute -top-3 -right-2 text-[80px] font-black text-white/[0.03] leading-none select-none pointer-events-none">
                {step.num}
              </div>
              <div className="relative">
                <div className="text-2xl mb-3">{step.icon}</div>
                <div className="text-[10px] font-bold text-[color:var(--mt-gold)] uppercase tracking-[0.2em] mb-2">
                  Passo {step.num}
                </div>
                <h3 className="text-base font-bold text-white mb-3 leading-snug">{step.title}</h3>
                <p className="text-sm text-white/65 leading-relaxed">{step.description}</p>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>

      <FadeUp delay={400}>
        <div className="mt-8 flex flex-wrap gap-3 items-center">
          <Link href="/transfer/porto-alegre-gramado" className="btn-primary">
            Começar minha reserva
          </Link>
          <WhatsLink
            className="inline-flex rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white/30 hover:opacity-90"
            href={waLink(whatsMessage, SITE.whatsE164)}
            variant="image"
            iconSrc="/brand/chama-whatsapp.webp"
            iconOnly
            srLabel="Tire minhas dúvidas com a Jolie, nossa concierge"
            title="Tire minhas dúvidas com a Jolie, nossa concierge"
          />
          <span className="text-xs text-white/40 ml-1">
            Alguma dúvida? A Jolie responde em minutos.
          </span>
        </div>
      </FadeUp>
    </section>
  );
}
