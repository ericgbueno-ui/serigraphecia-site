import { NextResponse } from "next/server";
import { getIsAdmin } from "@/lib/server/adminAuth";
import { syncAllLeadConversions } from "@/lib/lead";

export const runtime = "nodejs";

// POST /api/admin/sync-leads
// Marca todos os leads existentes como "convertido" quando há reserva confirmada.
// Rota de uso único para sincronizar dados históricos.
export async function POST() {
  if (!(await getIsAdmin())) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 401 });
  }

  const synced = await syncAllLeadConversions();

  return NextResponse.json({ ok: true, synced });
}
