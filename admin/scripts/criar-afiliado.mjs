/**
 * Cria um afiliado no banco de dados.
 * Uso: node scripts/criar-afiliado.mjs
 *
 * Variáveis de ambiente necessárias: DATABASE_URL
 * (ou rode com: DATABASE_URL=file:./prisma/dev.db node scripts/criar-afiliado.mjs)
 */
import { createInterface } from "readline";
import * as crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

// scrypt igual ao affiliateAuth.ts
async function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  const dk = await new Promise((res, rej) =>
    crypto.scrypt(plain, salt, 64, { N: 16384, r: 8, p: 1 }, (e, d) => (e ? rej(e) : res(d)))
  );
  return `scrypt:${salt}:${dk.toString("hex")}`;
}

async function main() {
  console.log("\n=== Criar novo afiliado — Multi Trip ===\n");

  const name = (await ask("Nome completo: ")).trim();
  const email = (await ask("E-mail: ")).trim().toLowerCase();
  const whatsapp = (await ask("WhatsApp (só números): ")).trim().replace(/\D/g, "");
  const code = (await ask("Código do afiliado (ex: joao-silva): "))
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "");
  const password = (await ask("Senha: ")).trim();

  rl.close();

  if (!name || !email || !whatsapp || !code || !password) {
    console.error("Todos os campos são obrigatórios.");
    process.exit(1);
  }

  const existing = await prisma.affiliate.findUnique({ where: { code } });
  if (existing) {
    console.error(`Código "${code}" já existe.`);
    process.exit(1);
  }

  const hashed = await hashPassword(password);
  const aff = await prisma.affiliate.create({
    data: { name, email, whatsapp, code, password: hashed, active: true },
  });

  console.log(`\n✅ Afiliado criado!`);
  console.log(`   ID:      ${aff.id}`);
  console.log(`   Nome:    ${aff.name}`);
  console.log(`   Código:  ${aff.code}`);
  console.log(
    `   Link:    https://www.multitrip.com.br/transfer/porto-alegre-gramado?ref=${aff.code}`
  );
  console.log(`   Comissão: R$ 25 (ida/volta) · R$ 50 (ida+volta)\n`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
