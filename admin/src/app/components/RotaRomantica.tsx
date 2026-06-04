"use client";

import Link from "next/link";

const PARADAS = [
  {
    nome: "Parque Histórico Municipal Jorge Kuhn",
    desc: "Arquitetura de enxaimel, história e fotos com clima de interior europeu.",
    tempo: "~20 min",
    dica: "Luz linda pela manhã",
    icone: "🏛️",
  },
  {
    nome: "Mirante da Torre",
    desc: "Uma vista panorâmica que deixa a chegada ainda mais memorável.",
    tempo: "~25 min",
    dica: "Melhor em dia aberto",
    icone: "🌄",
  },
  {
    nome: "Labirinto Verde",
    desc: "Uma parada leve e divertida no coração da experiência.",
    tempo: "~20 min",
    dica: "Ótimo para famílias e casais",
    icone: "🌿",
  },
];

export function RotaRomantica() {
  return (
    <section
      className="relative isolate overflow-hidden px-6 py-20"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(26, 10, 0, 0.88) 0%, rgba(45, 21, 0, 0.72) 50%, rgba(26, 10, 0, 0.92) 100%), url('/photos/serra/rota-romantica.webp')",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-black/15" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--mt-gold)]">
            Add-on exclusivo
          </p>
          <h2 
            className="text-3xl font-bold tracking-tight text-[color:var(--mt-gold)] md:text-4xl"
            style={{ textShadow: "0 0 20px rgba(212,169,74,0.6), 0 0 40px rgba(212,169,74,0.3)" }}
          >
            Rota Romântica
          </h2>
          <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-2 bg-[color:var(--mt-gold)]/15 border border-[color:var(--mt-gold)]/40 px-5 py-2.5 rounded-full text-[color:var(--mt-gold)] font-bold text-xl tracking-tight">
              + R$ 190,90
            </span>
            <span className="text-sm text-white/45">add-on por trajeto</span>
          </div>
          <p className="mt-4 text-base leading-relaxed text-white/80 md:text-lg font-light">
            O caminho mais charmoso entre Porto Alegre e Gramado. São cerca de 125 km pela BR-116 e
            RS-235 — túneis verdes de plátanos, arquitetura alemã centenária e paisagens da Serra
            Gaúcha que transformam o deslocamento em parte da experiência.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            O trajeto passa por Nova Petrópolis, Dois Irmãos e Picada Café, com três paradas
            selecionadas para contemplação e fotos.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PARADAS.map((parada) => (
            <div
              key={parada.nome}
              className="rounded-[1.25rem] border border-[rgba(212,169,74,.25)] bg-white/12 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-sm"
            >
              <div className="mb-4 text-3xl">{parada.icone}</div>
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="text-sm font-bold text-white">{parada.nome}</h3>
                <span className="shrink-0 rounded-full bg-[rgba(212,169,74,.16)] px-2.5 py-1 text-[10px] font-semibold text-[color:var(--mt-gold)]">
                  {parada.tempo}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-white/65">{parada.desc}</p>
              <p className="mt-4 text-xs italic text-[color:var(--mt-gold)]">✦ {parada.dica}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <div className="card border border-[color:var(--mt-gold)]/30 bg-gradient-to-r from-black/80 to-[color:var(--mt-gold)]/10 p-8 md:p-10 rounded-3xl flex flex-col lg:flex-row items-center justify-between gap-8 shadow-[0_15px_40px_rgba(0,0,0,0.4)] backdrop-blur-md">
            <div className="text-center lg:text-left">
              <h4 className="text-xl font-semibold text-white mb-2">
                Adicione esta experiência à sua reserva
              </h4>
              <div className="flex flex-col sm:flex-row items-center lg:items-end gap-2 lg:gap-3 mb-3">
                <span className="text-4xl font-bold text-[color:var(--mt-gold)]">
                  R$ 190,90
                </span>
                <span className="text-sm text-white/60 mb-1">
                  / acréscimo único ao valor da categoria escolhida
                </span>
              </div>
            </div>
            <div className="shrink-0 w-full lg:w-auto">
              <Link
                href="/checkout?addon=romantica"
                className="group relative overflow-hidden btn-primary w-full flex items-center justify-center px-10 py-5 text-lg font-bold shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="relative z-10">Quero adicionar à minha reserva</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
