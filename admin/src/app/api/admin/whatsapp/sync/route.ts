import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Proxy autenticado para o cron de sync do WhatsApp.
// O middleware já garante que só admins autenticados chegam aqui.
// Injeta o CRON_SECRET server-side antes de chamar o cron.
export async function POST(req: Request) {
    const cronSecret = process.env.CRON_SECRET;

    const base = new URL(req.url).origin;
    const url = `${base}/api/cron/whatsapp-sync`;

    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
