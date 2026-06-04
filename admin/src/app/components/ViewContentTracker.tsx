"use client";

import { useEffect } from "react";
import { track } from "@/lib/tracking";

interface Props {
  contentName: string;
  contentCategory?: string;
  value?: number;
}

export function ViewContentTracker({ contentName, contentCategory = "transfer", value }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "view_content", content_name: contentName, content_category: contentCategory });
    window.fbq?.("track", "ViewContent", {
      content_name: contentName,
      content_category: contentCategory,
      ...(value ? { value, currency: "BRL" } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
