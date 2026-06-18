import { SITE, waLink } from "./site";

export type TransferRoute = {
  slug: string;
  origem: string;
  destino: string;
  badge: string;
  h1Line1: string;
  h1Line2: string;
  subtitle: string;
  heroImage: string;
  heroImageAlt: string;
  heroCaption: { label: string; text: string };
  features: string[];
  advantages: Array<{ title: string; text: string }>;
  howItWorks: { title: string; paragraphs: string[] };
  seo: {
    title: string;
    description: string;
    ogDescription: string;
    ogImage: string;
    ogImageAlt: string;
  };
  jsonLd: {
    serviceName: string;
    areaServed: string[];
    breadcrumbLabel: string;
  };
  whatsappMessage: string;
  routeId?: string;
};

// Transfer routes removed — site now consolidates admin and redirects booking flows to human support.
export const TRANSFER_ROUTES: TransferRoute[] = [];

export function getRouteBySlug(slug: string): TransferRoute | undefined {
  return TRANSFER_ROUTES.find((r) => r.slug === slug);
}

export function buildRouteUrl(slug: string): string {
  return `${SITE.url}/transfer/${slug}`;
}

export function buildRouteJsonLd(route: TransferRoute) {
  const pageUrl = buildRouteUrl(route.slug);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${pageUrl}#service`,
        name: route.jsonLd.serviceName,
        serviceType: "Transfer Privativo",
        description: route.seo.description,
        url: pageUrl,
        provider: {
          "@type": "LocalBusiness",
          "@id": `${SITE.url}#business`,
          name: SITE.legalName,
          url: SITE.url,
          telephone: `+${SITE.whatsE164}`,
          logo: `${SITE.url}/brand/logo-horizontal.webp`,
        },
        areaServed: route.jsonLd.areaServed.map((name) => ({
          "@type": "City",
          name,
        })),
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: `Categorias de Veículo — ${route.jsonLd.serviceName}`,
          itemListElement: [
            {
              "@type": "Offer",
              name: "Sedan Premium (até 4 pessoas)",
              description:
                "Transfer privativo em Sedan Premium para até 4 pessoas. Monitoramento de voo incluso.",
              eligibleQuantity: { "@type": "QuantitativeValue", maxValue: 4, unitText: "pessoas" },
            },
            {
              "@type": "Offer",
              name: "Spin 6 Lugares (até 6 pessoas)",
              description:
                "Transfer privativo em minivan Spin para famílias ou grupos de até 6 pessoas.",
              eligibleQuantity: { "@type": "QuantitativeValue", maxValue: 6, unitText: "pessoas" },
            },
          ],
        },
        availableChannel: {
          "@type": "ServiceChannel",
          serviceUrl: pageUrl,
          servicePhone: `+${SITE.whatsE164}`,
          availableLanguage: { "@type": "Language", name: "Portuguese" },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
          { "@type": "ListItem", position: 2, name: "Transfer", item: `${SITE.url}/transfer` },
          {
            "@type": "ListItem",
            position: 3,
            name: route.jsonLd.breadcrumbLabel,
            item: pageUrl,
          },
        ],
      },
    ],
  };
}

export function buildRouteWhatsappLink(route: TransferRoute): string {
  return waLink(route.whatsappMessage, SITE.whatsE164);
}
