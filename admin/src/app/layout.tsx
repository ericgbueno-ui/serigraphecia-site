import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import Script from "next/script";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import { Analytics } from "@vercel/analytics/react";
import { WhatsAppWidget } from "./components/WhatsAppWidget";
import { MetaPixel } from "./components/MetaPixel";
import { UrgenciaBanner } from "./components/UrgenciaBanner";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-WZMCLKHW";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.legalName,
    template: `%s | ${SITE.brand}`,
  },
  description:
    "Transfer privativo de Porto Alegre para Gramado e Canela. Sem stress, sem espera — do aeroporto até a Serra Gaúcha com conforto, pontualidade e atendimento humano real.",
  applicationName: SITE.brand,
  keywords: [
    "transfer porto alegre gramado",
    "transfer privativo gramado",
    "transfer aeroporto gramado",
    "transfer canela",
    "transfer serra gaúcha",
    "transfer poa gramado",
    "multi trip",
  ],
  authors: [{ name: "Multi Trip Receptivo e Viagens", url: SITE.url }],
  creator: "Multi Trip Receptivo e Viagens",
  publisher: "Multi Trip Receptivo e Viagens",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
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
        url: "/photos/serra/portico.webp",
        width: 1200,
        height: 630,
        alt: "Multi Trip — Transfer Privativo para a Serra Gaúcha",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Transfer Privativo Porto Alegre → Gramado | Multi Trip",
    description:
      "Transfer privativo de Porto Alegre para Gramado e Canela. Sem stress, sem espera.",
    images: ["/photos/serra/portico.webp"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${dmSans.variable}`}>
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
        {/* GA4: gerenciado pelo GTM acima — script direto removido para evitar PageViews duplicados */}
      </head>
      <body className="min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)] antialiased">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
        <Analytics />
        <UrgenciaBanner />
        {children}
        <WhatsAppWidget />
      </body>
    </html>
  );
}
