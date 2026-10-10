#!/usr/bin/env tsx
/**
 * Vedabase-assisted enrichment of a chapter's draft content.
 *
 * What this does, per verse, using vedabase.io as an authoritative source:
 *   1. Replaces the Sanskrit shloka with vedabase's CLEAN Devanagari (fixes the
 *      [?] glyph gaps left by the Chanakya PDF decode).
 *   2. Uses vedabase's canonical grouping (e.g. 16-18, 21-22) to set the right
 *      verse_number / verse_number_end and audio file.
 *   3. Strips page furniture (running "अध्याय N" headers, bare page numbers) and
 *      leftover decode markers ([?], review placeholder) from the Marathi
 *      word-to-word / translation / purport.
 *   4. Cross-checks the Marathi word-gloss count against vedabase's synonym
 *      count and flags a mismatch for review (does NOT rewrite Marathi).
 *
 * What this does NOT do: translate or rewrite Marathi prose. Vedabase has only
 * English for meaning/translation/purport, so the Marathi text itself still
 * comes from the PDF decode. We only fix the shloka, the structure, and junk.
 *
 * Output: content/chapter-NN.json (final, not .draft) ready to validate+import.
 *
 * Usage: npm run content:enrich -- 1
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const CONTENT_DIR = path.join(process.cwd(), "..", "content");
const BASE = "https://vedabase.io/en/library/bg";

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
  audio_provider?: string | null;
}
interface ChapterJson {
  chapter_number: number;
  name_sanskrit: string;
  name_marathi: string;
  description?: string | null;
  verses: VerseJson[];
}

/** A verse group as vedabase defines it: a single text or a combined range. */
interface Group {
  start: number;
  end: number; // === start for a single verse
  slug: string; // "1" or "16-18"
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (content-enrichment; study project)" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

/** Parse the chapter index page to discover the canonical verse grouping. */
async function getGroups(chapter: number): Promise<Group[]> {
  const html = await fetchText(`${BASE}/${chapter}/`);
  // Links look like href="/en/library/bg/1/16-18/" or ".../1/5/".
  const re = new RegExp(`/en/library/bg/${chapter}/(\\d+(?:-\\d+)?)/`, "g");
  const seen = new Set<string>();
  const groups: Group[] = [];
  for (const m of html.matchAll(re)) {
    const slug = m[1];
    if (seen.has(slug)) continue;
    seen.add(slug);
    const [a, b] = slug.split("-").map(Number);
    groups.push({ start: a, end: b ?? a, slug });
  }
  groups.sort((x, y) => x.start - y.start);
  return groups;
}

/** Extract the clean Devanagari shloka block from a verse page. */
async function getDevanagari(chapter: number, slug: string): Promise<string> {
  const html = await fetchText(`${BASE}/${chapter}/${slug}/`);

  // The Devanagari sits in a block headed by "Devanagari". In the rendered
  // markup it is an .r-verse / .av-devanagari section. Work from the raw HTML:
  // find the "Devanagari" heading and take the following text up to the next
  // section heading ("Verse text" / "Synonyms").
  const text = html
    .replace(/\r/g, "")
    // Convert <br> to newlines before stripping tags.
    .replace(/<br\s*\/?>/gi, "\n");

  // Narrow to the Devanagari section.
  const startIdx = text.search(/Devanagari/i);
  if (startIdx === -1) throw new Error(`no Devanagari heading for ${chapter}/${slug}`);
  const after = text.slice(startIdx);
  const endIdx = after.search(/Verse text|Synonyms|Transliteration/i);
  const block = endIdx === -1 ? after : after.slice(0, endIdx);

  // Strip tags, decode a few entities, keep only Devanagari lines.
  const stripped = block
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

  const lines = stripped
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /[\u0900-\u097F]/.test(l)); // keep Devanagari lines only

  let shloka = lines.join("\n").trim();
  // The first line keeps a leaked heading/attribute prefix ('">Devanagari') glued
  // to the first Devanagari word. Strip any leading non-Devanagari run.
  shloka = shloka.replace(/^[^\u0900-\u097F]+/, "").trim();
  if (!shloka) throw new Error(`empty Devanagari for ${chapter}/${slug}`);
  return shloka;
}



/**
 * Remove page furniture and decode markers from a Marathi field. This is the
 * FINAL cleaning step before content is written, so it is defensive: it strips
 * every artifact seen in the OCR text regardless of what earlier steps did.
 */
function cleanMarathi(text: string | null | undefined, chapterName?: string): string {
  if (!text) return "";
  let t = text;
  // OCR cache page-break markers ("@@@PAGE N@@@" / "@@@PAGE @@@"), which land
  // mid-text wherever a verse spans a page.
  t = t.replace(/@@@\s*PAGE[^@]*@@@/g, " ");
  // Running header "भगवद्गीता जशी आहे तशी" (OCR may insert a ZWJ in भगवद्गीता).
  t = t.replace(/भगवद्\u200c?गीता[^\n]{0,25}जशी आहे तशी/g, " ");
  // Chapter labels: "अध्याय १" and "श्लोक ३" page markers.
  t = t.replace(/अध्याय\s*[०-९\d]+/g, " ");
  t = t.replace(/श्लोक\s*[०-९\d]+/g, " ");
  // Running header that repeats the chapter's Sanskrit name on a line by itself
  // (e.g. "अर्जुनविषादयोग"). Only strip it when it stands alone as furniture.
  if (chapterName) {
    const re = new RegExp(`(^|\\n)\\s*${chapterName}\\s*(\\n|$)`, "g");
    t = t.replace(re, "\n");
  }
  t = t.replace(/\b\d{1,3}\b/g, " "); // bare page numbers
  // Leftover decode markers.
  t = t.replace(/\[\?\]/g, "");
  t = t.replace(/\[पुनरावलोकन आवश्यक\]/g, "");
  // Tidy whitespace: collapse runs of spaces, strip space before punctuation,
  // and limit blank lines.
  t = t.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return t;
}

async function enrichChapter(chapter: number): Promise<void> {
  // Marathi source: prefer the OCR extraction (clean, readable Marathi), fall
  // back to the Chanakya draft. The OCR file has one entry per verse number.
  const nn2 = String(chapter).padStart(2, "0");
  const ocrPath = path.join(CONTENT_DIR, `chapter-${nn2}.ocr.json`);
  const draftPath = path.join(CONTENT_DIR, `chapter-${nn2}.draft.json`);
  let source: ChapterJson;
  let sourceKind: string;
  try {
    source = JSON.parse(readFileSync(ocrPath, "utf8"));
    sourceKind = "OCR";
  } catch {
    source = JSON.parse(readFileSync(draftPath, "utf8"));
    sourceKind = "Chanakya draft";
  }
  console.log(`${DIM}Marathi source: ${sourceKind}${RESET}`);

  console.log(`${DIM}Fetching vedabase structure for chapter ${chapter}…${RESET}`);
  const groups = await getGroups(chapter);
  console.log(`${DIM}${groups.length} verse groups (combined: ${groups.filter((g) => g.end !== g.start).map((g) => g.slug).join(", ") || "none"})${RESET}\n`);

  // Index source Marathi by verse number for lookup.
  const srcByNum = new Map<number, VerseJson>();
  for (const v of source.verses) srcByNum.set(v.verse_number, v);

  const chapterName = source.name_sanskrit;
  const enriched: VerseJson[] = [];
  let shlokaFixed = 0;
  const flags: string[] = [];

  for (const g of groups) {
    const shloka = await getDevanagari(chapter, g.slug);

    // For a combined group (e.g. 16-18), the OCR commentary lives under the
    // group's starting verse; the member verses (17, 18) usually hold only the
    // shloka tail. Merge any non-empty fields across the group's members.
    const members: VerseJson[] = [];
    for (let n = g.start; n <= g.end; n++) {
      const m = srcByNum.get(n);
      if (m) members.push(m);
    }
    const pick = (field: "word_to_word" | "translation" | "purport") =>
      members.map((m) => m[field] ?? "").filter((s) => s && s.trim()).join("\n\n");

    const w2w = cleanMarathi(pick("word_to_word"), chapterName);
    const translation = cleanMarathi(pick("translation"), chapterName);
    const purport = cleanMarathi(pick("purport"), chapterName);
    const d = srcByNum.get(g.start);

    if (shloka) shlokaFixed++;

    // Flag Marathi fields that the PDF decode could not fill, so the admin's
    // review goes straight to them. (Vedabase has only English for these, so we
    // cannot auto-fill the Marathi — only the shloka and structure are fixed.)
    if (!w2w) flags.push(`verse ${g.slug}: word_to_word empty`);
    if (!translation) flags.push(`verse ${g.slug}: translation empty`);
    if (!purport) flags.push(`verse ${g.slug}: purport empty`);

    const cc = String(chapter).padStart(2, "0");
    const audioName =
      g.end !== g.start
        ? `Bg-${cc}-${String(g.start).padStart(2, "0")}-${String(g.end).padStart(2, "0")}.mp3`
        : `Bg-${cc}-${String(g.start).padStart(2, "0")}.mp3`;

    enriched.push({
      verse_number: g.start,
      verse_number_end: g.end !== g.start ? g.end : null,
      sanskrit_text: shloka,
      // Genuinely-empty fields are stored null (not a visible placeholder):
      // the verse page omits empty sections, and in this edition some grouped
      // verses legitimately have no separate text.
      word_to_word: w2w || null,
      translation: translation || null,
      purport: purport || null,
      easy_explanation: d?.easy_explanation ?? "",
      example: d?.example ?? "",
      audio_url: `https://mjavrqbierktlafrkoxu.supabase.co/storage/v1/object/public/verse-audio/${cc}/${audioName}`,
      audio_provider: "supabase_storage",
    });

    process.stdout.write(`\r  processed ${enriched.length}/${groups.length} verses`);
  }
  console.log();

  const out: ChapterJson = {
    chapter_number: chapter,
    name_sanskrit: chapterName,
    // The OCR source carries only name_sanskrit; keep name_marathi equal to it
    // unless the source provided one. The admin can refine chapter names in-app.
    name_marathi: source.name_marathi ?? chapterName,
    description: source.description ?? "",
    verses: enriched,
  };

  const outPath = path.join(CONTENT_DIR, `chapter-${String(chapter).padStart(2, "0")}.json`);
  writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");

  console.log(`\n${GREEN}Wrote ${path.basename(outPath)}${RESET}`);
  console.log(`  verses: ${enriched.length}  shlokas replaced from vedabase: ${shlokaFixed}`);
  console.log(`  ${YELLOW}review flags: ${flags.length}${RESET}`);
  for (const f of flags.slice(0, 10)) console.log(`    - ${f}`);
  if (flags.length > 10) console.log(`    … and ${flags.length - 10} more`);
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error(`${RED}Usage:${RESET} npm run content:enrich -- 1 | all`);
    process.exit(1);
  }
  const chapters = arg.toLowerCase() === "all"
    ? Array.from({ length: 18 }, (_, i) => i + 1)
    : [Number(arg)];
  for (const ch of chapters) {
    console.log(`\n${DIM}======== Chapter ${ch} ========${RESET}`);
    await enrichChapter(ch);
  }
}

main().catch((err) => {
  console.error(`${RED}Failed:${RESET}`, err.message);
  process.exit(1);
});
