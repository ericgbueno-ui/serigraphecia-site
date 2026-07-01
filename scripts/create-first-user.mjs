// Cria (ou atualiza) um usuário individual do painel administrativo.
//
// Por que este script existe: antes da Fase 1 da auditoria de 2026-07-01, o
// admin tinha apenas uma senha compartilhada (ADMIN_PASSWORD). Este script
// cria a primeira conta individual (a sua) para que o login por e-mail/senha
// comece a funcionar. A senha compartilhada continua ativa em paralelo até
// que toda a equipe tenha conta própria — nada quebra durante a transição.
//
// Rode a partir da raiz do projeto, no seu computador (não neste sandbox),
// onde o Prisma Client já está gerado corretamente para o seu ambiente:
//
//   node scripts/create-first-user.mjs "Eric Bueno" "ericgbueno@gmail.com" "SUA_SENHA_NOVA_AQUI"
//
// A senha é armazenada como hash (scrypt) — nunca em texto puro.

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const [, , name, email, password] = process.argv;

if (!name || !email || !password) {
  console.error("Uso: node scripts/create-first-user.mjs \"Nome\" \"email@exemplo.com\" \"senha\"");
  process.exit(1);
}

if (password.length < 8) {
  console.error("A senha deve ter pelo menos 8 caracteres.");
  process.exit(1);
}

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const prisma = new PrismaClient();

try {
  const passwordHash = hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase().trim() },
    update: { name, passwordHash, active: true },
    create: { name, email: email.toLowerCase().trim(), passwordHash, role: "admin", active: true },
  });
  console.log(`Usuário pronto: ${user.name} <${user.email}> (id: ${user.id})`);
  console.log("Já pode fazer login em /admin usando este e-mail e a senha informada.");
} catch (err) {
  console.error("Erro ao criar usuário:", err.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
