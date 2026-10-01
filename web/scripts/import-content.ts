#!/usr/bin/env tsx
/**
 * Import a chapter JSON into Supabase.
 *
 * Reads content/chapter-NN.json (or an explicit path), upserts the chapter and
 * its verses, and maps combined-verse ranges. Uses the service-role key, which
 * is one of the two legitimate uses of that key (no user session in a CLI).
 * Idempotent: upserts on (chapter_number) and (chapter_id, verse_number).
 *
 * It deliberately accepts DRAFT files that still contain review markers
 * ([?] / [पुनरावलोकन आवश्यक]). The point of this launch is to get the content
 * into the database so the Marathi-speaking admin can fix it in the browser;
 * the markers travel with the text and are edited away in the admin UI.
 *
 * Usage:
 *   npm run content:import -- 01
 *   npm run content:import -- content/chapter-01.draft.json
 *   npm run content:import -- 01 --dry-run
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/lib/database.types";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

const CONTENT_DIR = path.join(process.cwd(), "..", "content");

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

interface VerseJson {
  verse_number: number;
  verse_number_end?: number | null;
  sanskrit_text: string;
  word_to_word?: string | null;
  translation?: string | null;
  purport?: string | null;
  easy_explanation?: string | null;
  example?: string | null;
  audio_url?: string | null;
  audio_provider?: "supabase_storage" | "google_drive" | "external" | null;
}

interface ChapterJson {
  chapter_number: number;
  name_sanskrit: string;
  name_marathi: string;
  description?: string | null;
  verses: VerseJson[];
}

function resolveFile(arg: string): string {
  // Accept "01", "1", "chapter-01.json", a .draft.json, or a full path.
  if (arg.includes("/") || arg.includes("\\") || arg.endsWith(".json")) {
    return path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg);
  }
  const nn = arg.replace(/\D/g, "").padStart(2, "0");
  // Prefer the final file; fall back to the draft so launch content imports.
  const final = path.join(CONTENT_DIR, `chapter-${nn}.json`);
  const draft = path.join(CONTENT_DIR, `chapter-${nn}.draft.json`);
  try {
    readFileSync(final);
    return final;
  } catch {
    return draft;
  }
}

function nn(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : null;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const target = args.find((a) => a !== "--dry-run");
  if (!target) {
    console.error(`${RED}Usage:${RESET} npm run content:import -- 01 [--dry-run]`);
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(`${RED}Missing Supabase env in .env.local${RESET}`);
    process.exit(1);
  }

  const file = resolveFile(target);
  let chapter: ChapterJson;
  try {
    chapter = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`${RED}Could not read/parse ${file}:${RESET} ${(e as Error).message}`);
    process.exit(1);
  }

  const isDraft = file.endsWith(".draft.json");
  const markerCount = JSON.stringify(chapter).match(/\[\?\]|पुनरावलोकन आवश्यक/g)?.length ?? 0;

  console.log(`${DIM}Importing ${path.basename(file)} — chapter ${chapter.chapter_number}, ${chapter.verses.length} verses${RESET}`);
  if (isDraft) {
    console.log(`${YELLOW}DRAFT import: ${markerCount} review marker(s) will be stored for in-app editing.${RESET}`);
  }

  if (dryRun) {
    console.log(`${YELLOW}Dry run — nothing written.${RESET}`);
    return;
  }

  const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });

  // Upsert the chapter.
  const { data: chapterRow, error: chErr } = await supabase
    .from("chapters")
    .upsert(
      {
        chapter_number: chapter.chapter_number,
        name_sanskrit: chapter.name_sanskrit,
        name_marathi: chapter.name_marathi,
        description: nn(chapter.description),
        total_verses: Math.max(chapter.verses.length, lastVerseNumber(chapter)),
        display_order: chapter.chapter_number,
      },
      { onConflict: "chapter_number" },
    )
    .select("id")
    .single();

  if (chErr || !chapterRow) {
    console.error(`${RED}Chapter upsert failed:${RESET} ${chErr?.message}`);
    process.exit(1);
  }

  let ok = 0;
  for (const v of chapter.verses) {
    const { error } = await supabase.from("verses").upsert(
      {
        chapter_id: chapterRow.id,
        verse_number: v.verse_number,
        verse_number_end:
          v.verse_number_end && v.verse_number_end !== v.verse_number
            ? v.verse_number_end
            : null,
        sanskrit_text: v.sanskrit_text,
        word_to_word: nn(v.word_to_word),
        translation: nn(v.translation),
        purport: nn(v.purport),
        easy_explanation: nn(v.easy_explanation),
        example: nn(v.example),
        audio_url: nn(v.audio_url),
        audio_provider: v.audio_provider ?? (nn(v.audio_url) ? "supabase_storage" : null),
        display_order: v.verse_number,
      },
      { onConflict: "chapter_id,verse_number" },
    );
    if (error) {
      console.error(`${RED}  verse ${v.verse_number} failed:${RESET} ${error.message}`);
    } else {
      ok++;
    }
  }

  console.log(`\n${GREEN}Done.${RESET} Chapter ${chapter.chapter_number}: ${ok}/${chapter.verses.length} verses imported.`);
  if (isDraft) {
    console.log(`The admin can now edit and correct these verses in the admin UI.`);
  }
}

function lastVerseNumber(chapter: ChapterJson): number {
  return chapter.verses.reduce(
    (max, v) => Math.max(max, v.verse_number_end ?? v.verse_number),
    0,
  );
}

main().catch((err) => {
  console.error(`${RED}Unexpected error:${RESET}`, err);
  process.exit(1);
});
