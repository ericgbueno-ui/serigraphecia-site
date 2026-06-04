"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
      <div className="text-5xl">🧭</div>
      <h1 className="mt-4 text-2xl font-semibold text-white">Um pequeno desvio de rota</h1>
      <p className="mt-3 text-white/70">
        Parece que o destino que você procurava foi movido. Nosso concierge está à disposição para
        reconduzi-lo à jornada correta.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/transfer/porto-alegre-gramado" className="btn-primary justify-center">
          Quero garantir minha data
        </Link>
        <Link href="/transfer/porto-alegre-gramado" className="btn-ghost justify-center">
          Quero escolher minha categoria
        </Link>
      </div>

      <p className="mt-6 text-xs text-white/50">
        Se precisar de assistência imediata, sinta-se à vontade para nos chamar no WhatsApp.
      </p>
    </section>
  );
}
