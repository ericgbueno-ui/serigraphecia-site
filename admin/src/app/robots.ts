import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/reserva"],
      disallow: [
        "/checkout", // página transacional
        "/pagamento", // páginas de status de pagamento
        "/afiliado", // FIX: toda área de afiliados protegida (era só /admin)
        "/api", // rotas de API
        "/admin", // painel admin (mesmo sem página pública)
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
