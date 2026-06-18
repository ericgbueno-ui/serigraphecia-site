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
  title: "Serviço indisponível — Contato de suporte",
  description: "As reservas e pagamentos foram temporariamente desativados. Entre em contato com nossa equipe.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <div style={{ maxWidth: 820 }} className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Serviço de reservas temporariamente desativado</h1>
        <p className="mb-4">Removemos temporariamente a funcionalidade automática de reservas e pagamentos.</p>
        <p className="mb-4">Para concluir reservas ou receber assistência, entre em contato com nossa equipe:</p>
        <p className="mb-2">Telefone/WhatsApp: <strong>{SITE.support?.phone ?? SITE.whatsE164}</strong></p>
        <p className="mb-6">E-mail: <strong>atendimento@multitrip.com.br</strong></p>
        <a href="/admin" className="inline-block px-4 py-2 bg-black text-white rounded">Área Administrativa</a>
      </div>
    </div>
  );
}
