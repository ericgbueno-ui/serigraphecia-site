/** @type {import('next').NextConfig} */

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${IS_PRODUCTION ? "" : " 'unsafe-eval'"} https://connect.facebook.net https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://sdk.mercadopago.com https://va.vercel-scripts.com https://vercel.live`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vercel.live",
      "font-src 'self' https://fonts.gstatic.com https://vercel.live https://assets.vercel.com",
      "img-src 'self' data: blob: https://*.facebook.com https://*.fbcdn.net https://maps.gstatic.com https://maps.googleapis.com https://*.doubleclick.net https://vercel.live https://vercel.com",
      "connect-src 'self' https://api.mercadopago.com https://www.facebook.com https://*.googleapis.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://va.vercel-scripts.com https://vitals.vercel-insights.com https://vercel.live wss://ws-us3.pusher.com https://www.google-analytics.com https://www.google.com https://*.google-analytics.com https://*.analytics.google.com",
      "frame-src 'self' https://www.mercadopago.com.br https://www.mercadopago.com https://bid.g.doubleclick.net https://vercel.live",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
].concat(
  IS_PRODUCTION
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]
    : []
);

const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@whiskeysockets/baileys"],
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/(.*\\.webp|.*\\.png|.*\\.jpg|.*\\.svg)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // legacy privacy / terms
      { source: "/politica-privacidade", destination: "/privacidade", permanent: true },
      { source: "/politica-de-privacidade", destination: "/privacidade", permanent: true },
      { source: "/privacy", destination: "/privacidade", permanent: true },
      { source: "/termos", destination: "/termos-transfer", permanent: true },
      { source: "/termos-de-uso", destination: "/termos-transfer", permanent: true },
      { source: "/terms", destination: "/termos-transfer", permanent: true },
      // legacy flat transfer routes → new /transfer/[slug] structure
      {
        source: "/transfer-porto-alegre-gramado",
        destination: "/transfer/porto-alegre-gramado",
        permanent: true,
      },
      {
        source: "/transfer-caxias-gramado",
        destination: "/transfer/caxias-gramado",
        permanent: true,
      },
      {
        source: "/transfer-bento-goncalves-vale-dos-vinhedos",
        destination: "/transfer/bento-goncalves-vale-dos-vinhedos",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
