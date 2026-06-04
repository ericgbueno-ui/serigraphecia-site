"use client";

import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  items?: string[];
  confirmWord?: string;
  pending?: boolean;
}

export function DangerConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  items = [],
  confirmWord = "EXCLUIR",
  pending = false,
}: Props) {
  const [typed, setTyped] = useState("");

  if (!isOpen) return null;

  const canConfirm = typed === confirmWord && !pending;

  function handleConfirm() {
    if (!canConfirm) return;
    onConfirm();
  }

  function handleClose() {
    if (pending) return;
    setTyped("");
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(248,113,113,0.35)",
          borderRadius: "20px",
          padding: "32px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 0 60px rgba(248,113,113,0.12)",
        }}
      >
        {/* Ícone de aviso */}
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: "rgba(248,113,113,0.12)",
            border: "1px solid rgba(248,113,113,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "26px",
            marginBottom: "20px",
          }}
        >
          ⚠️
        </div>

        <h2
          style={{
            fontSize: "18px",
            fontWeight: 800,
            color: "#f87171",
            marginBottom: "10px",
          }}
        >
          {title}
        </h2>

        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", marginBottom: "16px", lineHeight: 1.6 }}>
          {description}
        </p>

        {items.length > 0 && (
          <div
            style={{
              background: "rgba(248,113,113,0.06)",
              border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "20px",
            }}
          >
            {items.map((item, i) => (
              <p key={i} style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: i < items.length - 1 ? "4px" : 0 }}>
                🗑 {item}
              </p>
            ))}
          </div>
        )}

        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "14px 16px",
            marginBottom: "20px",
          }}
        >
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Para confirmar, digite <span style={{ color: "#f87171", fontFamily: "monospace" }}>{confirmWord}</span>
          </p>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={`Digite ${confirmWord}`}
            autoComplete="off"
            autoFocus
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "16px",
              fontWeight: 700,
              fontFamily: "monospace",
              color: typed === confirmWord ? "#f87171" : "rgba(255,255,255,0.8)",
              letterSpacing: "0.1em",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={pending}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.5)",
              cursor: pending ? "not-allowed" : "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            style={{
              flex: 2,
              padding: "11px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 700,
              background: canConfirm ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${canConfirm ? "rgba(248,113,113,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: canConfirm ? "#f87171" : "rgba(255,255,255,0.2)",
              cursor: canConfirm ? "pointer" : "not-allowed",
              transition: "all 0.15s",
            }}
          >
            {pending ? "Excluindo…" : "Confirmar Exclusão"}
          </button>
        </div>
      </div>
    </div>
  );
}
