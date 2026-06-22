/**
 * Global types for browser APIs used in tracking and analytics
 */

declare global {
  interface Window {
    dataLayer?: any[];
    fbq?: (event: string, name: string, options?: any) => void;
    gtag?: (...args: any[]) => void;
  }
}

export {};
