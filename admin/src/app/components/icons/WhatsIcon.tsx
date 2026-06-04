import * as React from "react";

/**
 * Ícone WhatsApp (neutro/monocromático) para usar em botões e links.
 * Usa currentColor, então herda a cor do texto (fica premium e consistente).
 */
type WhatsIconProps = {
  size?: number;
  className?: string;
  title?: string;
};

export function WhatsIcon({ size = 18, className = "", title = "WhatsApp" }: WhatsIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <path
        d="M20.4 11.5a8.3 8.3 0 0 1-12.1 7.4L4 20l1.1-4.2A8.3 8.3 0 1 1 20.4 11.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.1 8.9c.2-.3.3-.3.6-.3h.5c.2 0 .4.1.5.4l.6 1.4c.1.3.1.5-.1.7l-.4.5c-.1.2-.1.4 0 .6.5 1 1.3 1.9 2.3 2.5.2.1.4.1.6 0l.6-.4c.2-.2.5-.2.8-.1l1.5.5c.3.1.4.3.4.5v.6c0 .3-.2.5-.4.6-.7.3-1.8.5-3.4-.2-2-.9-3.6-2.6-4.5-4.5-.7-1.6-.5-2.7-.2-3.4Z"
        fill="currentColor"
        fillOpacity="0.95"
      />
    </svg>
  );
}
