export const SITE = {
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://multitrip.com.br",
  brand: "Multi Trip",
  legalName: "Multi Trip Receptivo e Viagens",
  whatsE164: "5551999999999",
  support: {
    phone: "(51) 99999-9999",
    email: "atendimento@multitrip.com.br",
  },
};

export function waLink(message: string, phone?: string): string {
  const p = phone || SITE.whatsE164;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${p}?text=${encoded}`;
}
