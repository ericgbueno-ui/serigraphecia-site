"use client";

import { useState, useTransition } from "react";
import { DangerConfirmModal } from "@/app/admin/components/DangerConfirmModal";

interface Props {
  action: () => Promise<void>;
  clientName: string;
}

export function DeleteButton({ action, clientName }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(() => {
      action().then(() => setOpen(false));
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        style={{
          padding: "7px 16px",
          borderRadius: "10px",
          fontSize: "13px",
          fontWeight: 600,
          background: "rgba(248,113,113,0.1)",
          border: "1px solid rgba(248,113,113,0.25)",
          color: "#f87171",
          cursor: pending ? "not-allowed" : "pointer",
          opacity: pending ? 0.6 : 1,
        }}
      >
        {pending ? "Excluindo…" : "🗑 Excluir"}
      </button>

      <DangerConfirmModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Excluir agendamento permanentemente"
        description={`Você está prestes a excluir a agendamento de ${clientName}. Esta ação é irreversível e apagará todos os dados associados.`}
        items={[
          `Agendamento de ${clientName}`,
          "Dados dos clientes",
          "Histórico de pagamentos",
          "Contrato associado",
        ]}
        pending={pending}
      />
    </>
  );
}
