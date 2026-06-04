/**
 * whatsapp-connect.mjs
 *
 * Conecta o WhatsApp da equipe localmente e salva a sessão no Neon.
 * Rode UMA VEZ quando precisar (re)conectar:
 *
 *   node scripts/whatsapp-connect.mjs
 *
 * O QR abre automaticamente no navegador. Após escanear, a sessão
 * é salva no Neon e o Vercel usa ela para o sync diário.
 */

import { createRequire } from 'module';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ── Carrega .env.local ──────────────────────────────────────────────────────
const envPath = resolve(__dirname, '../.env.local');
try {
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    process.env[key] = process.env[key] ?? val;
  }
  console.log('✅ .env.local carregado');
} catch {
  console.warn('⚠️  .env.local não encontrado — usando variáveis de ambiente existentes');
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não definida. Verifique o .env.local');
  process.exit(1);
}

// ── Imports ──────────────────────────────────────────────────────────────────
const { default: makeWASocket, DisconnectReason, fetchLatestWaWebVersion, BufferJSON, initAuthCreds } =
  await import('@whiskeysockets/baileys');
const { default: pino } = await import('pino');
const QRCode = await import('qrcode');
const { PrismaClient } = await import('@prisma/client');

const prisma = new PrismaClient({ log: [] });
const PHONE = '51986876557';
const HTML_PATH = resolve(__dirname, '../.qr-connect.html');

let browserOpened = false;
let attemptCount = 0;
const MAX_ATTEMPTS = 5;

// ── Auth state (Neon/Prisma) ─────────────────────────────────────────────────
async function usePrismaAuthState(phone) {
  const session = await prisma.whatsappSession.findUnique({ where: { phone } });
  let creds = initAuthCreds();
  let keysData = {};

  if (session?.data) {
    try {
      const parsed = JSON.parse(session.data, BufferJSON.reviver);
      creds = parsed.creds || initAuthCreds();
      keysData = parsed.keys || {};
    } catch {}
  }

  let saveTimeout = null;
  const saveToDb = async () => {
    const dataStr = JSON.stringify({ creds, keys: keysData }, BufferJSON.replacer);
    await prisma.whatsappSession.upsert({
      where: { phone },
      update: { data: dataStr },
      create: { phone, data: dataStr },
    });
  };
  const saveState = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveToDb, 100);
  };

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const result = {};
          for (const id of ids) {
            const val = keysData[`${type}-${id}`];
            if (val !== undefined) result[id] = val;
          }
          return result;
        },
        set: async (data) => {
          let changed = false;
          for (const type in data) {
            for (const id in data[type]) {
              const val = data[type][id];
              const key = `${type}-${id}`;
              if (val) { keysData[key] = val; changed = true; }
              else if (keysData[key]) { delete keysData[key]; changed = true; }
            }
          }
          if (changed) saveState();
        },
      },
    },
    saveCreds: saveState,
    forceSave: async () => { if (saveTimeout) clearTimeout(saveTimeout); await saveToDb(); },
  };
}

// ── Gera e exibe QR ──────────────────────────────────────────────────────────
async function showQR(qr, isRefresh = false) {
  // Terminal
  console.clear();
  console.log('━'.repeat(60));
  console.log('  🟢 MULTI TRIP — Conexão WhatsApp CRM' + (isRefresh ? ' (QR atualizado)' : ''));
  console.log('━'.repeat(60));
  console.log('\n  Escaneie no WhatsApp: Menu → Dispositivos Vinculados\n');
  const qrText = await QRCode.toString(qr, { type: 'terminal', small: true });
  console.log(qrText);
  console.log('  Aguardando leitura...\n');

  // HTML para browser (QR maior, mais fácil de escanear)
  const qrDataUrl = await QRCode.toDataURL(qr, { scale: 8 });
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>WhatsApp QR - Multi Trip</title>
<meta http-equiv="refresh" content="25">
<style>
  body{background:#111;display:flex;flex-direction:column;align-items:center;
       justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;color:#fff}
  h2{color:#c9a84c;margin-bottom:8px;font-size:22px}
  p{color:#888;font-size:13px;margin:4px 0 20px}
  img{background:#fff;padding:20px;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.5)}
  .hint{margin-top:20px;color:#666;font-size:12px;max-width:320px;text-align:center;line-height:1.6}
  .warn{color:#f97316}
</style></head>
<body>
  <h2>Multi Trip — WhatsApp CRM</h2>
  <p>${isRefresh ? '⚠️ QR atualizado — escaneie o novo abaixo' : 'Escaneie para conectar o número da equipe'}</p>
  <img src="${qrDataUrl}" alt="QR Code" width="280" height="280"/>
  <div class="hint">
    WhatsApp → Menu (⋮) → <strong>Dispositivos Vinculados</strong><br>
    → <strong>Vincular um Dispositivo</strong><br>
    <span class="warn">Esta página atualiza automaticamente a cada 25s</span>
  </div>
</body></html>`;

  writeFileSync(HTML_PATH, html);

  // Abre browser apenas na primeira vez
  if (!browserOpened) {
    browserOpened = true;
    try { execSync(`start "" "${HTML_PATH}"`); } catch {}
    console.log('  ✅ QR aberto no navegador. Se não abriu, acesse:');
    console.log(`     ${HTML_PATH}\n`);
  }
}

// ── Conexão principal ────────────────────────────────────────────────────────
async function connect() {
  attemptCount++;
  if (attemptCount > MAX_ATTEMPTS) {
    console.error(`\n❌ Falhou ${MAX_ATTEMPTS} vezes. Verifique a conexão e rode novamente.`);
    await prisma.$disconnect();
    process.exit(1);
  }

  if (attemptCount === 1) {
    console.log(`\n🔄 Limpando sessão anterior de ${PHONE}...`);
    await prisma.whatsappSession.deleteMany({ where: { phone: PHONE } });
  } else {
    console.log(`\n🔄 Reconectando... (tentativa ${attemptCount}/${MAX_ATTEMPTS})`);
  }

  const { version } = await fetchLatestWaWebVersion().catch(() => ({
    version: [2, 3000, 1019247545],
  }));
  if (attemptCount === 1) console.log(`📡 Versão WA: ${version.join('.')}\n`);

  const { state, saveCreds, forceSave } = await usePrismaAuthState(PHONE);

  const socket = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 30000,
    keepAliveIntervalMs: 10000,
  });

  socket.ev.on('creds.update', saveCreds);

  let qrHandled = false;

  socket.ev.on('connection.update', async (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      await showQR(qr, qrHandled);
      qrHandled = true;
    }

    if (connection === 'open') {
      console.log('\n' + '━'.repeat(60));
      console.log('  ✅ CONECTADO COM SUCESSO!');
      console.log('━'.repeat(60));
      console.log(`  Número: ${socket.user?.id?.split(':')[0] || PHONE}`);
      console.log(`  Nome:   ${socket.user?.name || '—'}`);
      console.log('\n  ✅ Sessão salva no Neon. Vercel vai usar automaticamente.\n');

      await forceSave();
      try { unlinkSync(HTML_PATH); } catch {}
      socket.end(undefined);
      await prisma.$disconnect();
      process.exit(0);
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;

      if (code === DisconnectReason.loggedOut) {
        console.error('\n❌ Desconectado (logged out). Rode novamente.');
        try { unlinkSync(HTML_PATH); } catch {}
        await prisma.$disconnect();
        process.exit(1);
      }

      // 515 = restartRequired (QR expirou sem scan), outros = falha temporária
      const delay = code === 515 ? 1000 : 3000;
      console.log(`  ⚠️  Fechou (código ${code}) — novo QR em ${delay / 1000}s...`);
      setTimeout(() => connect(), delay);
    }
  });
}

// Timeout global de 5 minutos
setTimeout(() => {
  console.error('\n⏱️  5 minutos sem conexão. Rode o script novamente.');
  try { unlinkSync(HTML_PATH); } catch {}
  prisma.$disconnect();
  process.exit(1);
}, 300000);

await connect();
