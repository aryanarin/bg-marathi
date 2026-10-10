import { z } from "zod";

/**
 * Content file schema for /content/chapter-NN.json.
 *
 * Validation is strict on purpose. Scripture content is typed or pasted by hand,
 * and a silent import of malformed data is much harder to notice and undo than a
 * loud rejection. `.strict()` also catches typos in key names, which would
 * otherwise import as missing fields.
 *
 * Note which fields are optional. `easy_explanation` and `example` are written
 * by the administrator and are legitimately absent at import time. The
 * application never generates them.
 */

export const AUDIO_PROVIDERS = [
  "supabase_storage",
  "google_drive",
  "external",
] as const;

/** Rejects empty and whitespace-only strings, which are a common paste error. */
const nonEmptyText = (label: string) =>
  z
    .string()
    .refine((v) => v.trim().length > 0, `${label} रिकामे असू शकत नाही / must not be empty`);

/** Devanagari range plus punctuation, digits and whitespace. */
const DEVANAGARI_RE = /[\u0900-\u097F]/;

export const verseContentSchema = z
  .object({
    verse_number: z
      .number()
      .int("verse_number must be an integer")
      .min(1, "verse_number must be 1 or greater"),

    /**
     * Last verse number for a combined entry (e.g. 16-18 -> end 18). Null/absent
     * for a single verse. Bhagavad-gita As It Is groups some verses under one
     * commentary, and the recitation audio treats each group as one track.
     */
    verse_number_end: z
      .number()
      .int("verse_number_end must be an integer")
      .min(1)
      .nullish(),

    /**
     * Sanskrit verse text. Must actually contain Devanagari characters: a
     * transliterated or English-only value here is a content error, not a
     * stylistic choice.
     */
    sanskrit_text: nonEmptyText("sanskrit_text").refine(
      (v) => DEVANAGARI_RE.test(v),
      "sanskrit_text must contain Devanagari characters",
    ),

    // word_to_word / translation / purport are usually present, but Bhagavad-
    // gita As It Is legitimately shares one commentary across a run of grouped
    // verses (e.g. the warrior-list verses 1.5-7), leaving members with no
    // separate text. So these are nullable: null/absent means "no separate
    // text for this verse", which the verse page simply omits. A present value
    // must still be non-empty (no whitespace-only or placeholder junk).
    word_to_word: nonEmptyText("word_to_word").nullish(),
    translation: nonEmptyText("translation").nullish(),
    purport: nonEmptyText("purport").nullish(),

    /** Administrator-authored. Optional. Never generated. */
    easy_explanation: z.string().nullish(),
    /** Administrator-authored. Optional. Never generated. */
    example: z.string().nullish(),

    /**
     * Audio URL. Empty string is allowed and normalised to null, so a content
     * file can be imported before audio has been uploaded.
     */
    audio_url: z
      .string()
      .refine(
        (v) => v === "" || /^https:\/\/\S+$/.test(v),
        "audio_url must be empty or an https:// URL",
      )
      .optional()
      .default(""),

    audio_provider: z.enum(AUDIO_PROVIDERS).nullish(),
  })
  .strict();

export const chapterContentSchema = z
  .object({
    chapter_number: z
      .number()
      .int("chapter_number must be an integer")
      .min(1, "chapter_number must be between 1 and 18")
      .max(18, "chapter_number must be between 1 and 18"),

    name_sanskrit: nonEmptyText("name_sanskrit"),
    name_marathi: nonEmptyText("name_marathi"),
    description: z.string().nullish(),

    verses: z.array(verseContentSchema).min(1, "A chapter must contain at least one verse"),
  })
  .strict()
  .superRefine((chapter, ctx) => {
    // Duplicate verse numbers would violate the (chapter_id, verse_number)
    // unique constraint at import time. Catching it here gives a far clearer
    // error than a Postgres constraint violation.
    const seen = new Map<number, number>();

    chapter.verses.forEach((verse, index) => {
      const previous = seen.get(verse.verse_number);
      if (previous !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["verses", index, "verse_number"],
          message: `Duplicate verse_number ${verse.verse_number} (also at verses[${previous}])`,
        });
      } else {
        seen.set(verse.verse_number, index);
      }
    });
  });

export type VerseContent = z.infer<typeof verseContentSchema>;
export type ChapterContent = z.infer<typeof chapterContentSchema>;

/**
 * Report gaps in verse numbering.
 *
 * Not an error: a chapter file may legitimately be a partial import while
 * content is still being prepared, and combined verses (e.g. "16-18") exist in
 * the source text. Surfaced as a warning so it gets a human glance.
 */
export function findVerseGaps(verses: readonly VerseContent[]): number[] {
  if (verses.length === 0) return [];

  const numbers = verses.map((v) => v.verse_number).sort((a, b) => a - b);
  const gaps: number[] = [];

  for (let n = numbers[0]; n < numbers[numbers.length - 1]; n++) {
    if (!numbers.includes(n)) gaps.push(n);
  }

  return gaps;
}
