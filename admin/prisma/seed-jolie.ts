/**
 * JOLIE — SEED INICIAL
 *
 * Importa todo o cérebro-jolie para o banco Neon:
 *
 * 1. JolieBrain v1 — prompt mestre (brain.ts → banco)
 * 2. JolieKnowledge — todos os arquivos do vault Obsidian como chunks vetorizados
 *
 * Execução:
 *   npx tsx prisma/seed-jolie.ts
 *
 * Requisitos:
 *   DATABASE_URL e OPENAI_API_KEY no .env.local
 */

import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ─── CONFIGURAÇÃO DOS CHUNKS ──────────────────────────────────────────────────

const CEREBRO_PATH = path.join(process.cwd(), "ia-jolie-cerebro");

// Mapeamento inteligente de categorias baseado no prefixo do arquivo ou pasta (sem emojis)
function getChunkType(fileName: string, folderName: string): string {
  const cleanFile = fileName.toLowerCase();
  const cleanFolder = folderName.toLowerCase();

  // Caso especial: Prompt Mestre e Índices
  if (
    cleanFile.includes("boas-vindas") ||
    cleanFile.includes("índice") ||
    cleanFile.includes("prompt mestre")
  ) {
    return "cerebro_master";
  }

  // Mapeamento baseado no prefixo do nome do arquivo
  if (cleanFile.startsWith("clientes")) return "perfil_cliente";
  if (cleanFile.startsWith("jolie")) return "identidade";
  if (cleanFile.startsWith("copy")) return "persuasao";
  if (cleanFile.startsWith("script")) return "script";
  if (cleanFile.startsWith("vendas")) return "vendas";
  if (cleanFile.startsWith("mentoria")) return "referencia";
  if (cleanFile.startsWith("empresa")) return "institucional";
  if (cleanFile.startsWith("operacional")) return "operacional";
  if (cleanFile.startsWith("marketing")) return "marketing";

  // Mapeamento baseado na pasta
  if (
    cleanFolder.includes("concierge") ||
    cleanFolder.includes("gramado") ||
    cleanFolder.includes("canela") ||
    cleanFile.startsWith("canela") ||
    cleanFile.startsWith("gramado") ||
    cleanFile.startsWith("concierge")
  ) {
    return "turismo";
  }
  if (cleanFolder.includes("vendas") || cleanFolder.includes("técnicas")) return "vendas";
  if (cleanFolder.includes("líder") || cleanFolder.includes("mentora")) return "referencia";
  if (cleanFolder.includes("multi trip")) return "institucional";
  if (cleanFolder.includes("marketing")) return "marketing";
  if (cleanFolder.includes("mentores")) return "referencia";

  return "geral";
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function embed(text: string): Promise<number[] | null> {
  if (!openai) return null;
  try {
    const res = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
      dimensions: 1536,
    });
    return res.data[0].embedding;
  } catch (err: any) {
    console.warn("  ⚠️ Embedding falhou:", err.message);
    return null;
  }
}

function toVec(emb: number[]): string {
  return `[${emb.join(",")}]`;
}

/** Divide markdown em chunks por seção (## headers) */
function chunkMarkdown(content: string, maxChars = 2000): Array<{ title: string; body: string }> {
  const sections: Array<{ title: string; body: string }> = [];
  const lines = content.split("\n");

  let currentTitle = "Introdução";
  let currentBody: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentBody.join("\n").trim().length > 50) {
        sections.push({ title: currentTitle, body: currentBody.join("\n").trim() });
      }
      currentTitle = line.replace(/^##\s+/, "").trim();
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }

  if (currentBody.join("\n").trim().length > 50) {
    sections.push({ title: currentTitle, body: currentBody.join("\n").trim() });
  }

  // Se o arquivo não tem seções, usa ele inteiro como um chunk
  if (sections.length === 0 && content.trim().length > 50) {
    sections.push({ title: "Conteúdo", body: content.trim().slice(0, maxChars) });
  }

  // Trunca chunks muito grandes
  return sections.map((s) => ({
    title: s.title,
    body: s.body.slice(0, maxChars),
  }));
}

function getAllMarkdownFiles(dir: string, baseDir = dir): Array<{ file: string; folder: string }> {
  const results: Array<{ file: string; folder: string }> = [];

  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ Diretório não encontrado: ${dir}`);
    return results;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith(".")) {
        results.push(...getAllMarkdownFiles(fullPath, baseDir));
      }
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      const relativePath = path.relative(baseDir, dir);
      results.push({
        file: fullPath,
        folder: relativePath || "root",
      });
    }
  }

  return results;
}

// ─── SEED JOLIE BRAIN ────────────────────────────────────────────────────────

async function seedJolieBrain(): Promise<void> {
  console.log("\n🧠 Seedando JolieBrain (prompt mestre)...");

  // Verifica se já existe versão ativa
  const existing = await prisma.jolieBrain.findFirst({ where: { active: true } });
  if (existing) {
    console.log(`  ⏭️ JolieBrain já existe (v${existing.version}) — pulando.`);
    return;
  }

  // Carrega o prompt do arquivo
  const promptFile = path.join(
    CEREBRO_PATH,
    "4. MULTI TRIP",
    "Operacional — Backup Prompt Mestre WhatsApp.md"
  );
  let corePrompt: string;

  if (fs.existsSync(promptFile)) {
    corePrompt = fs
      .readFileSync(promptFile, "utf-8")
      .replace(/\*\*Cole este arquivo.*?\*\*/g, "")
      .trim();
    console.log("  ✅ Prompt carregado do arquivo markdown.");
  } else {
    // Fallback: importa do brain.ts via require
    const { JOLIE_SYSTEM_PROMPT } = await import("../src/lib/jolie/brain");
    corePrompt = JOLIE_SYSTEM_PROMPT;
    console.log("  ✅ Prompt carregado do brain.ts (fallback).");
  }

  await prisma.jolieBrain.create({
    data: {
      version: 1,
      active: true,
      corePrompt,
      note: "Seed inicial — importado do brain.ts/cerebro-jolie",
      updatedBy: "seed",
    },
  });

  console.log("  ✅ JolieBrain v1 criado e ativo.");
}

// ─── SEED JOLIE KNOWLEDGE ────────────────────────────────────────────────────

async function seedJolieKnowledge(): Promise<void> {
  console.log("\n📚 Seedando JolieKnowledge (chunks do cérebro-jolie)...");

  const files = getAllMarkdownFiles(CEREBRO_PATH);
  console.log(`  Encontrados ${files.length} arquivos markdown.`);

  let total = 0;
  let skipped = 0;

  for (const { file, folder } of files) {
    const fileName = path.basename(file, ".md");
    const type = getChunkType(fileName, folder);
    const content = fs.readFileSync(file, "utf-8");
    const chunks = chunkMarkdown(content);

    for (const chunk of chunks) {
      const fullContent = `${chunk.body}`;
      const title = `${fileName} — ${chunk.title}`;

      // Verifica duplicata
      const exists = await prisma.jolieKnowledge.findFirst({
        where: { title, source: "cerebro_jolie" },
      });

      if (exists) {
        skipped++;
        continue;
      }

      const embedding = await embed(fullContent);
      const sourceRef = file.replace(CEREBRO_PATH, "").replace(/\\/g, "/");

      if (embedding) {
        const embSQL = toVec(embedding);
        await prisma.$executeRaw`
          INSERT INTO "JolieKnowledge" (id, type, title, content, source, "sourceRef", embedding, "successRate", "usageCount", active, "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, ${type}, ${title}, ${fullContent}, 'cerebro_jolie', ${sourceRef}, ${embSQL}::vector, 0, 0, true, now(), now())
        `;
      } else {
        await prisma.$executeRaw`
          INSERT INTO "JolieKnowledge" (id, type, title, content, source, "sourceRef", "successRate", "usageCount", active, "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, ${type}, ${title}, ${fullContent}, 'cerebro_jolie', ${sourceRef}, 0, 0, true, now(), now())
        `;
      }

      total++;
      process.stdout.write(`\r  Chunks inseridos: ${total}`);

      // Rate limiting para não estourar a OpenAI
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log(`\n  ✅ ${total} chunks inseridos, ${skipped} já existiam.`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Jolie Seed — iniciando...\n");

  try {
    await seedJolieBrain();
    await seedJolieKnowledge();

    const brainCount = await prisma.jolieBrain.count();
    const knowledgeCount = await prisma.jolieKnowledge.count();

    console.log(`\n✅ Seed concluído!`);
    console.log(`   JolieBrain:     ${brainCount} versão(ões)`);
    console.log(`   JolieKnowledge: ${knowledgeCount} chunks`);
    console.log(`\n   A Jolie agora busca conhecimento do Neon. 🧠`);
  } catch (err) {
    console.error("❌ Seed falhou:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
