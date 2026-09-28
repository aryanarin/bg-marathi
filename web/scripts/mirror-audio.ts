#!/usr/bin/env tsx
/**
 * Mirror local verse-recitation audio into Supabase Storage.
 *
 * Why mirror at all: the upstream index (bhakti.eu.org) serves signed,
 * time-limited URLs with no range support, so seeking breaks and links expire.
 * Copying the files into our own Storage bucket gives stable public URLs with
 * proper Content-Type and range requests, and removes the runtime dependency on
 * a third party. See docs/content-import.md.
 *
 * Source layout:  <root>/CC/Bg-CC-VV.mp3  (and Bg-CC-VV-VV.mp3 for combined)
 * Bucket layout:  verse-audio/CC/Bg-CC-VV.mp3   (path preserved, hyphen trimmed)
 *
 * Idempotent: re-running upserts, so a partial run can simply be repeated.
 * Uses the service-role key (no user session in a CLI), which is one of the two
 * legitimate uses of that key.
 *
 * Usage:
 *   npm run audio:mirror -- --source "D:\path\to\BG Verse Pronunciation"
 *   npm run audio:mirror -- --source "..." --chapter 01
 *   npm run audio:mirror -- --source "..." --dry-run
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

const BUCKET = "verse-audio";

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`);

interface AudioFile {
  chapter: string; // "01"
  filename: string; // "Bg-01-16-18.mp3"
  storagePath: string; // "01/Bg-01-16-18.mp3"
  absPath: string;
  size: number;
}

/**
 * Normalise a filename. Chapter 18 has 11 files with a trailing hyphen
 * (Bg-18-55-.mp3); trim it so stored names are clean and predictable.
 */
function cleanFilename(raw: string): string {
  return raw.replace(/-+(\.mp3)$/i, "$1");
}

function collect(root: string, chapterFilter?: string): AudioFile[] {
  const out: AudioFile[] = [];
  for (let ch = 1; ch <= 18; ch++) {
    const cc = String(ch).padStart(2, "0");
    if (chapterFilter && cc !== chapterFilter) continue;

    const dir = path.join(root, cc);
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      continue;
    }

    for (const raw of entries.filter((f) => /\.mp3$/i.test(f))) {
      const filename = cleanFilename(raw);
      out.push({
        chapter: cc,
        filename,
        storagePath: `${cc}/${filename}`,
        absPath: path.join(dir, raw),
        size: statSync(path.join(dir, raw)).size,
      });
    }
  }
  return out.sort((a, b) => a.storagePath.localeCompare(b.storagePath));
}

async function main() {
  const source = arg("source");
  const chapter = arg("chapter");
  const dryRun = hasFlag("dry-run");

  if (!source) {
    console.error(
      `${RED}--source is required.${RESET}\n` +
        `Example: npm run audio:mirror -- --source "D:\\Bhagavad Gita Marathi Project\\BG Verse Pronunciation"`,
    );
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(`${RED}Missing Supabase env.${RESET} Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.`);
    process.exit(1);
  }

  const files = collect(source, chapter?.padStart(2, "0"));
  if (files.length === 0) {
    console.error(`${RED}No .mp3 files found under ${source}${RESET}`);
    process.exit(1);
  }

  const totalMB = files.reduce((s, f) => s + f.size, 0) / 1048576;
  console.log(
    `${DIM}${files.length} files, ${totalMB.toFixed(1)} MB${chapter ? `, chapter ${chapter}` : ""}${RESET}\n`,
  );

  if (dryRun) {
    for (const f of files.slice(0, 10)) console.log(`  would upload  ${f.storagePath}`);
    if (files.length > 10) console.log(`  … and ${files.length - 10} more`);
    console.log(`\n${YELLOW}Dry run — nothing uploaded.${RESET}`);
    return;
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Ensure the bucket exists and is public. Public is deliberate: recitation
  // audio is not secret, and public URLs avoid signed URLs expiring mid-play.
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ["audio/mpeg"],
      fileSizeLimit: "5MB",
    });
    if (error) {
      console.error(`${RED}Could not create bucket:${RESET} ${error.message}`);
      process.exit(1);
    }
    console.log(`${GREEN}Created bucket '${BUCKET}' (public).${RESET}\n`);
  }

  let ok = 0;
  let failed = 0;

  for (const f of files) {
    const body = readFileSync(f.absPath);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(f.storagePath, body, {
        contentType: "audio/mpeg",
        upsert: true,
        cacheControl: "31536000", // 1 year; files never change
      });

    if (error) {
      console.log(`  ${RED}fail${RESET}  ${f.storagePath}  ${error.message}`);
      failed++;
    } else {
      ok++;
      if (ok % 25 === 0 || ok === files.length) {
        process.stdout.write(`\r  ${GREEN}${ok}${RESET}/${files.length} uploaded`);
      }
    }
  }

  console.log(`\n\n${GREEN}Done.${RESET} ${ok} uploaded, ${failed} failed.`);

  const sample = supabase.storage.from(BUCKET).getPublicUrl(files[0].storagePath);
  console.log(`\nSample public URL:\n  ${sample.data.publicUrl}`);

  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(`${RED}Unexpected error:${RESET}`, error);
  process.exit(1);
});
