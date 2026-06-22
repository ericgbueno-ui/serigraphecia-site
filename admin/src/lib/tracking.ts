/**
 * TRACKING — Pixel de rastreamento e eventos de marketing
 *
 * Integra:
 * - Google Analytics (gtag)
 * - Meta Pixel (fbq)
 * - Eventos custom (dataLayer)
 */

export function trackEvent(
  eventName: string,
  eventData?: Record<string, any>
) {
  if (typeof window === "undefined") return;

  // Google Analytics (gtag)
  if (typeof (window as any).gtag === "function") {
    (window as any).gtag("event", eventName, eventData || {});
  }

  // Meta Pixel (fbq)
  if (typeof (window as any).fbq === "function") {
    (window as any).fbq("track", eventName, eventData || {});
  }

  // DataLayer custom
  if (typeof (window as any).dataLayer !== "undefined") {
    (window as any).dataLayer.push({
      event: eventName,
      ...eventData,
    });
  }
}

export function trackPageView(path: string, title?: string) {
  trackEvent("page_view", {
    page_path: path,
    page_title: title,
  });
}

export function trackConversion(value: number, currency = "BRL") {
  trackEvent("purchase", {
    value,
    currency,
  });
}

export function trackLead() {
  trackEvent("lead");
}

export function trackAddToCart(value: number, items?: any[]) {
  trackEvent("add_to_cart", {
    value,
    items,
  });
}

export function trackReserveClick(source?: string) {
  trackEvent("reserve_click", source ? { source } : {});
}

export function trackWhatsAppClick(source?: string) {
  trackEvent("whatsapp_click", source ? { source } : {});
}

export function trackInitiateCheckout(value?: number, source?: string) {
  const eventData: any = {};
  if (value) eventData.value = value;
  if (source) eventData.source = source;
  trackEvent("begin_checkout", eventData);
}

export function trackLeadCapture(leadData?: any) {
  trackEvent("lead_capture", leadData || {});
}

export function track(eventName: string, eventData?: any) {
  trackEvent(eventName, eventData);
}
