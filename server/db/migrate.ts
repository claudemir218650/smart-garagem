import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const sql = neon(process.env.DATABASE_URL);

  const schemaPath = resolve(__dirname, "schema.sql");
  const ddl = readFileSync(schemaPath, "utf8");

  // Split por ";" no nível superior, mas mantendo blocos DO $$ ... $$;
  const statements = splitSql(ddl);

  console.log(`Aplicando ${statements.length} statements...`);
  for (const stmt of statements) {
    const trimmed = stmt.trim();
    if (!trimmed) continue;
    try {
      await sql.query(trimmed);
    } catch (err: any) {
      console.error("Falha em statement:\n", trimmed.slice(0, 200), "...");
      throw err;
    }
  }
  console.log("Migração concluída com sucesso.");
}

function splitSql(input: string): string[] {
  const out: string[] = [];
  let buf = "";
  let inDollar = false;
  let inLine = false;
  let inBlock = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next2 = input.slice(i, i + 2);

    if (!inDollar) {
      if (!inBlock && next2 === "--") { inLine = true; }
      if (!inLine && next2 === "/*") { inBlock = true; }
      if (inLine && ch === "\n") { inLine = false; }
      if (inBlock && next2 === "*/") { inBlock = false; buf += ch; continue; }
    }

    if (!inLine && !inBlock && next2 === "$$") {
      inDollar = !inDollar;
      buf += "$$";
      i++;
      continue;
    }

    if (!inDollar && !inLine && !inBlock && ch === ";") {
      out.push(buf);
      buf = "";
      continue;
    }

    if (!inLine && !inBlock) buf += ch;
    else if (inLine) buf += ch;
  }
  if (buf.trim()) out.push(buf);
  return out;
}

main().catch((e) => { console.error(e); process.exit(1); });
