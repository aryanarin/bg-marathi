#!/usr/bin/env tsx
/**
 * Apply SQL migrations to the Supabase Postgres database, in filename order.
 *
 * Uses SUPABASE_DB_URL (the pooled Postgres connection), which only these
 * scripts read. Applied migrations are recorded in a `schema_migrations` table,
 * so re-running is safe: already-applied files are skipped. Each file runs
 * inside a transaction, so a failure leaves no half-applied migration.
 *
 * Usage:
 *   npm run db:migrate            apply pending migrations
 *   npm run db:migrate -- --status   show which are applied / pending
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import { config as loadEnv } from "dotenv";
import { Client } from "pg";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

const MIGRATIONS_DIR = path.join(process.cwd(), "..", "supabase", "migrations");

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function connectionString(): string {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error(
      `${RED}SUPABASE_DB_URL is not set.${RESET} Add the pooled Postgres URL to web/.env.local. See docs/setup.md.`,
    );
    process.exit(1);
  }
  return url;
}

function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d{4}_.*\.sql$/.test(f))
    .sort();
}

async function main() {
  const statusOnly = process.argv.includes("--status");
  const client = new Client({
    connectionString: connectionString(),
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    await client.query(`
      create table if not exists public.schema_migrations (
        filename    text primary key,
        applied_at  timestamptz not null default now()
      );
    `);

    const applied = new Set(
      (await client.query<{ filename: string }>("select filename from public.schema_migrations"))
        .rows.map((r) => r.filename),
    );

    const files = migrationFiles();

    if (statusOnly) {
      console.log(`${DIM}Migrations in ${MIGRATIONS_DIR}${RESET}\n`);
      for (const f of files) {
        const mark = applied.has(f) ? `${GREEN}applied${RESET}` : `${YELLOW}pending${RESET}`;
        console.log(`  ${mark}  ${f}`);
      }
      return;
    }

    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      console.log(`${GREEN}Up to date.${RESET} ${files.length} migration(s) already applied.`);
      return;
    }

    console.log(`${DIM}Applying ${pending.length} migration(s)…${RESET}\n`);

    for (const file of pending) {
      const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      process.stdout.write(`  ${file} … `);

      try {
        await client.query("begin");
        await client.query(sql);
        await client.query(
          "insert into public.schema_migrations (filename) values ($1)",
          [file],
        );
        await client.query("commit");
        console.log(`${GREEN}ok${RESET}`);
      } catch (error) {
        await client.query("rollback");
        console.log(`${RED}failed${RESET}`);
        console.error(`\n${RED}${(error as Error).message}${RESET}`);
        console.error(`\nRolled back ${file}. No partial migration was applied.`);
        process.exit(1);
      }
    }

    console.log(`\n${GREEN}Done.${RESET} Applied ${pending.length} migration(s).`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`${RED}Unexpected error:${RESET}`, error);
  process.exit(1);
});
