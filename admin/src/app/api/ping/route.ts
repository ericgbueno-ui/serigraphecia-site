import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({
    ok: true,
    diagnostics: {
      mercadopagoTokenLoaded: Boolean(
        process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN
      ),
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
      databaseConfigured: Boolean((process.env.DATABASE_URL || "").trim()),
    },
  });
}
