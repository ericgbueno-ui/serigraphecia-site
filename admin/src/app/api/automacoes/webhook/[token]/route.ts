import { NextResponse } from "next/server";
import { triggerByWebhookToken } from "@/lib/automations/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ token: string }> };

// ─── POST /api/automacoes/webhook/[token] — disparo por webhook ───────────────

export async function POST(req: Request, { params }: Params) {
  const { token } = await params;

  let inputData: Record<string, unknown> = {};
  try {
    const body = await req.json();
    if (body && typeof body === "object") inputData = body;
  } catch {
    // body vazio
  }

  const result = await triggerByWebhookToken(token, {
    ...inputData,
    triggeredAt: new Date().toISOString(),
  });

  if (!result.ok) {
    return NextResponse.json({ error: "token inválido ou fluxo inativo" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, flowId: result.flowId });
}

// ─── GET — verificação de saúde do webhook ────────────────────────────────────

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;
  return NextResponse.json({ token, status: "webhook ativo" });
}
