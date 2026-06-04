"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { WhatsIcon } from "./icons/WhatsIcon";
import { addAffiliateRefToWhatsHref } from "@/lib/attribution";

/**
 * Link/CTA de Whats (padrão do site) + acessibilidade.
 * Usar para TODOS os links que levam ao Whats.
 */
export function WhatsLink({
  href,
  className = "btn-ghost",
  children,
  title = "Abrir conversa no WhatsApp",
  variant = "icon",
  iconOnly = false,
  srLabel,
  ariaLabel,
  iconSrc = "/brand/whats-logo.webp",
  iconSize = 18,
  imgWidth,
  imgHeight,
  imgClassName,
  onClick,
}: {
  href: string;
  className?: string;
  children?: ReactNode;
  title?: string;
  variant?: "icon" | "image";
  iconOnly?: boolean;
  srLabel?: string;
  ariaLabel?: string;
  iconSrc?: string;
  iconSize?: number;
  imgWidth?: number;
  imgHeight?: number;
  imgClassName?: string;
  onClick?: () => void;
}) {
  const computedAriaLabel =
    ariaLabel ??
    srLabel ??
    (typeof children === "string" && children.trim() ? `${children} (WhatsApp)` : "WhatsApp");

  const shouldShowText = !iconOnly;
  const gap = shouldShowText ? "gap-2" : "";

  const content = (() => {
    if (!iconSrc) {
      return <WhatsIcon size={iconSize} className="shrink-0" />;
    }

    if (variant === "image") {
      const w = imgWidth ?? 220;
      const h = imgHeight ?? 70;
      return (
        <Image
          src={iconSrc}
          alt="WhatsApp"
          width={w}
          height={h}
          className={imgClassName ?? "h-12 w-auto"}
          priority={false}
        />
      );
    }

    return (
      <Image
        src={iconSrc}
        alt="WhatsApp"
        width={iconSize}
        height={iconSize}
        className="shrink-0"
        style={{ width: iconSize, height: iconSize }}
      />
    );
  })();

  const finalHref = addAffiliateRefToWhatsHref(href);

  return (
    <a
      href={finalHref}
      target="_blank"
      rel="noreferrer"
      className={`${className} inline-flex items-center ${gap}`}
      title={title}
      aria-label={computedAriaLabel}
      onClick={onClick}
    >
      {content}
      {shouldShowText ? (
        <span>{children}</span>
      ) : (
        <span className="sr-only">{srLabel ?? computedAriaLabel}</span>
      )}
    </a>
  );
}
