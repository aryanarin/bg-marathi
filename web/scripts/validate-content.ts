#!/usr/bin/env tsx
/**
 * Validate content files in /content before import.
 *
 * Usage:
 *   npm run content:validate              # validate every chapter-NN.json
 *   npm run content:validate -- 01 02     # validate specific chapters
 *
 * Exits non-zero on any error, so it can gate CI or a pre-import check.
 * This script only reads files. It never touches the database.
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { chapterContentSchema, findVerseGaps } from "../src/lib/content/schema";

const CONTENT_DIR = path.join(process.cwd(), "..", "content");

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

interface FileReport {
  file: string;
  errors: string[];
  warnings: string[];
  verseCount: number;
  chapterNumber: number | null;
}

async function listContentFiles(filters: string[]): Promise<string[]> {
  let entries: string[];

  try {
    entries = await readdir(CONTENT_DIR);
  } catch {
    console.error(
      `${RED}Could not read content directory:${RESET} ${CONTENT_DIR}\n` +
        `Create it and add chapter-01.json. See docs/content-import.md.`,
    );
    process.exit(1);
  }

  const files = entries
    .filter((f) => /^chapter-\d{2}\.json$/.test(f))
    .sort();

  if (filters.length === 0) return files;

  // Accept "1", "01" or "chapter-01.json" as a filter.
  const wanted = new Set(
    filters.map((f) => {
      const digits = f.replace(/\D/g, "");
      return `chapter-${digits.padStart(2, "0")}.json`;
    }),
  );

  return files.filter((f) => wanted.has(f));
}

async function validateFile(file: string): Promise<FileReport> {
  const report: FileReport = {
    file,
    errors: [],
    warnings: [],
    verseCount: 0,
    chapterNumber: null,
  };

  const fullPath = path.join(CONTENT_DIR, file);
  let raw: string;

  try {
    raw = await readFile(fullPath, "utf8");
  } catch (error) {
    report.errors.push(`Cannot read file: ${(error as Error).message}`);
    return report;
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    report.errors.push(`Invalid JSON: ${(error as Error).message}`);
    return report;
  }

  const result = chapterContentSchema.safeParse(json);

  if (!result.success) {
    for (const issue of result.error.issues) {
      const where = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      report.errors.push(`${where}: ${issue.message}`);
    }
    return report;
  }

  const chapter = result.data;
  report.chapterNumber = chapter.chapter_number;
  report.verseCount = chapter.verses.length;

  // The filename must agree with the chapter_number inside, otherwise an import
  // can silently write to the wrong chapter.
  const expectedFile = `chapter-${String(chapter.chapter_number).padStart(2, "0")}.json`;
  if (file !== expectedFile) {
    report.errors.push(
      `Filename mismatch: chapter_number is ${chapter.chapter_number}, so the file should be named ${expectedFile}`,
    );
  }

  const gaps = findVerseGaps(chapter.verses);
  if (gaps.length > 0) {
    const shown = gaps.slice(0, 12).join(", ");
    const suffix = gaps.length > 12 ? `, … (+${gaps.length - 12} more)` : "";
    report.warnings.push(`Missing verse numbers: ${shown}${suffix}`);
  }

  const withoutAudio = chapter.verses.filter((v) => !v.audio_url).length;
  if (withoutAudio > 0) {
    report.warnings.push(
      `${withoutAudio} of ${chapter.verses.length} verses have no audio_url`,
    );
  }

  const withoutExplanation = chapter.verses.filter(
    (v) => !v.easy_explanation?.trim(),
  ).length;
  if (withoutExplanation > 0) {
    report.warnings.push(
      `${withoutExplanation} of ${chapter.verses.length} verses have no easy_explanation (admin-authored, can be added later)`,
    );
  }

  // Audio provider should be stated whenever a URL is present, so the player
  // and any future migration know what they are dealing with.
  const audioWithoutProvider = chapter.verses.filter(
    (v) => v.audio_url && !v.audio_provider,
  ).length;
  if (audioWithoutProvider > 0) {
    report.warnings.push(
      `${audioWithoutProvider} verses have audio_url but no audio_provider`,
    );
  }

  return report;
}

async function main() {
  const filters = process.argv.slice(2);
  const files = await listContentFiles(filters);

  if (files.length === 0) {
    console.log(
      `${YELLOW}No content files found${RESET} in ${CONTENT_DIR}\n` +
        `Expected files named chapter-01.json … chapter-18.json.\n` +
        `See docs/content-import.md for the required structure.`,
    );
    // Not an error: an empty content directory is the expected state before any
    // scripture has been prepared.
    process.exit(0);
  }

  console.log(`${DIM}Validating ${files.length} file(s) in ${CONTENT_DIR}${RESET}\n`);

  const reports = await Promise.all(files.map(validateFile));

  let totalErrors = 0;
  let totalWarnings = 0;
  let totalVerses = 0;

  for (const report of reports) {
    const ok = report.errors.length === 0;
    const icon = ok ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
    const summary = ok ? `${report.verseCount} verses` : `${report.errors.length} error(s)`;

    console.log(`${icon}  ${report.file}  ${DIM}${summary}${RESET}`);

    for (const error of report.errors) {
      console.log(`      ${RED}error${RESET}  ${error}`);
    }
    for (const warning of report.warnings) {
      console.log(`      ${YELLOW}warn ${RESET}  ${warning}`);
    }

    totalErrors += report.errors.length;
    totalWarnings += report.warnings.length;
    totalVerses += report.verseCount;
  }

  console.log(
    `\n${DIM}────────────────────────────────────────${RESET}\n` +
      `Files: ${reports.length}   Verses: ${totalVerses}   ` +
      `Errors: ${totalErrors}   Warnings: ${totalWarnings}`,
  );

  if (totalErrors > 0) {
    console.log(
      `\n${RED}Validation failed.${RESET} Fix the errors above before importing.`,
    );
    process.exit(1);
  }

  console.log(`\n${GREEN}All files valid.${RESET} Safe to import.`);
}

main().catch((error) => {
  console.error(`${RED}Unexpected error:${RESET}`, error);
  process.exit(1);
});
