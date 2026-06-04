import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";


const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(process.cwd(), "leads-b2b-agencias.csv");
  const lines = fs.readFileSync(filePath, "latin1").split("\n").filter(Boolean);
  
  const headers = lines[0].split(",").map(h => h.trim());
  let imported = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(",");
    
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx]?.trim() || "";
    });

    const email = record["email"];
    const name = record["nome"];
    const city = record["cidade"];
    const state = record["estado"];
    const instagram = record["instagram"];
    const site = record["site"];
    const nicho = record["nicho"];
    let status = record["status"] || "a_enviar";

    // Validar email
    if (!email || !email.includes("@")) {
      skipped++;
      continue;
    }

    const existing = await prisma.b2bContact.findFirst({
      where: { email }
    });

    if (existing) {
      await prisma.b2bContact.update({
        where: { id: existing.id },
        data: {
          name,
          city,
          state,
          instagram,
          site,
          notes: nicho ? `Nicho: ${nicho}` : undefined,
        }
      });
    } else {
      await prisma.b2bContact.create({
        data: {
          name,
          city,
          state,
          instagram,
          email,
          site,
          notes: nicho ? `Nicho: ${nicho}` : undefined,
          status,
        }
      });
    }

    imported++;
    if (imported % 50 === 0) {
      console.log(`Importados ${imported}...`);
    }
  }

  console.log(`Feito! Importados/Atualizados: ${imported}. Ignorados (sem email válido): ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
