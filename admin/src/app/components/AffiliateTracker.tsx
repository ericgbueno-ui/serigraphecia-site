"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { captureAttributionFromUrl } from "@/lib/attribution";

/**
 * Captura ?ref=... e UTMs em qualquer página e persiste por 30 dias.
 * Regra: last-click (se chegar um ref novo, ele substitui).
 */
export default function AffiliateTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Evita capturar dentro do Admin
    if (pathname.startsWith("/admin")) return;

    captureAttributionFromUrl(window.location.href);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  return null;
}
