#!/usr/bin/env node

import pkg from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
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
    console.log('📦 Importando fornecedores...\n');

    // Ler dados do arquivo JSON
    const jsonFile = './fornecedores-import.json';
    if (!fs.existsSync(jsonFile)) {
      console.error('❌ Arquivo não encontrado:', jsonFile);
      process.exit(1);
    }

    const fornecedoresRaw = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));

    // Importar cada fornecedor
    for (const f of fornecedoresRaw) {
      const fornecedor = await prisma.fornecedor.create({
        data: {
          nome: f.nome,
          produto: f.produto,
          whatsapp: f.whatsapp || null,
          email: f.email || null,
          ativo: true,
        },
      });

      console.log(`✅ ${fornecedor.nome} (${fornecedor.produto})`);
    }

    console.log(`\n✨ ${fornecedoresRaw.length} fornecedor(es) importado(s) com sucesso!`);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
