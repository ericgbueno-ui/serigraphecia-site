import { FadeUp } from "@/app/components/ui/FadeUp";

const STATS = [
  {
    value: "+1000",
    label: "Transferes realizados",
    sub: "na Serra Gaúcha",
  },
  {
    value: "4.9★",
    label: "Nota no Google",
    sub: "mais de 128 avaliações",
  },
  {
    value: "24/7",
    label: "Disponibilidade",
    sub: "todos os dias do ano",
  },
  {
    value: "+10",
    label: "Anos de experiência",
    sub: "em hospitalidade e turismo",
  },
];

export function StatsSection() {
  return (
    <FadeUp>
      <div className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-10 md:py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {STATS.map((stat) => (
              <div key={stat.value} className="text-center">
                <p className="font-display text-4xl md:text-5xl font-bold text-[color:var(--mt-gold)] leading-none mb-2">
                  {stat.value}
                </p>
                <p className="text-sm font-semibold text-white mb-0.5">{stat.label}</p>
                <p className="text-xs text-white/45">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FadeUp>
  );
}
