import type { Metadata } from "next";
import Script from "next/script";
import { SITE } from "@/lib/site";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { TrustBar } from "@/app/components/TrustBar";
import { Hero } from "@/app/components/Hero";
import { BenefitsSection } from "@/app/components/BenefitsSection";
import { HowItWorksSection } from "@/app/components/HowItWorksSection";
import { TestimonialsSection } from "@/app/components/TestimonialsSection";
import { PricingSection } from "@/app/components/PricingSection";
import { ExperienceUpgradeSection } from "@/app/components/ExperienceUpgradeSection";
import { GoogleReviewsSection } from "@/app/components/GoogleReviews";
import { RotaRomantica } from "@/app/components/RotaRomantica";
import { StatsSection } from "@/app/components/StatsSection";


export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Transfer Privativo Porto Alegre → Gramado | Multi Trip",
  description:
    "Transfer privativo de Porto Alegre para Gramado e Canela. Sem stress, sem espera — do aeroporto até a Serra Gaúcha com conforto, pontualidade e atendimento humano real.",
  alternates: { canonical: SITE.url },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE.brand,
    url: SITE.url,
    title: "Transfer Privativo Porto Alegre → Gramado | Multi Trip",
    description:
      "Transfer privativo de Porto Alegre para Gramado e Canela. Sem stress, sem espera — do aeroporto até a Serra Gaúcha com conforto, pontualidade e atendimento humano real.",
    images: [
      {
        url: `${SITE.url}/photos/serra/portico.webp`,
        width: 1200,
        height: 630,
        alt: "Multi Trip — Transfer Privativo para a Serra Gaúcha",
      },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": `${SITE.url}#business`,
      name: SITE.legalName,
      url: SITE.url,
      telephone: `+${SITE.whatsE164}`,
      email: "atendimento@multitrip.com.br",
      description:
        "Transfer privativo de Porto Alegre para Gramado e Canela. Atendimento 24h, conforto e pontualidade.",
      image: `${SITE.url}/brand/logo-horizontal.webp`,
      logo: `${SITE.url}/brand/logo-horizontal.webp`,
      priceRange: "$$",
      currenciesAccepted: "BRL",
      paymentAccepted: "PIX, Cartão de Crédito",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Rua Nair Garcia Martins, 295/171",
        addressLocality: "Porto Alegre",
        addressRegion: "RS",
        postalCode: "91760-430",
        addressCountry: "BR",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: -30.0346,
        longitude: -51.2177,
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: "00:00",
          closes: "23:59",
        },
      ],
      areaServed: [
        { "@type": "City", name: "Porto Alegre" },
        { "@type": "City", name: "Gramado" },
        { "@type": "City", name: "Canela" },
        { "@type": "City", name: "Caxias do Sul" },
        { "@type": "State", name: "Rio Grande do Sul" },
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5.0",
        reviewCount: "47",
        bestRating: "5",
        worstRating: "1",
      },
      sameAs: [SITE.instagramUrl],
    },
    {
      "@type": "Service",
      "@id": `${SITE.url}#service`,
      name: "Transfer Privativo Porto Alegre → Gramado e Canela",
      url: SITE.url,
      provider: { "@id": `${SITE.url}#business` },
      areaServed: [
        { "@type": "City", name: "Porto Alegre" },
        { "@type": "City", name: "Gramado" },
        { "@type": "City", name: "Canela" },
      ],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <Script
        id="jsonld-home"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <Header />



        <main className="overflow-x-hidden">
          <Hero />
          <StatsSection />
          <PricingSection />
          <BenefitsSection />
          <RotaRomantica />
          <HowItWorksSection whatsMessage="Olá, Jolie! Quero reservar meu transfer Porto Alegre → Gramado/Canela." />
          <TestimonialsSection />
          <div className="mx-auto max-w-6xl px-4 md:px-6 py-12">
            <GoogleReviewsSection />
          </div>
          <ExperienceUpgradeSection />
          <TrustBar />
        </main>

        <Footer />
      </div>
    </>
  );
}
