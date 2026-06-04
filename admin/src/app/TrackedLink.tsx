"use client";

import React, { AnchorHTMLAttributes } from "react";

interface TrackedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  eventName: string;
  eventParams?: Record<string, any>;
  href: string;
  children: React.ReactNode;
}

export function TrackedLink({
  eventName,
  eventParams,
  href,
  children,
  ...props
}: TrackedLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // 1. Dispara evento para o Meta Pixel
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("trackCustom", eventName, eventParams);
    }

    // 2. Dispara evento via dataLayer (GTM / GA4 / Google Ads)
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: "custom_tracked_click",
        click_name: eventName,
        ...eventParams,
      });
    }

    // 3. Aguarda 150ms para garantir o disparo antes do redirecionamento
    setTimeout(() => {
      if (props.target === "_blank") {
        window.open(href, "_blank");
      } else {
        window.location.href = href;
      }
    }, 150);
  };

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}