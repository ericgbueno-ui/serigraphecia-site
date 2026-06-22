export function addAffiliateRefToWhatsHref(href: string, affiliateCode?: string): string {
  if (!affiliateCode) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}ref=${encodeURIComponent(affiliateCode)}`;
}

/**
 * Captura parâmetros de atribuição (?ref=, ?utm_*) da URL e persiste em localStorage
 * Regra: last-click (novo ref substitui anterior)
 */
export function captureAttributionFromUrl(href: string): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;

  try {
    const url = new URL(href);
    const params = url.searchParams;

    // Captura ref (afiliado)
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("attribution_ref", ref);
      localStorage.setItem("attribution_ref_at", new Date().toISOString());
    }

    // Captura UTMs
    const utmSource = params.get("utm_source");
    const utmMedium = params.get("utm_medium");
    const utmCampaign = params.get("utm_campaign");

    if (utmSource) localStorage.setItem("utm_source", utmSource);
    if (utmMedium) localStorage.setItem("utm_medium", utmMedium);
    if (utmCampaign) localStorage.setItem("utm_campaign", utmCampaign);

    // Timestamp da captura
    if (utmSource || utmMedium || utmCampaign) {
      localStorage.setItem("utm_captured_at", new Date().toISOString());
    }
  } catch (err) {
    console.warn("Attribution capture failed:", err);
  }
}

/**
 * Recupera atribuição capturada do localStorage
 */
export function getAttributionData() {
  if (typeof localStorage === "undefined") return null;

  return {
    ref: localStorage.getItem("attribution_ref"),
    utm_source: localStorage.getItem("utm_source"),
    utm_medium: localStorage.getItem("utm_medium"),
    utm_campaign: localStorage.getItem("utm_campaign"),
  };
}
