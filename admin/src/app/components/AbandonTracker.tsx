"use client";

import { useEffect, useRef } from "react";

export interface AbandonData {
  step: number;
  vehicleId: string;
  vehicleName: string;
  total: number;
  origem: string;
  destino: string;
  nome?: string;
  whatsapp?: string;
}

interface Props {
  data: Partial<AbandonData>;
  hasCompleted: boolean;
}

export function AbandonTracker({ data, hasCompleted }: Props) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (hasCompleted) return;

    const handleBeforeUnload = () => {
      if (sentRef.current) return;
      if (!data.step || data.step < 1) return; // Só envia se passou do início

      const payload = JSON.stringify(data);
      navigator.sendBeacon("/api/abandonment", payload);
      sentRef.current = true;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [data, hasCompleted]);

  return null;
}
