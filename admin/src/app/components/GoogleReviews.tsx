"use client";

import { useEffect, useMemo, useState } from "react";
import { SITE } from "@/lib/site";

type GoogleReview = {
  author_name?: string;
  profile_photo_url?: string;
  rating?: number;
  relative_time_description?: string;
  text?: string;
};

type GoogleReviewsPayload =
  | {
      ok: true;
      name?: string;
      rating?: number;
      user_ratings_total?: number;
      reviews: GoogleReview[];
    }
  | {
      ok: false;
      error: string;
      status?: string;
    };

function Stars({ rating = 0 }: { rating?: number }) {
  const full = Math.max(0, Math.min(5, Math.floor(rating)));
  const empty = Math.max(0, 5 - full);
  return (
    <span aria-label={`Nota ${rating.toFixed(1)} de 5`} className="text-[--mt-gold]">
      {"★".repeat(full)}
      <span className="text-white/25">{"★".repeat(empty)}</span>
    </span>
  );
}

function ReviewCard({ r }: { r: GoogleReview }) {
  return (
    <div className="card-soft p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{r.author_name || "Cliente"}</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-white/65">
            <Stars rating={r.rating || 0} />
            {r.relative_time_description ? <span>• {r.relative_time_description}</span> : null}
          </div>
        </div>

        {r.profile_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.profile_photo_url}
            alt=""
            className="h-10 w-10 rounded-full border border-white/10 object-cover"
            loading="lazy"
          />
        ) : null}
      </div>

      <p className="mt-4 line-clamp-5 text-sm text-white/75">{r.text || ""}</p>
    </div>
  );
}

export function GoogleReviewsSection() {
  const [payload, setPayload] = useState<GoogleReviewsPayload | null>(null);
  const [start, setStart] = useState(0);
  const [pageSize, setPageSize] = useState(3);

  useEffect(() => {
    const onResize = () => {
      setPageSize(window.innerWidth < 768 ? 1 : 3);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/google/reviews", { cache: "no-store" });
        const data = (await res.json()) as GoogleReviewsPayload;
        if (!cancelled) setPayload(data);
      } catch (e) {
        if (!cancelled)
          setPayload({ ok: false, error: "Não foi possível carregar as avaliações agora." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const reviews = useMemo(() => {
    if (!payload || !payload.ok) return [];
    const list = payload.reviews || [];
    // Remove reviews vazias (às vezes vêm sem texto)
    return list.filter((r) => (r.text || "").trim().length > 0);
  }, [payload]);

  const canSlide = reviews.length > pageSize;

  const visible = useMemo(() => {
    if (!reviews.length) return [];
    const out: GoogleReview[] = [];
    for (let i = 0; i < Math.min(pageSize, reviews.length); i++) {
      out.push(reviews[(start + i) % reviews.length]);
    }
    return out;
  }, [reviews, start, pageSize]);

  const next = () => setStart((s) => (reviews.length ? (s + pageSize) % reviews.length : 0));
  const prev = () =>
    setStart((s) => (reviews.length ? (s - pageSize + reviews.length) % reviews.length : 0));

  const ratingLine = useMemo(() => {
    if (!payload || !payload.ok) return null;
    const r = payload.rating ?? 0;
    const n = payload.user_ratings_total ?? 0;
    const ratingText = r ? r.toFixed(1).replace(".", ",") : "—";
    const countText = n ? n.toLocaleString("pt-BR") : "";
    return (
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/75">
        <Stars rating={r} />
        <span className="font-semibold text-white">{ratingText}</span>
        {n ? <span className="text-white/60">• {countText} avaliações</span> : null}
      </div>
    );
  }, [payload]);

  return (
    <section className="card p-6 md:p-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="section-title">Avaliações no Google</h2>
            <p className="section-subtitle">
              Transparência total: o que os clientes falam da Multi Trip — puxado automaticamente do
              Google.
            </p>
            {ratingLine}

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="badge">🚘 Privativo • pontualidade</span>
              <span className="badge">🌈 Respeito & inclusão</span>
              <span className="badge">🧩🌻 Autistas & transtornos invisíveis</span>
              <span className="badge">🔒 Pagamento seguro</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={prev}
              disabled={!canSlide}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 disabled:opacity-40"
              aria-label="Ver avaliações anteriores"
              title="Anterior"
            >
              ←
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!canSlide}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 disabled:opacity-40"
              aria-label="Ver próximas avaliações"
              title="Próximo"
            >
              →
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        {!payload ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card-soft p-5">
                <div className="h-4 w-2/3 rounded bg-white/10" />
                <div className="mt-3 h-3 w-1/2 rounded bg-white/10" />
                <div className="mt-5 space-y-2">
                  <div className="h-3 rounded bg-white/10" />
                  <div className="h-3 rounded bg-white/10" />
                  <div className="h-3 w-5/6 rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : payload.ok ? (
          reviews.length ? (
            <div className={`grid gap-4 ${pageSize === 1 ? "grid-cols-1" : "md:grid-cols-3"}`}>
              {visible.map((r, idx) => (
                <ReviewCard key={`${r.author_name || "c"}-${idx}-${start}`} r={r} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/70">
              Ainda não encontramos avaliações para exibir aqui.
            </div>
          )
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/75">
            Ainda não conseguimos carregar as avaliações aqui — mas você pode ver todas direto no
            Google.
            <div className="mt-4">
              <a
                href={SITE.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                Ver avaliações no Google
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// Compat: algumas páginas antigas importavam "GoogleReviewsEmbed".
// Mantemos o alias para evitar quebra de build.
export const GoogleReviewsEmbed = GoogleReviewsSection;
