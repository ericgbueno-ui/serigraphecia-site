export function addAffiliateRefToWhatsHref(href: string, affiliateCode?: string): string {
  if (!affiliateCode) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}ref=${encodeURIComponent(affiliateCode)}`;
}
