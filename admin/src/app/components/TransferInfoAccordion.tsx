"use client";

import { useState } from "react";
import {
  TRANSFER_PREMIUM_BADGES,
  TRANSFER_PREMIUM_DESCRIPTION,
  TRANSFER_PREMIUM_HEADLINE,
  TRANSFER_PREMIUM_INCLUDES,
  WHY_CHOOSE_MULTI_TRIP,
} from "@/lib/transferContent";

const ACCORDION_ITEMS = [
  {
    id: "why_choose",
    title: "Por que escolher a Multi Trip?",
    preview:
      "CADASTUR, atendimento humanizado, especialistas na Serra Gaúcha e parcerias oficiais.",
    items: WHY_CHOOSE_MULTI_TRIP,
  },
  {
    id: "premium_included",
    title: "O que está incluso no seu Transfer Privativo Exclusivo",
    preview: "Carro privativo, bagagem inclusa, segurança infantil, monitoramento do voo e mais.",
    items: TRANSFER_PREMIUM_INCLUDES,
  },
] as const;

export function TransferInfoAccordion() {
  const [openId, setOpenId] = useState<(typeof ACCORDION_ITEMS)[number]["id"] | null>(null);

  return (
    <section className="card p-6">
      <div className="max-w-3xl">
        <div className="flex flex-wrap gap-2">
          {TRANSFER_PREMIUM_BADGES.map((badge) => (
            <span key={badge} className="chip">
              {badge}
            </span>
          ))}
        </div>

        <h2 className="mt-5 text-2xl font-semibold md:text-3xl">{TRANSFER_PREMIUM_HEADLINE}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/75 md:text-base">
          {TRANSFER_PREMIUM_DESCRIPTION}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {ACCORDION_ITEMS.map((item) => {
          const isOpen = openId === item.id;

          return (
            <div
              key={item.id}
              className={[
                "overflow-hidden rounded-2xl border transition-colors",
                isOpen ? "border-[color:var(--mt-gold)] bg-white/5" : "border-white/10 bg-black/20",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <div>
                  <div className="text-base font-semibold text-white">{item.title}</div>
                  <p className="mt-1 text-sm text-white/55">{item.preview}</p>
                </div>
                <span
                  className={[
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                    isOpen
                      ? "border-[color:var(--mt-gold)] text-[color:var(--mt-gold)]"
                      : "border-white/15 text-white/55",
                  ].join(" ")}
                >
                  {isOpen ? "Fechar" : "Abrir"}
                </span>
              </button>

              {isOpen ? (
                <div className="border-t border-white/10 px-5 py-4">
                  <ul className="space-y-3 text-sm text-white/75">
                    {item.items.map((detail) => (
                      <li key={detail} className="flex gap-3">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--mt-gold)]" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
