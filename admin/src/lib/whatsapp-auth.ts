import { AuthenticationCreds, AuthenticationState, BufferJSON, initAuthCreds } from '@whiskeysockets/baileys';
import { prisma } from '@/lib/db';

export async function usePrismaAuthState(phone: string) {
  let session = await prisma.whatsappSession.findUnique({
    where: { phone },
  });

  let creds: AuthenticationCreds;
  let keysData: { [key: string]: any } = {};

  if (session && session.data) {
    try {
      const parsed = JSON.parse(session.data, BufferJSON.reviver);
      creds = parsed.creds || initAuthCreds();
      keysData = parsed.keys || {};
    } catch (e) {
      console.error('Error parsing WhatsApp session data, using fresh creds:', e);
      creds = initAuthCreds();
    }
  } else {
    creds = initAuthCreds();
  }

  let saveTimeout: NodeJS.Timeout | null = null;
  let isSaving = false;

  // Função interna que realmente vai ao banco
  const _saveStateToDb = async () => {
    if (isSaving) return;
    isSaving = true;
    try {
      const dataStr = JSON.stringify({ creds, keys: keysData }, BufferJSON.replacer);
      await prisma.whatsappSession.upsert({
        where: { phone },
        update: { data: dataStr },
        create: { phone, data: dataStr },
      });
    } catch (err) {
      console.error('[WhatsApp Auth] Erro ao salvar estado no banco:', err);
    } finally {
      isSaving = false;
    }
  };

  // Função "debounced" (atrasada)
  // Durante o scan do QR code, o Baileys emite centenas de chaves em <1 segundo.
  // 100ms agrupa as chaves sem atrasar o handshake (WhatsApp espera ~2s).
  const saveState = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      _saveStateToDb();
    }, 100);
  };

  const state: AuthenticationState = {
    creds,
    keys: {
      get: async (type, ids) => {
        const result: { [id: string]: any } = {};
        for (const id of ids) {
          const dictKey = `${type}-${id}`;
          const value = keysData[dictKey];
          if (value) {
            result[id] = value;
          }
        }
        return result;
      },
      set: async (data: any) => {
        let changed = false;
        for (const type in data) {
          for (const id in data[type]) {
            const value = data[type][id];
            const dictKey = `${type}-${id}`;
            if (value) {
              keysData[dictKey] = value;
              changed = true;
            } else if (keysData[dictKey]) {
              delete keysData[dictKey];
              changed = true;
            }
          }
        }
        if (changed) {
          saveState(); // Não usa await aqui para não bloquear o Baileys!
        }
      },
    },
  };

  return {
    state,
    saveCreds: async () => {
      saveState(); // Também não bloqueia
    },
    // Método útil para forçar salvamento caso precisemos fechar a conexão de imediato
    forceSave: async () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      await _saveStateToDb();
    }
  };
}
