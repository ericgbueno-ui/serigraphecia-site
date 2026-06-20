"use client";

import { useState } from "react";
import { PaxTier, PAX_TIERS, TRIP_LABELS, VEHICLE_TITLES } from "@/lib/pricing";

// ─────────────────────────────────────────────────────────────
// CORES & TOKENS
// ─────────────────────────────────────────────────────────────
const BRAND = {
  gold: "#B8954A",
  goldLight: "#D4AE6A",
  goldBg: "#FBF7EF",
  dark: "#1A1A1A",
  text: "#2D2D2D",
  muted: "#6B6B6B",
  border: "#E8E0D0",
  white: "#FFFFFF",
  success: "#2D6A4F",
  successBg: "#D8F3DC",
};

const INCLUSOS = [
  "02 malas de 23 kg e 02 malas de bordo ou até 05 malas de bordo",
  "Parada para fotos no Pórtico Estilo Normando (se for da vontade dos clientes)",
  "Parada para almoço no restaurante Catto ou Pouso Novo - Igrejinha (entre 11h15min e 14h30min - opcional)",
  "Monitoramento do voo",
  "Até 60 minutos de espera cortesia no desembarque",
];

type TabelaPrecosProps = {
  selectedTrip: "ida" | "volta" | "ida_volta" | "";
  onSelectTrip: (option: "ida" | "volta" | "ida_volta") => void;
  selectedVehicle: PaxTier | "";
  onSelectVehicle: (vehicle: PaxTier) => void;
  selectedPay: "pix" | "cartao" | "";
  onSelectPay: (pay: "pix" | "cartao") => void;
  date: Date;
};

export function TabelaPrecos({
  selectedTrip,
  onSelectTrip,
  selectedVehicle,
  onSelectVehicle,
  selectedPay,
  onSelectPay,
  date,
}: TabelaPrecosProps) {
  const fmt = (v: number) =>
    v === 0
      ? "Incluso"
      : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

  const tripOptions = [
    {
      id: "ida" as const,
      label: TRIP_LABELS.ida,
      desc: "Aeroporto → Serra Gaúcha",
      popular: false,
    },
    {
      id: "volta" as const,
      label: TRIP_LABELS.volta,
      desc: "Serra Gaúcha → Aeroporto",
      popular: false,
    },
    {
      id: "ida_volta" as const,
      label: TRIP_LABELS.ida_volta,
      desc: "Chegada + Retorno — melhor custo-benefício",
      popular: true,
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        marginBottom: 32,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
      }}
    >
      {/* Título */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: BRAND.white, margin: 0 }}>
          Invista em sua experiência
        </h2>
        <p style={{ fontSize: 13, color: "#d4d4d4", marginTop: 4 }}>
          Sem surpresas. Preço fixo, independente de trânsito ou horário.
        </p>
      </div>

      <div
        style={{
          background: BRAND.goldBg,
          border: `1px solid ${BRAND.border}`,
          borderRadius: 18,
          padding: 20,
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            background: BRAND.white,
            borderRadius: 16,
            padding: 18,
            boxShadow: "0 24px 50px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* Seleção de veículo */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: BRAND.gold,
                marginBottom: 4,
              }}
            >
              1. Escolha o tipo de experiência
            </div>
            <p style={{ fontSize: 13, color: BRAND.muted, margin: 0 }}>
              Selecione a categoria ideal para o seu perfil de viagem antes de ver as condições de
              pagamento.
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {PAX_TIERS.map((key) => (
              <button
                key={key}
                onClick={() => onSelectVehicle(key)}
                style={{
                  background: selectedVehicle === key ? BRAND.dark : "transparent",
                  border:
                    selectedVehicle === key
                      ? `1px solid ${BRAND.dark}`
                      : `1px solid ${BRAND.border}`,
                  borderRadius: 9999,
                  padding: "10px 16px",
                  fontSize: 12,
                  fontWeight: selectedVehicle === key ? 700 : 500,
                  color: selectedVehicle === key ? BRAND.white : BRAND.dark,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {VEHICLE_TITLES[key]}
              </button>
            ))}
          </div>

          {/* Seleção de pagamento */}
          <div
            style={{
              background: BRAND.goldBg,
              border: `1px solid ${BRAND.border}`,
              borderRadius: 14,
              padding: "14px 16px",
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <button
                onClick={() => onSelectPay("cartao")}
                style={{
                  background: selectedPay === "cartao" ? BRAND.dark : BRAND.white,
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  color: selectedPay === "cartao" ? BRAND.white : BRAND.dark,
                  transition: "all 0.15s",
                }}
              >
                💳 Cartão (até 4x sem juros)
              </button>
              <button
                onClick={() => onSelectPay("pix")}
                style={{
                  background: selectedPay === "pix" ? BRAND.success : BRAND.white,
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  color: selectedPay === "pix" ? BRAND.white : BRAND.dark,
                  transition: "all 0.15s",
                }}
              >
                ⚡ PIX COM DESCONTO
              </button>
            </div>
            <div
              style={{
                fontSize: 11,
                color: BRAND.muted,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {selectedPay === "pix" && "Sinal de 50% + 50% no check-in"}
              {selectedPay === "cartao" && "Parcelamento em até 4x sem juros"}
              {!selectedPay && "Escolha a forma de pagamento"}
            </div>
          </div>
        </div>
      </div>

      {/* Cards de preço */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {tripOptions.map((tripOpt) => {
          // Pricing disabled in consolidated admin
          const price = 0;
          const sel = selectedTrip === tripOpt.id;

          return (
            <button
              key={tripOpt.id}
              onClick={() => onSelectTrip(tripOpt.id)}
              style={{
                background: sel ? BRAND.dark : BRAND.white,
                border:
                  tripOpt.popular && !sel
                    ? `2px solid ${BRAND.gold}`
                    : sel
                      ? `2px solid ${BRAND.dark}`
                      : `1px solid ${BRAND.border}`,
                borderRadius: 12,
                padding: "14px 16px",
                cursor: "pointer",
                textAlign: "left",
                position: "relative",
                transition: "all 0.15s",
              }}
            >
              {tripOpt.popular && (
                <span
                  style={{
                    position: "absolute",
                    top: -10,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: BRAND.gold,
                    color: BRAND.white,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 10px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                    letterSpacing: 0.5,
                  }}
                >
                  MAIS ESCOLHIDO
                </span>
              )}
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: sel ? BRAND.white : BRAND.dark,
                  marginBottom: 2,
                }}
              >
                {tripOpt.label}
              </div>
              <div style={{ fontSize: 11, color: sel ? "#aaa" : BRAND.muted, marginBottom: 10 }}>
                {tripOpt.desc}
              </div>
              <div
                style={{ fontSize: 24, fontWeight: 700, color: sel ? BRAND.goldLight : BRAND.gold }}
              >
                Contate suporte
              </div>
              {tripOpt.id === "ida_volta" && selectedVehicle && selectedPay && (
                <div style={{ fontSize: 11, color: sel ? "#aaa" : BRAND.muted, marginTop: 2 }}>
                  Fale conosco para conhecer as opções de economia.
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Inclusos */}
      <div
        style={{
          background: BRAND.goldBg,
          border: `1px solid ${BRAND.border}`,
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: BRAND.gold,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          O que está incluso
        </div>
        {INCLUSOS.map((item, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", padding: "4px 0", fontSize: 13 }}
          >
            <span style={{ color: BRAND.success, marginRight: 8 }}>✓</span>
            <span style={{ color: BRAND.text }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
