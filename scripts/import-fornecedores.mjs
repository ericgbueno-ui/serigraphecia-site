#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Dados dos fornecedores extraídos dos PDFs
const fornecedoresData = [
  // Alquimia
  {
    nome: 'Alquimia',
    produto: 'Tintas e Químicos',
    whatsapp: null,
    email: null,
  },
  // Marfel
  {
    nome: 'Marfel',
    produto: 'Sacolas Plásticas',
    whatsapp: null,
    email: null,
  },
];

async function importarFornecedores() {
  try {
    console.log('📦 Iniciando importação de fornecedores...');

    // Tentar ler os PDFs para extrair dados
    const pdfPaths = [
      'C:\\Users\\User\\OneDrive\\Desktop\\tabela valore\\Alquimia.pdf',
      'C:\\Users\\User\\OneDrive\\Desktop\\tabela valore\\Marfel.pdf',
    ];

    for (const pdfPath of pdfPaths) {
      if (fs.existsSync(pdfPath)) {
        console.log(`\n📄 Lendo: ${path.basename(pdfPath)}`);
        try {
          const buffer = fs.readFileSync(pdfPath);
          const data = await pdfParse(buffer);
          console.log(`   ✓ ${data.numpages} páginas extraídas`);
          console.log(`   Texto preview: ${data.text.substring(0, 200)}...`);
        } catch (err) {
          console.log(`   ⚠ Erro ao processar PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      } else {
        console.log(`   ⚠ Arquivo não encontrado: ${pdfPath}`);
      }
    }

    // Salvar dados em JSON temporário
    const outputPath = path.join(projectRoot, 'fornecedores-import.json');
    fs.writeFileSync(outputPath, JSON.stringify(fornecedoresData, null, 2));
    console.log(`\n✅ Dados salvos em: ${outputPath}`);
    console.log('\n📋 Para importar no banco, execute:');
    console.log(`curl -X POST http://localhost:3000/api/admin/fornecedores -H "Content-Type: application/json" -d @fornecedores-import.json`);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

importarFornecedores();
