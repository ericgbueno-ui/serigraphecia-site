"use client";

import { useState } from "react";

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  function copiar() {
    const link = `${window.location.origin}/afiliado/cadastro`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <button
      onClick={copiar}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        background: copied ? "rgba(62,207,142,0.12)" : "rgba(255,255,255,0.05)",
        color: copied ? "var(--green)" : "var(--muted)",
        border: `1px solid ${copied ? "rgba(62,207,142,0.3)" : "var(--border-md)"}`,
        padding: "10px 16px",
        borderRadius: "10px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
    >
      {copied ? (
        <>✓ Link copiado!</>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copiar link de cadastro
        </>
      )}
    </button>
  );
}
