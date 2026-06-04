"use client";

import { useState } from "react";

const BRAND = {
  gold: "#B8954A",
  dark: "#1A1A1A",
  white: "#FFFFFF",
};

export function DateSelectionModal({
  isOpen,
  onDateSelect,
}: {
  isOpen: boolean;
  onDateSelect: (date: string) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (date) onDateSelect(date);
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(8px)",
          zIndex: 9998,
          animation: "fadeIn 0.2s ease",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          width: "90%",
          maxWidth: 420,
          animation: "slideUp 0.25s ease",
        }}
      >
        <div
          style={{
            background: BRAND.dark,
            borderRadius: 16,
            padding: 24,
            border: "1px solid #444",
          }}
        >
          <h2 style={{ color: BRAND.white, fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
            Quando será sua chegada?
          </h2>
          <p style={{ color: "#aaa", fontSize: 13, margin: "0 0 16px" }}>
            Selecione a data do seu check-in no aeroporto para conferir valores e disponibilidade.
          </p>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "1px solid #555",
              background: "#2a2a2a",
              color: BRAND.white,
              fontSize: 16,
            }}
          />
          <button
            onClick={handleConfirm}
            style={{
              width: "100%",
              marginTop: 16,
              padding: "12px",
              borderRadius: 8,
              border: "none",
              background: BRAND.gold,
              color: BRAND.dark,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Confirmar data da chegada
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, calc(-50% + 20px)) } to { opacity: 1; transform: translate(-50%, -50%) } }
      `}</style>
    </>
  );
}
