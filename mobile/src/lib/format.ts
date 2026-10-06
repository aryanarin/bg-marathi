/**
 * Shared formatting helpers, matching the web app's behavior.
 */
import type { QuizOption } from "@/lib/types";

const DEV_DIGITS = "०१२३४५६७८९";

/** Convert ASCII digits in a number to Devanagari numerals. */
export function toDevanagari(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => DEV_DIGITS[Number(d)]);
}

/**
 * Verse label in Devanagari. Combined verses render a range (e.g. "१६-१८").
 */
export function verseLabel(v: {
  verse_number: number;
  verse_number_end: number | null;
}): string {
  return v.verse_number_end && v.verse_number_end !== v.verse_number
    ? `${toDevanagari(v.verse_number)}-${toDevanagari(v.verse_number_end)}`
    : toDevanagari(v.verse_number);
}

/** Format a duration in seconds as a short Marathi-friendly string. */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h} ता ${m} मि`;
  if (m > 0) return `${m} मि`;
  return `${totalSeconds} से`;
}

/** Format an ISO date (YYYY-MM-DD) into a readable Marathi date. */
const MONTHS_MR = [
  "जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून",
  "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर",
];

export function formatClassDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return `${toDevanagari(d)} ${MONTHS_MR[m - 1]} ${toDevanagari(y)}`;
}

/** Format a time (HH:MM:SS) into HH:MM. */
export function formatClassTime(time: string): string {
  const [h, m] = time.split(":");
  return `${h}:${m}`;
}

export const QUIZ_OPTIONS: QuizOption[] = ["a", "b", "c", "d"];

/** The Marathi label for a quiz option letter. */
export function optionLabel(opt: QuizOption): string {
  return opt.toUpperCase();
}
