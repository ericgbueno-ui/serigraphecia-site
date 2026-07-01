import crypto from "crypto";

/**
 * Hash e verificação de senha usando scrypt (nativo do Node, sem dependências
 * novas no projeto). Formato armazenado: "salt:hash", ambos em hex.
 *
 * Por que scrypt e não bcrypt/argon2: bcrypt/argon2 exigiriam adicionar uma
 * dependência nativa (node-gyp) ao projeto. scrypt já é parte do Node.js e é
 * adequado para senhas de uso administrativo interno (poucos usuários).
 */

const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!password || !stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  try {
    const a = crypto.scryptSync(password, salt, KEY_LEN);
    const b = Buffer.from(hash, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
