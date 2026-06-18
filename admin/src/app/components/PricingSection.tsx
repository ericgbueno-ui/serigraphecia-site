import Link from "next/link";
import Image from "next/image";
import { Section } from "@/app/components/ui/SectionLayout";
import { Container } from "@/app/components/ui/ContainerLayout";
import { FadeUp } from "@/app/components/ui/FadeUp";
import { SITE, waLink } from "@/lib/site";
import { calcularTransfer, brl } from "@/lib/pricing";

// Número direto da Rita e Eric — para categorias executivas (consulta humana direta)
const WHATS_ERIC_RITA = "5551986876557";

export function PricingSection() {
  // Pricing calculations disabled in consolidated admin.
  const executivoWaLink = waLink(
    "Olá! 👋 Tenho interesse em uma categoria Executiva / SUV / SUV Elétrico. Podem me passar disponibilidade e valores?",
    WHATS_ERIC_RITA
  );

  // Stub values — all prices disabled, direct users to WhatsApp
  const sedanPix = 0;
  const sedanCartao = 0;
  const vanPix = 0;
  const vanCartao = 0;
  const execPix = 0;
  const execCartao = 0;

  return (
    <Section className="py-20 px-6 bg-black/20 border-y border-white/5" id="valores">
      <Container className="max-w-6xl">
        <FadeUp>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-white">
              Escolha a categoria ideal para sua viagem
            </h2>
            <p className="text-lg text-white/70 mb-4">
              Compare os valores e siga para a reserva com clareza.
            </p>
            <p className="text-sm text-white/50">
              Para informações sobre valores e formas de pagamento,{" "}
              <span className="text-[color:var(--mt-gold)] font-semibold">
                contate nossa equipe via WhatsApp.
              </span>
            </p>
          </div>
        </FadeUp>

        {/* EMPILHAMENTO DE BENEFÍCIOS (REGRA DE CONVERSÃO) */}
        <FadeUp delay={100}>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="card-soft p-5 border-t-2 border-[color:var(--mt-gold)]/40 flex items-start gap-4">
              <span className="text-[color:var(--mt-gold)] text-2xl">✈️</span>
              <div>
                <h4 className="font-semibold text-white mb-1">Pontualidade monitorada</h4>
                <p className="text-sm text-white/70">
                  Monitoramento do seu voo em tempo real e até 60 minutos de espera cortesia a
                  partir do horário previamente combinado.
                </p>
              </div>
            </div>
            <div className="card-soft p-5 border-t-2 border-[color:var(--mt-gold)]/40 flex items-start gap-4">
              <span className="text-[color:var(--mt-gold)] text-2xl">🛡️</span>
              <div>
                <h4 className="font-semibold text-white mb-1">Categoria executiva</h4>
                <p className="text-sm text-white/70">
                  Veículos de padrão executivo inteiramente dedicados a você e sua família. Sem
                  filas ou surpresas.
                </p>
              </div>
            </div>
            <div className="card-soft p-5 border-t-2 border-[color:var(--mt-gold)]/40 flex items-start gap-4">
              <span className="text-[color:var(--mt-gold)] text-2xl">💳</span>
              <div>
                <h4 className="font-semibold text-white mb-1">Pagamento facilitado</h4>
                <p className="text-sm text-white/70">
                  No Pix, você paga <strong className="text-white">50% na reserva</strong> e os
                  outros <strong className="text-white">50% no check-in</strong>. Ou parcelado em
                  até 4x sem juros no cartão.
                </p>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* TABELA DE INVESTIMENTO */}
        <FadeUp delay={200}>
          <div className="grid lg:grid-cols-3 gap-6 items-center">
            {/* DESTAQUE: SEDAN PREMIUM */}
            <div className="card p-8 flex flex-col h-full border-2 border-[color:var(--mt-gold)] bg-gradient-to-b from-[color:var(--mt-gold)]/10 to-transparent relative transform lg:-translate-y-4 shadow-2xl shadow-[color:var(--mt-gold)]/10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[color:var(--mt-gold)] text-black text-xs font-bold px-4 py-1 rounded-b-lg tracking-wider uppercase whitespace-nowrap">
                Mais escolhida
              </div>
              <div className="mb-6 mt-4">
                <div className="relative h-44 w-full mb-5 rounded-xl overflow-hidden border border-white/10 bg-white/5 shadow-lg">
                  <Image
                    src="/photos/veiculos/sedan.webp"
                    alt="Sedan Premium"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white border border-white/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    ⚡ Reserva Direta
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Sedan Premium</h3>
                <p className="text-sm text-white/60">Conforto e discrição para até 4 pessoas.</p>
              </div>
              <div className="mb-8 space-y-4 flex-1">
                <div className="bg-white/10 rounded-xl p-4 border border-[color:var(--mt-gold)]/30">
                  <p className="text-[10px] text-[color:var(--mt-gold)] uppercase tracking-wider mb-1 font-semibold">
                    Chegada In + Retorno Out (Aeroporto ↔ Serra)
                  </p>
                  {/* Âncora de preço — cartão riscado */}
                  <p className="text-xs text-white/40 line-through mb-0.5">
                    {brl(sedanCartao)} no cartão
                  </p>
                  <p className="text-4xl font-bold text-emerald-400">{brl(sedanPix)} PIX</p>
                  <p className="text-xs text-emerald-400/80 font-semibold mt-0.5">
                    Você economiza {brl(sedanCartao - sedanPix)} pagando no PIX
                  </p>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-white/50 font-medium">
                      💡 <strong className="text-white/70">PIX:</strong> 50% agora (
                      {brl(sedanPix / 2)}) + 50% no embarque
                    </p>
                    <p className="text-xs text-white/50 mt-1">
                      💳 <strong className="text-white/70">Cartão:</strong> 4x de{" "}
                      {brl(sedanCartao / 4)} sem juros
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/checkout?routeId=poa_gramado&pax=sedan&fromWidget=1"
                className="btn-primary w-full flex items-center justify-center py-4 text-lg shadow-lg shadow-[color:var(--mt-gold)]/25"
              >
                Garantir experiência
              </Link>
            </div>

            {/* SPIN 6 LUGARES */}
            <div className="card p-8 flex flex-col h-full border border-white/10 hover:border-white/30 transition-colors">
              <div className="mb-6">
                <div className="relative h-40 w-full mb-5 rounded-xl overflow-hidden border border-white/5 bg-white/5 shadow-md">
                  <Image
                    src="/photos/veiculos/spin.webp"
                    alt="Spin 6 Lugares"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white border border-white/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    ⚡ Reserva Direta
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Spin 6 Lugares</h3>
                <p className="text-sm text-white/60">
                  Espaço ideal para famílias ou grupos de até 6 pessoas.
                </p>
              </div>
              <div className="mb-8 space-y-4 flex-1">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-[color:var(--mt-gold)] uppercase tracking-wider mb-1 font-semibold">
                    Chegada In + Retorno Out (Aeroporto ↔ Serra)
                  </p>
                  <p className="text-xs text-white/40 line-through mb-0.5">
                    {brl(vanCartao)} no cartão
                  </p>
                  <p className="text-3xl font-bold text-emerald-400">{brl(vanPix)} PIX</p>
                  <p className="text-xs text-emerald-400/80 font-semibold mt-0.5">
                    Você economiza {brl(vanCartao - vanPix)} pagando no PIX
                  </p>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-[11px] text-white/50 font-medium">
                      💡 <strong className="text-white/70">PIX:</strong> 50% agora + 50% no embarque
                    </p>
                    <p className="text-[11px] text-white/50 mt-1">
                      💳 <strong className="text-white/70">Cartão:</strong> 4x de{" "}
                      {brl(vanCartao / 4)} sem juros
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/checkout?routeId=poa_gramado&pax=van&fromWidget=1"
                className="btn-secondary w-full flex items-center justify-center py-3"
              >
                Garantir experiência
              </Link>
            </div>

            {/* SEDAN EXECUTIVO / SUV */}
            <div className="card p-8 flex flex-col h-full border border-white/10 hover:border-white/30 transition-colors">
              <div className="mb-6">
                <div className="relative h-40 w-full mb-5 rounded-xl overflow-hidden border border-white/5 bg-white/5 shadow-md">
                  <Image
                    src="/photos/veiculos/executivo.webp"
                    alt="Sedan Executivo ou SUV"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute top-3 right-3 bg-[#25D366]/20 backdrop-blur-md text-[#25D366] border border-[#25D366]/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    💬 Via WhatsApp
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Sedan Executivo / SUV / SUV Elétrico
                </h3>
                <p className="text-sm text-white/60">
                  Mais espaço, mais conforto e padrão executivo para sua jornada.
                </p>
              </div>
              <div className="mb-8 space-y-4 flex-1">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-[10px] text-[color:var(--mt-gold)] uppercase tracking-wider mb-1 font-semibold">
                    Chegada In + Retorno Out (Aeroporto ↔ Serra)
                  </p>
                  <p className="text-xs text-white/40 line-through mb-0.5">
                    {brl(execCartao)} no cartão
                  </p>
                  <p className="text-3xl font-bold text-emerald-400">{brl(execPix)} PIX</p>
                  <p className="text-xs text-emerald-400/80 font-semibold mt-0.5">
                    Você economiza {brl(execCartao - execPix)} pagando no PIX
                  </p>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-[11px] text-white/50 font-medium">
                      💡 A Jolie coleta seus dados e envia para a Rita e o Eric organizarem a agenda
                    </p>
                    <p className="text-[11px] text-white/50 mt-1">
                      💳 <strong className="text-white/70">Cartão:</strong> 4x de{" "}
                      {brl(execCartao / 4)} sem juros
                    </p>
                  </div>
                </div>
              </div>
              <a
                href={executivoWaLink}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary w-full flex items-center justify-center py-3"
              >
                Consultar no WhatsApp
              </a>
            </div>
          </div>
        </FadeUp>

        {/* SOMENTE IDA */}
        <FadeUp delay={250}>
          <div className="mt-8 p-5 rounded-2xl border border-[color:var(--mt-gold)]/20 bg-[color:var(--mt-gold)]/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-start gap-3">
              <span className="text-[color:var(--mt-gold)] text-2xl shrink-0">✈️</span>
              <div>
                <p className="text-white font-semibold text-sm mb-0.5">
                  Precisa só da chegada ou só do retorno?
                </p>
                <p className="text-white/60 text-sm">
                  Contrate somente um trecho.{" "}
                  <span className="text-[color:var(--mt-gold)] font-semibold">
                    Sedan Premium a partir de {brl(sedanPix / 2)} no PIX
                  </span>{" "}
                  — mesmo padrão, metade da viagem.
                </p>
              </div>
            </div>
            <Link
              href="/checkout?routeId=poa_gramado&pax=sedan&fromWidget=1"
              className="shrink-0 whitespace-nowrap text-sm font-bold px-5 py-2.5 rounded-xl border border-[color:var(--mt-gold)]/40 text-[color:var(--mt-gold)] hover:bg-[color:var(--mt-gold)]/10 transition-colors"
            >
              Ver opções de somente ida →
            </Link>
          </div>
        </FadeUp>

        {/* AVISOS DE ESCASSEZ E CONFIANÇA */}
        <FadeUp delay={300}>
          <div className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row gap-6 items-center justify-between text-sm text-white/60">
            <div className="space-y-3">
              <p className="flex items-start gap-2">
                <span className="text-[color:var(--mt-gold)] shrink-0 mt-0.5">✓</span>
                <span>
                  <strong>Exclusividade Garantida:</strong> Os investimentos acima representam a
                  reserva integral para os trajetos de <strong>Chegada In + Retorno Out</strong>{" "}
                  (Aeroporto ↔ Gramado/Canela). O veículo é inteiramente dedicado à sua família.
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-[color:var(--mt-gold)] shrink-0 mt-0.5">✓</span>
                <span>
                  <strong>Sobre a frota:</strong> Você assegura o padrão da categoria escolhida. O
                  modelo exato do veículo é designado conforme a disponibilidade da nossa agenda
                  exclusiva no dia.
                </span>
              </p>
            </div>
            <div className="shrink-0 text-center md:text-right">
              <span className="inline-block px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold border border-red-500/20 mb-2 tracking-wide">
                ⚠️ Agenda Exclusiva
              </span>
              <p>
                Nossa frota é limitada. Garanta seu
                <br className="hidden md:block" /> veículo com antecedência.
              </p>
            </div>
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}
