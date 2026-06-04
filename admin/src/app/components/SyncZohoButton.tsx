"use client";

import { useState } from "react";

interface SyncZohoButtonProps {
  reservationId: string;
  syncError?: string;
}

export function SyncZohoButton({ reservationId, syncError }: SyncZohoButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSync() {
    setIsLoading(true);
    setStatus("idle");

    try {
      // Esse endpoint deve buscar a reserva no banco e disparar a mesma lógica do webhook
      const res = await fetch(`/api/webhooks/zoho-sync/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId }),
      });

      if (!res.ok) throw new Error("Falha ao forçar sincronização");

      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4 max-w-lg">
      <div className="mb-3">
        <h4 className="font-semibold text-red-700 m-0 flex items-center gap-2">
          ⚠️ Falha de Integração (Agenda)
        </h4>
        <p className="text-sm text-red-600 mt-1">
          O evento não pôde ser gravado automaticamente no Zoho Calendar.
          {syncError && <span className="block mt-1 italic">Detalhe: {syncError}</span>}
        </p>
      </div>

      <button
        onClick={handleSync}
        disabled={isLoading || status === "success"}
        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
      >
        {isLoading
          ? "Sincronizando..."
          : status === "success"
            ? "✓ Sincronizado!"
            : "Tentar Sincronizar Novamente"}
      </button>

      {status === "error" && (
        <p className="text-xs text-red-500 mt-2">Falhou novamente. Verifique os logs do sistema.</p>
      )}
    </div>
  );
}
