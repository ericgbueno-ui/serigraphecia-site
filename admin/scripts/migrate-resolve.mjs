/**
 * Script de pre-build para destravar migrations realmente falhadas no banco.
 * Detecta entradas pendentes em `_prisma_migrations`, marca como rolled back
 * apenas as que estão efetivamente em estado failed e depois executa deploy.
 *
 * Uso: node scripts/migrate-resolve.mjs
 */

import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getFailedMigrations() {
  try {
    const rows = await prisma.$queryRaw`
      SELECT migration_name
      FROM _prisma_migrations
      WHERE finished_at IS NULL
        AND rolled_back_at IS NULL
      ORDER BY started_at ASC
    `;
    return rows.map((row) => row.migration_name).filter(Boolean);
  } catch (e) {
    console.log("\n→ Tabela _prisma_migrations não encontrada. Pulando verificação.");
    return [];
  }
}

function run(cmd, { allowFailure = false } = {}) {
  console.log(`\n→ ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (e) {
    if (!allowFailure) {
      throw e;
    }
    console.warn(`  ⚠ Aviso ao executar: ${cmd}\n  ${e.message}`);
  }
}

async function main() {
  try {
    const failedMigrations = await getFailedMigrations();

    if (failedMigrations.length === 0) {
      console.log("\n→ Nenhuma migration falhada encontrada.");
    } else {
      for (const name of failedMigrations) {
        run(`npx prisma migrate resolve --rolled-back ${name}`);
      }
    }

    run("npx prisma migrate deploy", { allowFailure: true });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

main().catch((err) => {
  console.error("\n✖ Falha no script de migrations:");
  console.error(err);
  process.exit(1);
});
