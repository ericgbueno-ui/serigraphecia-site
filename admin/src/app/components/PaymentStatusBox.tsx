"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type ApiResp =
  | { ok: false; error: string; details?: string }
  | {
      ok: true;
      id: string;
      status: string;
      payMethod: string | null;
      routeLabel: string | null;
      passengerCount: number | null;
      totalCents: number;
      depositCents: number;
      remainderCents: number;
      receivedCents: number | null;
      updatedAt: string;
      payment: null | {
        status: string;
        amountCents: number;
        providerId: string | null;
        paidAt: string | null;
        createdAt: string;
      };
    };

function isOkResponse(data: ApiResp | null): data is Extract<ApiResp, { ok: true }> {
  return Boolean(data && data.ok);
}

function brlFromCents(cents: number) {
  const value = Number(cents || 0) / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusLabel(status?: string) {
  switch (String(status || "").toLowerCase()) {
    case "paid":
      return { title: "Reserva confirmada", tone: "ok" as const };
    case "cancelled":
      return { title: "Pagamento cancelado", tone: "warn" as const };
    default:
      return { title: "Confirmando pagamento...", tone: "info" as const };
  }
}

export function PaymentStatusBox({
  bookingId,
  token,
  paymentId,
}: {
  bookingId: string;
  token?: string;
  paymentId?: string;
}) {
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successData = isOkResponse(data) ? data : null;
  const label = useMemo(() => statusLabel(successData?.status), [successData?.status]);
  const isPix = successData?.payMethod === "pix";
  const isPaid = successData?.status === "paid";
  const errorData = data && !data.ok ? data : null;
  const purchaseValueCents = successData
    ? (successData.payment?.amountCents ??
      (isPix ? successData.depositCents : successData.totalCents))
    : 0;

  useEffect(() => {
    let alive = true;

    async function fetchOnce() {
      if (!token) {
        setData({
          ok: false,
          error: "Token da reserva ausente. Abra o link original de confirmação.",
        });
        setLoading(false);
        return null;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({
          id: bookingId,
          t: token,
        });

        if (paymentId) {
          params.set("paymentId", paymentId);
        }

        const res = await fetch(`/api/booking/status?${params.toString()}`, {
          cache: "no-store",
        });
        const json = (await res.json().catch(() => null)) as ApiResp | null;
        if (!alive) return null;
        if (json) setData(json);
        return json;
      } finally {
        if (alive) setLoading(false);
      }
    }

    async function poll() {
      const json = await fetchOnce();
      if (!alive || !json || !isOkResponse(json)) return;

      const isFinal = ["paid", "cancelled"].includes(String(json.status || "").toLowerCase());
      if (isFinal) return;

      timerRef.current = setTimeout(poll, 2500);
    }

    poll();

    return () => {
      alive = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [bookingId, paymentId, token]);

  if (!bookingId) return null;

  return (
    <div className="card overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
      <div className="relative p-8 md:p-12 text-center flex flex-col items-center border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[color:var(--mt-gold)]/10 via-transparent to-transparent opacity-60"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div
            className={
              "mb-6 flex h-20 w-20 items-center justify-center rounded-full shadow-2xl " +
              (label.tone === "ok"
                ? "bg-emerald-500/20 text-emerald-400 shadow-emerald-500/20 border border-emerald-500/30"
                : label.tone === "warn"
                  ? "bg-amber-500/20 text-amber-400 shadow-amber-500/20 border border-amber-500/30"
                  : "bg-white/5 text-white/50 border border-white/10")
            }
          >
            {label.tone === "ok" ? (
              <svg
                className="h-10 w-10 animate-in zoom-in duration-500 delay-150"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : label.tone === "warn" ? (
              <svg
                className="h-10 w-10 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-r-2 border-white/50"></div>
            )}
          </div>

          <h2 className="text-2xl min-[480px]:text-3xl font-bold tracking-tight text-white mb-2 leading-tight">
            {label.title}
          </h2>

          {successData?.routeLabel ? (
            <div className="mt-1 text-sm md:text-base text-white/60 font-medium">
              Sua experiência em: <span className="text-white/80">{successData.routeLabel}</span>
            </div>
          ) : null}

          {loading ? (
            <div className="mt-4 text-xs font-semibold uppercase tracking-widest text-[color:var(--mt-gold)]/80 animate-pulse">
              Atualizando detalhes e segurança...
            </div>
          ) : null}
        </div>
      </div>

      {errorData ? (
        <div className="bg-amber-500/10 border-t border-amber-500/20 px-8 py-5 text-center text-sm font-medium text-amber-300">
          {errorData.error}
        </div>
      ) : null}

      {successData ? (
        <div className="p-8 md:p-12 space-y-8 bg-black/40">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-white/5 p-6 shadow-inner flex flex-col justify-center">
              <div className="text-xs font-semibold uppercase tracking-widest text-[color:var(--mt-gold)]/60 mb-1">
                Investimento Total
              </div>
              <div className="text-3xl font-bold text-white tracking-tight">
                {brlFromCents(successData.totalCents)}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-sm text-white/70">
              {isPix ? (
                <>
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="font-medium">Sinal pago (Reserva)</span>
                    <span className="font-bold text-white">
                      {brlFromCents(successData.depositCents)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-medium">Saldo no check-in</span>
                    <span className="font-bold text-white">
                      {brlFromCents(successData.remainderCents)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-white/40 italic">
                    O pagamento do saldo pode ser realizado diretamente no check-in via Pix CNPJ ou
                    cédulas.
                  </p>
                </>
              ) : (
                <div className="flex h-full flex-col justify-center text-center">
                  <div className="mb-2 text-sm font-medium text-white/80">
                    Pagamento Integral Confirmado
                  </div>
                  <p className="text-xs leading-relaxed text-white/40 italic">
                    Efetuado via Cartão de Crédito. Nenhuma cobrança restante será feita.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-6 text-center shadow-inner">
            <p className="text-sm font-medium leading-relaxed text-emerald-200/80">
              <span className="block mb-2 font-bold text-emerald-400">Fique tranquilo.</span>
              Assim que conciliado, seu transfer é automaticamente reservado junto à nossa operação
              dedicada.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
