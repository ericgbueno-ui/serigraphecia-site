import { NextResponse } from 'next/server';
import makeWASocket, { DisconnectReason, fetchLatestWaWebVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import { getPrismaAuthState } from '@/lib/whatsapp-auth';
import { prisma } from '@/lib/db';

// CRÍTICO: força runtime Node.js — Baileys usa ws/crypto/fs que não existem no Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone') || '51986876557';
    const action = searchParams.get('action');

    // ── Status rápido ──────────────────────────────────────────────────────────
    if (action === 'status') {
        const { state } = await getPrismaAuthState(phone);
        const isConnected = !!(state.creds?.me && state.creds?.registered);
        return NextResponse.json({
            isConnected,
            me: isConnected ? state.creds.me : null,
        });
    }

    // ── Conexão via SSE ────────────────────────────────────────────────────────
    // method=pair → código de pareamento (padrão, mais confiável no Vercel)
    // method=qr   → QR code clássico
    if (action === 'generate' || !action) {
        const method = searchParams.get('method') ?? 'pair';
        let socket: any = null;
        let heartbeatId: ReturnType<typeof setInterval> | null = null;
        let safetyTimeoutId: ReturnType<typeof setTimeout> | null = null;

        const stream = new ReadableStream({
            async start(controller) {
                const enc = new TextEncoder();

                const send = (event: string, data: any) => {
                    try {
                        controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
                    } catch {}
                };

                // Heartbeat a cada 15s — impede que proxies Vercel/CDN cortem
                // a conexão SSE por inatividade (idle timeout típico: 30s).
                // Enquanto o heartbeat chega, a Lambda fica viva e o Baileys também.
                const startHeartbeat = () => {
                    // eslint-disable-next-line react-hooks/immutability
                    heartbeatId = setInterval(() => {
                        try {
                            controller.enqueue(enc.encode(': heartbeat\n\n'));
                        } catch {}
                    }, 15000);
                };

                const cleanup = async (reason: string) => {
                    if (heartbeatId) { clearInterval(heartbeatId); heartbeatId = null; }
                    if (safetyTimeoutId) { clearTimeout(safetyTimeoutId); safetyTimeoutId = null; }
                    if (socket) {
                        try { socket.end(undefined); } catch {}
                        socket = null;
                    }
                    console.log(`[WhatsApp] cleanup: ${reason}`);
                };

                try {
                    const { state, saveCreds, forceSave } = await getPrismaAuthState(phone);

                    // Já conectado — retorna imediatamente
                    if (state.creds?.me && state.creds?.registered) {
                        send('status', { status: 'connected', me: state.creds.me });
                        controller.close();
                        return;
                    }

                    const { version } = await fetchLatestWaWebVersion().catch(() => ({
                        version: [2, 3000, 1019247545] as [number, number, number],
                    }));
                    console.log(`[WhatsApp] Versão WA:`, version, '| método:', method);

                    socket = makeWASocket({
                        version,
                        auth: state,
                        logger: pino({ level: 'silent' }),
                        printQRInTerminal: false,
                        connectTimeoutMs: 55000,
                        defaultQueryTimeoutMs: 25000,
                        keepAliveIntervalMs: 10000,
                    });

                    socket.ev.on('creds.update', saveCreds);

                    // Inicia heartbeat assim que o socket é criado
                    startHeartbeat();

                    // Timeout de segurança (110s < maxDuration 120s)
                    safetyTimeoutId = setTimeout(async () => {
                        send('error', { error: 'Tempo limite esgotado. Tente novamente.' });
                        await cleanup('timeout');
                        try { controller.close(); } catch {}
                    }, 110000);

                    let qrHandled = false;

                    socket.ev.on('connection.update', async (update: any) => {
                        const { connection, qr, lastDisconnect } = update;

                        // ── QR disponível ──────────────────────────────────────
                        if (qr) {
                            if (!qrHandled) {
                                // Primeira vez: pair ou QR
                                qrHandled = true;

                                if (method === 'pair') {
                                    try {
                                        const pairingPhone = phone.startsWith('55') ? phone : `55${phone}`;
                                        const code = await socket.requestPairingCode(pairingPhone);
                                        const formatted = code.match(/.{1,4}/g)?.join('-') ?? code;
                                        send('pair_code', { code: formatted });
                                        console.log(`[WhatsApp] Código: ${formatted} | número: ${pairingPhone}`);
                                    } catch (e: any) {
                                        console.warn(`[WhatsApp] requestPairingCode falhou (${e.message}), fallback QR`);
                                        try {
                                            send('qr', { qr: await QRCode.toDataURL(qr) });
                                        } catch {
                                            send('error', { error: 'Falha ao gerar código de conexão.' });
                                        }
                                    }
                                } else {
                                    // method=qr
                                    try {
                                        send('qr', { qr: await QRCode.toDataURL(qr) });
                                        console.log(`[WhatsApp] QR enviado para ${phone}`);
                                    } catch {
                                        send('error', { error: 'Falha ao gerar QR Code.' });
                                    }
                                }
                            } else if (method === 'qr') {
                                // QR rotacionou — envia o novo (só no modo QR)
                                try {
                                    send('qr', { qr: await QRCode.toDataURL(qr) });
                                } catch {}
                            }
                        }

                        // ── Conexão estabelecida ───────────────────────────────
                        if (connection === 'open') {
                            console.log(`[WhatsApp] Conectado: ${phone}`);
                            try { await forceSave(); } catch {}
                            send('status', { status: 'connected', me: socket?.user });
                            await cleanup('connected');
                            setTimeout(() => { try { controller.close(); } catch {} }, 1000);
                        }

                        // ── Conexão fechada ────────────────────────────────────
                        if (connection === 'close') {
                            const code = (lastDisconnect?.error as any)?.output?.statusCode;
                            if (code === DisconnectReason.loggedOut) {
                                send('status', { status: 'logged_out' });
                                await cleanup('logged_out');
                                try { controller.close(); } catch {}
                            }
                            // Outros códigos = reconexão automática do Baileys, aguarda
                        }
                    });

                } catch (error: any) {
                    console.error('[WhatsApp] Erro fatal:', error.message);
                    try {
                        controller.enqueue(enc.encode(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`));
                    } catch {}
                    await cleanup('fatal_error');
                    try { controller.close(); } catch {}
                }
            },

            cancel() {
                // Browser fechou a SSE (navegação, refresh) — limpa recursos
                if (heartbeatId) { clearInterval(heartbeatId); }
                if (safetyTimeoutId) { clearTimeout(safetyTimeoutId); }
                if (socket) { try { socket.end(undefined); } catch {} }
                console.log('[WhatsApp] SSE cancelada pelo browser');
            },
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no', // desativa buffering em proxies nginx/Vercel
            },
        });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(req: Request) {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone') || '51986876557';

    try {
        await prisma.whatsappSession.deleteMany({ where: { phone } });
        return NextResponse.json({ success: true, message: 'Disconnected' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
