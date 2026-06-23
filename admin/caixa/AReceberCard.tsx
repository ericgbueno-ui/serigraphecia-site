"use client";

import { useState } from "react";
import Link from "next/link";

interface PendingBooking {
  id: string;
  customerName: string;
  remainderCents: number;
  idaDate: string | null;
  voltaDate: string | null;
  cityTourDate: string | null;
  tripType: string;
  payMethod: string;
}

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function AReceberCard({
  aReceberTotal,
  faturamentoTotal,
  pendingBookings,
}: {
  aReceberTotal: number;
  faturamentoTotal: number;
  pendingBookings: PendingBooking[];
}) {
  const [open, setOpen] = useState(false);

  const pct =
    faturamentoTotal > 0
      ? `${Math.round((aReceberTotal / faturamentoTotal) * 100)}% pendente`
      : "—";

  return (
    <div style={{ position: "relative" }}>
      {/* Card clicável */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          textAlign: "left",
          background: open ? "rgba(201,168,76,0.08)" : "var(--bg-card)",
          border: `1px solid ${open ? "rgba(201,168,76,0.4)" : "var(--border)"}`,
          borderTop: `3px solid rgba(201,168,76,0.3)`,
          borderRadius: "14px",
          padding: "18px 20px",
          cursor: "pointer",
          transition: "background 0.15s, border-color 0.15s",
        }}
      >
        <p
          style={{
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--muted)",
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          A Receber
          <span
            style={{
              fontSize: "9px",
              background: "rgba(201,168,76,0.15)",
              color: "#c9a84c",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "4px",
              padding: "1px 5px",
            }}
          >
            {pendingBookings.length} contrato{pendingBookings.length !== 1 ? "s" : ""}
          </span>
        </p>
        <p style={{ fontSize: "20px", fontWeight: 800, color: "#c9a84c", lineHeight: 1 }}>
          {brl(aReceberTotal)}
        </p>
        <p
          style={{
            fontSize: "11px",
            color: "var(--muted)",
            marginTop: "6px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {pct}
          <span style={{ marginLeft: "auto", fontSize: "10px", color: "#c9a84c" }}>
            {open ? "▲ fechar" : "▼ ver datas"}
          </span>
        </p>
      </button>

      {/* Painel expandido */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "420px",
            background: "var(--bg-card)",
            border: "1px solid rgba(201,168,76,0.35)",
            borderRadius: "14px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid var(--border)",
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--muted)",
              display: "grid",
              gridTemplateColumns: "1fr 100px 90px",
              gap: "8px",
            }}
          >
            <span>Cliente</span>
            <span>Data</span>
            <span style={{ textAlign: "right" }}>A receber</span>
          </div>

          {pendingBookings.length === 0 ? (
            <p style={{ padding: "20px 16px", fontSize: "13px", color: "var(--muted)", textAlign: "center" }}>
              Nenhum valor pendente.
            </p>
          ) : (
            pendingBookings.map((b, i) => {
              const checkInDate = b.tripType === "volta" ? b.voltaDate : b.tripType === "so_citytour" ? (b.idaDate ?? b.cityTourDate) : b.idaDate;
              const isOverdue = checkInDate && checkInDate <= new Date().toISOString().slice(0, 10);

              return (
                <Link
                  key={b.id}
                  href={`/admin/agendamentos/${b.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 90px",
                    gap: "8px",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderBottom: i < pendingBookings.length - 1 ? "1px solid var(--border)" : "none",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "background 0.1s",
                  }}
                  className="hover:bg-white/[0.03]"
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {b.customerName}
                    </p>
                    <p style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px" }}>
                      {b.payMethod === "pix" || b.payMethod === "pix_50"
                        ? "PIX — saldo no atendimento"
                        : b.payMethod === "cartao"
                          ? "Cartão"
                          : b.payMethod}
                    </p>
                  </div>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: isOverdue ? "#f87171" : "var(--text)",
                    whiteSpace: "nowrap",
                  }}>
                    {checkInDate ? fmtDate(checkInDate) : "A confirmar"}
                  </span>
                  <span style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#c9a84c",
                    whiteSpace: "nowrap",
                    textAlign: "right",
                  }}>
                    {brl(b.remainderCents)}
                  </span>
                </Link>
              );
            })
          )}

          {/* Rodapé */}
          <div style={{
            padding: "10px 16px",
            background: "rgba(201,168,76,0.06)",
            borderTop: "1px solid rgba(201,168,76,0.2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>Total pendente</span>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#c9a84c" }}>
              {brl(aReceberTotal)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
