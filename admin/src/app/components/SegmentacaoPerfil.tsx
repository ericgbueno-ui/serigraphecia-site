"use client";

import { useRouter } from "next/navigation";

const PERFIS = [
  {
    id: "primeira-vez",
    titulo: "Primeira vez em Gramado",
    sub: "Chegada tranquila do início ao fim",
    desc: "Perfeito para quem quer começar com organização, conforto e um atendimento que guia cada passo.",
    icone: "✨",
    veiculo: "sedan",
    cor: "#4a90d9",
    fundo: "#f0f6fd",
  },
  {
    id: "casal",
    titulo: "Viagem romântica",
    sub: "Para casais que querem uma chegada especial",
    desc: "Inclua a Rota Romântica e transforme o trajeto em uma primeira memória marcante da viagem.",
    icone: "🌹",
    veiculo: "executivo",
    cor: "#B8882A",
    fundo: "#fffbf2",
    destaque: true,
  },
  {
    id: "familia",
    titulo: "Família com crianças",
    sub: "Famílias ou grupos com até 6 pessoas",
    desc: "A Spin 6 Lugares garante espaço de sobra para malas, carrinhos e toda a tranquilidade da família ou do grupo.",
    icone: "👨‍👩‍👧‍👦",
    veiculo: "spin",
    veiculoLabel: "Spin 6 Lugares",
    cor: "#2a9d5c",
    fundo: "#f0faf4",
  },
  {
    id: "executivo",
    titulo: "Executivo / Corporativo",
    sub: "Pontualidade e discrição",
    desc: "Ideal para viagens de trabalho, eventos e deslocamentos em que a agenda precisa fluir sem ruído.",
    icone: "💼",
    veiculo: "suv",
    cor: "#333",
    fundo: "#f5f5f5",
  },
];

export function SegmentacaoPerfil() {
  const router = useRouter();

  return (
    <section className="py-20 px-6 bg-white">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--mt-gold)]">
            Para quem é a viagem?
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-[#171717] md:text-4xl">
            Cada viajante entra em um caminho diferente
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-neutral-600 md:text-base">
            Escolha o perfil que mais combina com a sua reserva e avance direto para o checkout já
            com a sugestão certa.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PERFIS.map((perfil) => (
            <button
              key={perfil.id}
              type="button"
              onClick={() =>
                router.push(
                  `/checkout?perfil=${perfil.id}&pax=${perfil.veiculo}&fromWidget=1${perfil.id === "casal" ? "&addon=rota-romantica" : ""}`
                )
              }
              className={`group relative overflow-hidden rounded-[1.25rem] border p-6 text-left transition hover:-translate-y-1 ${perfil.destaque ? "pt-10" : ""}`}
              style={{
                borderColor: perfil.destaque ? perfil.cor : "#eae8e3",
                background: perfil.fundo,
              }}
            >
              {perfil.destaque ? (
                <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[color:var(--mt-gold)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-sm">
                  Mais reservado
                </div>
              ) : null}
              <div className="mb-4 text-4xl">{perfil.icone}</div>
              <h3 className="text-base font-bold text-[#171717]">{perfil.titulo}</h3>
              <p className="mt-1 text-sm font-semibold" style={{ color: perfil.cor }}>
                {perfil.sub}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">{perfil.desc}</p>
              <div className="mt-5 text-xs text-neutral-500">
                Recomendado:{" "}
                <strong className="text-neutral-700">
                  {perfil.veiculoLabel ?? perfil.veiculo}
                </strong>
              </div>
              <div
                className="mt-5 inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition group-hover:brightness-105"
                style={{ background: perfil.cor }}
              >
                Quero seguir com este perfil →
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
