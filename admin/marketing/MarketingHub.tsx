"use client";

import { useState } from "react";
import MarketingClient from "./MarketingClient";
import EmailClient from "../email/EmailClient";

type Tab = "whatsapp" | "email";

export default function MarketingHub() {
  const [tab, setTab] = useState<Tab>("whatsapp");

  const chipActive: React.CSSProperties = {
    padding: "9px 22px",
    borderRadius: "10px",
    border: "1.5px solid var(--gold)",
    background: "rgba(180,140,60,0.12)",
    color: "var(--gold)",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  };
  const chipInactive: React.CSSProperties = {
    padding: "9px 22px",
    borderRadius: "10px",
    border: "1.5px solid var(--border)",
    background: "transparent",
    color: "var(--muted)",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div>
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "24px 40px 0",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-card)",
        }}
      >
        <button
          onClick={() => setTab("whatsapp")}
          style={tab === "whatsapp" ? chipActive : chipInactive}
        >
          💬 WhatsApp em Massa
        </button>
        <button
          onClick={() => setTab("email")}
          style={tab === "email" ? chipActive : chipInactive}
        >
          📧 E-mail Campanhas
        </button>
      </div>

      {/* Conteúdo */}
      {tab === "whatsapp" && <MarketingClient />}
      {tab === "email" && <EmailClient />}
    </div>
  );
}
