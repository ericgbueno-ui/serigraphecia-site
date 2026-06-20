"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { trackLeadCapture } from "@/lib/tracking";

const DISMISS_KEY = "mt_lead_dismiss_until";
const SEEN_KEY = "mt_lead_seen";
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

export function LeadMagnetPopup() {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || "0");
    if (dismissedUntil && Date.now() < dismissedUntil) return;
    if (sessionStorage.getItem(SEEN_KEY)) return;

    let opened = false;
    const openPopup = () => {
      if (opened) return;
      if (sessionStorage.getItem(SEEN_KEY)) return;
      opened = true;
      sessionStorage.setItem(SEEN_KEY, "1");
      setVisible(true);
    };

    const isMobile = window.innerWidth < 768;
    const timer = window.setTimeout(() => {
      if (!isMobile) openPopup();
    }, 8000);

    const handleScroll = () => {
      const total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = window.scrollY / total;
      if (progress > 0.5) {
        openPopup();
        window.removeEventListener("scroll", handleScroll);
      }
    };

    if (isMobile) window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Esconde o popup completamente na página de links
  if (pathname?.startsWith("/links")) {
    return null;
  }

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setStatus("loading");
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    const [firstName, ...rest] = name.trim().split(" ");
    trackLeadCapture("popup_lead_magnet", {
      email,
      firstName,
      lastName: rest.join(" ") || undefined,
    });
    setStatus("success");
    window.setTimeout(() => dismiss(), 2200);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[color:var(--mt-gold)]/30 bg-[#130b05] shadow-[0_0_50px_rgba(212,175,55,0.16)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[color:var(--mt-gold)] via-[#f6d28a] to-[color:var(--mt-gold)]" />

        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar oferta"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          x
        </button>

        <div className="relative p-7 md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,169,74,0.14),transparent_55%)]" />

          <div className="relative z-10">
            <span className="mb-4 inline-flex rounded-full border border-[color:var(--mt-gold)]/40 bg-[color:var(--mt-gold)]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--mt-gold)]">
              Condição especial
            </span>

            <h2 className="max-w-md text-2xl font-semibold leading-tight text-white md:text-3xl">
              Sua viagem a Gramado pode começar com uma condição melhor.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Entre para a nossa lista e receba novidades da Serra Gaúcha, condição especial e
              sugestões que ajudam a fechar com mais clareza.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-white/80">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[color:var(--mt-gold)]">•</span>
                Sugestões de roteiros e experiências para a Serra Gaúcha
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[color:var(--mt-gold)]">•</span>
                Oferta especial para a primeira reserva
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-[color:var(--mt-gold)]">•</span>
                Atendimento direto com a Jolie
              </li>
            </ul>

            {status === "success" ? (
              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center">
                <div className="text-2xl">✓</div>
                <h3 className="mt-2 text-base font-semibold text-emerald-300">
                  Perfeito, {name.split(" ")[0]}!
                </h3>
                <p className="mt-1 text-xs text-emerald-100/70">
                  Sua condição especial vai chegar no e-mail informado em instantes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Como prefere ser chamado?"
                  autoComplete="given-name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[color:var(--mt-gold)]/50 focus:bg-white/10"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Seu melhor e-mail"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[color:var(--mt-gold)]/50 focus:bg-white/10"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full rounded-xl bg-[color:var(--mt-gold)] px-4 py-3.5 text-sm font-bold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "loading" ? "Enviando..." : "Quero receber minha condição especial"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
