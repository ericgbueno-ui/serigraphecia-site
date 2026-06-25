#!/usr/bin/env node

import pkg from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envFile, 'utf-8');
const lines = envContent.split('\n');
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...rest] = trimmed.split('=');
    let value = rest.join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🧹 Limpando fornecedores duplicados...\n');

    // Buscar todos os Marfels
    const marfels = await prisma.fornecedor.findMany({
      where: { nome: 'Marfel' },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${marfels.length} Marfel records:`);
    marfels.forEach((m, i) => {
      console.log(`  ${i + 1}. ID: ${m.id} | Produto: ${m.produto} | Email: ${m.email}`);
    });

    if (marfels.length > 1) {
      // Manter o mais antigo (correto), deletar os novos
      const toDelete = marfels.slice(1);

      for (const m of toDelete) {
        await prisma.fornecedor.delete({
          where: { id: m.id },
        });
        console.log(`\n✅ Deletado: ${m.produto}`);
      }

      console.log(`\n✨ Limpeza concluída!`);
      console.log(`   Total antes: ${marfels.length}`);
      console.log(`   Total depois: 1`);
    } else {
      console.log('✓ Nenhum duplicado encontrado');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
