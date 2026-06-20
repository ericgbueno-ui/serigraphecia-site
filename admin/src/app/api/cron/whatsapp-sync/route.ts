import { NextResponse } from 'next/server';
import makeWASocket, { DisconnectReason, fetchLatestWaWebVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import { getPrismaAuthState } from '@/lib/whatsapp-auth';
import { prisma } from '@/lib/db';
import { trackLeadEvent } from '@/lib/lead';
import { verifyCronAuth } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const phone = '51986876557';

  try {
    const { state, saveCreds } = await getPrismaAuthState(phone);

    if (!state.creds || !state.creds.registered) {
      return NextResponse.json({ success: false, message: 'WhatsApp session not authenticated' });
    }

    const logger = pino({ level: 'silent' });
    const syncedLeadsCount = new Set<string>();
    let messagesCount = 0;
    const diagEvents: string[] = [];

    await new Promise<void>(async (resolve) => {
      let socket: any = null;
      let isFinished = false;
      let timeoutId: any = null;

      const cleanup = (reason?: string) => {
        if (isFinished) return;
        isFinished = true;
        if (reason) diagEvents.push(`cleanup: ${reason}`);
        clearTimeout(timeoutId);
        if (socket) {
          try { socket.end(); } catch (e) {}
        }
        resolve();
      };

      // Processa um array de mensagens brutas do Baileys e persiste no banco
      const processMessages = async (messages: any[]) => {
        for (const msg of messages) {
          try {
            const jid = msg.key?.remoteJid;
            if (!jid || !jid.endsWith('@s.whatsapp.net')) continue;

            const cleanPhone = jid.split('@')[0];
            const content = extractMessageContent(msg);
            if (!content) continue;

            const role = msg.key.fromMe ? 'human' : 'lead';
            const msgDate = new Date((msg.messageTimestamp as number) * 1000);
            const startWindow = new Date(msgDate.getTime() - 60000);
            const endWindow = new Date(msgDate.getTime() + 60000);

            let lead = await prisma.lead.findUnique({ where: { whatsapp: cleanPhone } });
            const pushName = msg.pushName || null;

            if (!lead) {
              lead = await prisma.lead.create({
                data: { whatsapp: cleanPhone, name: pushName, status: 'frio', source: 'whatsapp' },
              });
              syncedLeadsCount.add(cleanPhone);
            } else if (pushName && !lead.name) {
              lead = await prisma.lead.update({
                where: { whatsapp: cleanPhone },
                data: { name: pushName },
              });
            }

            const existingInteraction = await prisma.interaction.findFirst({
              where: {
                leadId: lead.id,
                role,
                content,
                createdAt: { gte: startWindow, lte: endWindow },
              },
            });

            if (!existingInteraction) {
              await prisma.interaction.create({
                data: {
                  leadId: lead.id,
                  role,
                  content,
                  aiEngine: msg.key.fromMe ? 'human' : undefined,
                  createdAt: msgDate,
                },
              });

              if (role === 'lead') {
                await trackLeadEvent(cleanPhone, 'response', { preview: content.slice(0, 100) });
              }

              await prisma.lead.update({
                where: { id: lead.id },
                data: { updatedAt: new Date() },
              });

              syncedLeadsCount.add(cleanPhone);
              messagesCount++;
            }
          } catch (err) {
            console.error('Error processing sync message:', err);
          }
        }
      };

      diagEvents.push('socket_starting');

      // Timeout de conexão inicial (15s para estabelecer conexão)
      timeoutId = setTimeout(() => {
        cleanup('connection_timeout_15s');
      }, 15000);

      const { version } = await fetchLatestWaWebVersion().catch(() => ({ version: [2, 3000, 1017577663] }));
      diagEvents.push(`wa_version: ${version.join('.')}`);
      socket = makeWASocket({
        version: version as any,
        auth: state,
        logger,
        printQRInTerminal: false,
        connectTimeoutMs: 12000,
        defaultQueryTimeoutMs: 12000,
      });

      socket.ev.on('creds.update', saveCreds);

      socket.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect } = update;
        const errMsg = lastDisconnect?.error?.message ?? '';
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        diagEvents.push(`conn_update: ${connection}${statusCode ? ` (${statusCode})` : ''}${errMsg ? ` - ${errMsg}` : ''}`);

        if (connection === 'open') {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => cleanup('post_open_timeout_20s'), 20000);
        }

        if (connection === 'close') {
          if (statusCode === DisconnectReason.loggedOut) {
            // Sessão inválida no servidor do WA — limpa do banco para o painel mostrar desconectado
            await prisma.whatsappSession.deleteMany({ where: { phone } }).catch(() => {});
            cleanup('logged_out');
          }
        }
      });

      // Mensagens em tempo real (novas chegadas durante o sync)
      socket.ev.on('messages.upsert', async (m: any) => {
        const { messages, type } = m;
        diagEvents.push(`messages.upsert type=${type} count=${messages?.length ?? 0}`);
        if (type !== 'notify' && type !== 'append') return;
        await processMessages(messages);
      });

      // Histórico de mensagens enviado pelo WhatsApp ao reconectar — evento principal
      socket.ev.on('messaging-history.set', async ({ messages: historyMessages, isLatest }: any) => {
        diagEvents.push(`messaging-history.set count=${historyMessages?.length ?? 0} isLatest=${isLatest}`);
        if (!historyMessages?.length) { cleanup('history_empty'); return; }
        await processMessages(historyMessages);
        cleanup('history_processed');
      });
    });

    return NextResponse.json({
      success: true,
      syncedLeads: Array.from(syncedLeadsCount),
      syncedMessagesCount: messagesCount,
      _diag: diagEvents,
    });
  } catch (err: any) {
    console.error('WhatsApp sync cron error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

function extractMessageContent(msg: any): string {
  if (!msg.message) return '';

  if (msg.message.conversation) {
    return msg.message.conversation;
  }
  if (msg.message.extendedTextMessage) {
    return msg.message.extendedTextMessage.text || '';
  }
  if (msg.message.imageMessage) {
    return msg.message.imageMessage.caption || '[Imagem]';
  }
  if (msg.message.videoMessage) {
    return msg.message.videoMessage.caption || '[Vídeo]';
  }
  if (msg.message.documentMessage) {
    return msg.message.documentMessage.title || '[Documento]';
  }
  if (msg.message.audioMessage) {
    return '[Áudio]';
  }
  return '';
}
