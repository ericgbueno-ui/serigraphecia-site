"use client";

import Link from "next/link";
import Image from "next/image";
import { SITE, waLink } from "@/lib/site";
import { addAffiliateRefToWhatsHref } from "@/lib/attribution";

const NAV_LINKS = [
  { label: "Principal", href: "/" },
  { label: "Roteiros", href: "/roteiros" },
  { label: "Rotas", href: "/transfer" },
  { label: "Quem Somos", href: "/quem-somos" },
  { label: "Perguntas Frequentes", href: "/faq" },
] as const;

export function Header() {
  const waHref = addAffiliateRefToWhatsHref(
    waLink(
      "Olá, Jolie! Estou no site da Multi Trip e gostaria de organizar meu transfer para a Serra Gaúcha. 🤎",
      SITE.whatsE164
    )
  );

  return (
    <header
      className="sticky top-0 z-50 transition-all"
      style={{
        background: "rgba(8,11,16,0.82)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(236,238,242,0.07)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4 md:h-20">
          <Link
            href="/"
            className="flex-shrink-0 transition-opacity hover:opacity-80"
            aria-label="Página inicial"
            onClick={(e) => {
              if (window.location.pathname === "/") {
                e.preventDefault();
              }
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <Image
              src="/brand/logo-horizontal.webp"
              alt="Multi Trip Receptivo e Viagens"
              width={560}
              height={160}
              priority
              className="h-9 w-auto md:h-12"
            />
          </Link>

          <div className="flex items-center gap-2 md:gap-3">
            <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 lg:flex">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap text-[color:var(--muted)] transition-colors hover:text-white"
                  onClick={(e) => {
                    if (window.location.pathname === item.href) {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp Multi Trip"
              className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-[#25d366] transition-all duration-200 hover:border-emerald-500/40 hover:bg-emerald-500/15"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="hidden md:inline text-sm font-semibold">(51) 98912-9376</span>
            </a>

            <Link href="/transfer" className="btn-primary px-4 py-2.5 text-sm md:px-5">
              Reservar
            </Link>
          </div>
        </div>

        {/* Mobile Horizontal Sub-Navigation Bar */}
        <div 
          className="flex lg:hidden overflow-x-auto gap-2 pb-3.5 pt-1.5 border-t border-white/[0.04] scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {NAV_LINKS.map((item) => {
            const isRoteiros = item.href === "/roteiros";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold whitespace-nowrap transition-all duration-150 ${
                  isRoteiros
                    ? "bg-[color:var(--mt-gold)]/20 border border-[color:var(--mt-gold)]/30 text-[color:var(--mt-gold)] hover:bg-[color:var(--mt-gold)]/30 hover:border-[color:var(--mt-gold)]/50 shadow-[0_0_12px_rgba(201,168,76,0.1)]"
                    : "bg-white/5 border border-white/5 text-[color:var(--muted)] hover:bg-white/10 hover:text-white"
                }`}
                onClick={(e) => {
                  if (window.location.pathname === item.href) {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              >
                {isRoteiros ? "✨ Roteiros Jolie" : item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
