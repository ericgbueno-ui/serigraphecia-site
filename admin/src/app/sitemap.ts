import { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { TRANSFER_ROUTES, buildRouteUrl } from "@/lib/routes.config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const now = new Date();

  const transferEntries: MetadataRoute.Sitemap = TRANSFER_ROUTES.map((r) => ({
    url: buildRouteUrl(r.slug),
    lastModified: now,
    changeFrequency: "weekly",
    priority: r.slug === "porto-alegre-gramado" ? 0.95 : 0.85,
  }));

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/transfer`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...transferEntries,
    { url: `${base}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    {
      url: `${base}/dicas/atraso-de-voo`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    { url: `${base}/quem-somos`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // /checkout, /pagamento e /admin são transacionais/protegidos — bloqueados no robots.txt, não pertencem ao sitemap
    { url: `${base}/termos-transfer`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacidade`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
