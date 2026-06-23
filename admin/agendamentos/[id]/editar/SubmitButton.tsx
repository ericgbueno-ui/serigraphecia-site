"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        padding: "10px 28px",
        borderRadius: "10px",
        fontSize: "13px",
        fontWeight: 700,
        background: pending ? "rgba(212,170,79,0.5)" : "var(--gold)",
        border: "none",
        color: pending ? "rgba(10,10,10,0.5)" : "#0a0a0a",
        cursor: pending ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        minWidth: "160px",
      }}
    >
      {pending ? "Salvando..." : "💾 Salvar alterações"}
    </button>
  );
}
