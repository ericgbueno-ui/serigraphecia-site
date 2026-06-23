"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LeadsList, ConversationPanel } from "@/app/admin/conversas/ConversasClient";

interface LeadPreview {
  id: string;
  name?: string;
  whatsapp: string;
  status: string;
  score: number;
  updatedAt: string;
  valueCents?: number;
  interactions: { role: string; content: string; createdAt: string }[];
}

interface Interaction {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  aiEngine?: string;
}

interface Lead {
  id: string;
  name?: string;
  whatsapp: string;
  status: string;
  score: number;
  updatedAt: string;
  valueCents?: number;
}

interface Booking {
  id: string;
  status: string;
  idaDate?: string;
}

export default function AssistenteWhatsClient({
  leads,
  selectedId,
  selectedLead,
  interactions,
  booking,
}: {
  leads: LeadPreview[];
  selectedId: string | null;
  selectedLead: Lead | null;
  interactions: Interaction[];
  booking: Booking | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  function selectLead(id: string) {
    router.push(`/admin/atendimento-whatsapp?id=${id}`);
  }

  function goBack() {
    router.push("/admin/atendimento-whatsapp");
  }

  const showList = !isMobile || !selectedId;
  const showChat = !isMobile || selectedId;

  return (
    <div style={{
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg)",
      color: "var(--text)",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Topbar minimalista */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
        background: "rgba(10,13,18,0.97)",
        backdropFilter: "blur(12px)",
        zIndex: 100,
      }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Assistente Conversas</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)" }}>
          {leads.length} leads
        </span>
      </div>

      {/* Corpo */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

        {/* Lista esquerda */}
        {showList && (
          <div style={{
            width: isMobile ? "100%" : 300,
            flexShrink: 0,
            height: "100%",
            overflow: "hidden",
            borderRight: !isMobile ? "1px solid rgba(255,255,255,0.07)" : "none",
          }}>
            <LeadsList
              leads={leads}
              selectedId={selectedId}
              search={search}
              onSearch={setSearch}
              onSelect={selectLead}
            />
          </div>
        )}

        {/* Chat direita */}
        {showChat && (
          <div style={{ flex: 1, height: "100%", overflow: "hidden" }}>
            {selectedLead ? (
              <ConversationPanel
                lead={selectedLead}
                interactions={interactions}
                booking={booking}
                onBack={isMobile ? goBack : undefined}
              />
            ) : (
              <div style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.2)",
              }}>
                <p style={{ fontSize: 48, marginBottom: 12 }}>💬</p>
                <p style={{ fontSize: 15, fontWeight: 600 }}>Nenhuma conversa selecionada</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
