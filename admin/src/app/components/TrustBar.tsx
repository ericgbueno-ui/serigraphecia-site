import Image from "next/image";

export function TrustBar() {
  return (
    <div className="w-full bg-white/5 backdrop-blur-md border-y border-white/10 relative z-10 overflow-hidden">
      {/* Mobile — compacto em 2 colunas */}
      <div className="flex md:hidden flex-wrap items-center justify-center gap-x-5 gap-y-3 py-4 px-4">
        <div className="flex items-center gap-1.5 text-xs text-white/70">
          <Image
            src="/brand/cadastur.webp"
            alt="CADASTUR"
            width={80}
            height={18}
            className="h-[18px] w-auto"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/70">
          <Image
            src="/brand/mp.webp"
            alt="Mercado Pago"
            width={60}
            height={16}
            className="h-4 w-auto"
          />
          <span className="font-medium">Pagamento seguro</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-white/70">
          <span className="text-[color:var(--mt-gold)]">★★★★★</span>
          <span className="font-medium">4.9 Google</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/70">
          <Image
            src="/brand/diversidade.webp"
            alt="LGBTQIA+ Safe"
            width={50}
            height={18}
            className="h-[18px] w-auto"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/70">
          <Image
            src="/brand/autismo.webp"
            alt="Autism Friendly"
            width={50}
            height={18}
            className="h-[18px] w-auto"
          />
        </div>
      </div>

      {/* Desktop — linha única */}
      <div className="hidden md:flex items-center justify-center gap-8 py-4 px-6">
        <div className="flex items-center gap-2 text-sm text-white/70 opacity-80 hover:opacity-100 transition-opacity">
          <Image
            src="/brand/cadastur.webp"
            alt="CADASTUR"
            width={120}
            height={24}
            className="h-6 w-auto drop-shadow-md"
          />
        </div>
        <div className="w-px h-5 bg-white/10" />
        <div className="flex items-center gap-2 text-sm text-white/70 opacity-80 hover:opacity-100 transition-opacity">
          <Image
            src="/brand/mp.webp"
            alt="Mercado Pago"
            width={80}
            height={20}
            className="h-5 w-auto"
          />
          <span className="font-medium tracking-wide">Pagamento seguro</span>
        </div>
        <div className="w-px h-5 bg-white/10" />
        <div className="flex items-center gap-2 text-sm text-white/70 hover:text-[color:var(--mt-gold)] transition-colors opacity-90 hover:opacity-100">
          <a
            href="https://maps.app.goo.gl/hrZoMjKwuAuKEDDQ9"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5"
          >
            <span className="text-[color:var(--mt-gold)] text-lg mb-0.5">★★★★★</span>
            <span className="font-medium tracking-wide">4.9 · 128 avaliações no Google</span>
          </a>
        </div>
        <div className="w-px h-5 bg-white/10" />
        <div className="flex items-center gap-2 text-sm text-white/70 opacity-80 hover:opacity-100 transition-opacity">
          <Image
            src="/brand/diversidade.webp"
            alt="LGBTQIA+ Safe"
            width={80}
            height={24}
            className="h-6 w-auto"
          />
        </div>
        <div className="w-px h-5 bg-white/10" />
        <div className="flex items-center gap-2 text-sm text-white/70 opacity-80 hover:opacity-100 transition-opacity">
          <Image
            src="/brand/autismo.webp"
            alt="Autism Friendly"
            width={80}
            height={24}
            className="h-6 w-auto"
          />
        </div>
      </div>
    </div>
  );
}
