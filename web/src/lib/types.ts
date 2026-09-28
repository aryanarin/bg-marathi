/**
 * Domain types.
 *
 * Aliases over the schema types in `database.types.ts`, which is the single
 * source of truth and mirrors supabase/migrations. Using `Row` types here means
 * the app's domain model can never silently drift from the database.
 *
 * The derived view models at the bottom are app-level shapes with no direct
 * table equivalent.
 */

import type { Database } from "@/lib/database.types";

/**
 * Semantic enum unions.
 *
 * These columns are CHECK-constrained text in Postgres, so the generated types
 * surface them as plain `string`. We narrow them here to the exact allowed
 * values and intersect them onto the Row types below, so the app is type-safe
 * about roles, platforms and options while the database stays the source of the
 * constraint itself.
 */
export type UserRole = "user" | "admin";
export type MeetingPlatform = "google_meet" | "zoom" | "other";
export type AudioProvider = "supabase_storage" | "google_drive" | "external";
export type QuizOption = "a" | "b" | "c" | "d";

type Tables = Database["public"]["Tables"];

/** Replace named keys of T with narrower types. */
type Narrow<T, N> = Omit<T, keyof N> & N;

export type Profile = Narrow<Tables["profiles"]["Row"], { role: UserRole }>;
export type Chapter = Tables["chapters"]["Row"];
export type Verse = Narrow<
  Tables["verses"]["Row"],
  { audio_provider: AudioProvider | null }
>;
export type VerseProgress = Tables["verse_progress"]["Row"];
export type ReadingSession = Tables["reading_sessions"]["Row"];
export type ClassSession = Narrow<
  Tables["classes"]["Row"],
  { meeting_platform: MeetingPlatform }
>;
export type Quiz = Tables["quizzes"]["Row"];

/**
 * A quiz question as stored, including the answer key.
 *
 * Never send this shape to the browser before submission. Use
 * `PublicQuizQuestion` for the attempt UI. RLS column grants also prevent a
 * learner account from reading `correct_option`/`explanation` at all.
 */
export type QuizQuestion = Narrow<
  Tables["quiz_questions"]["Row"],
  { correct_option: QuizOption }
>;

/** A question with the answer key stripped, for an in-progress attempt. */
export type PublicQuizQuestion = Omit<
  QuizQuestion,
  "correct_option" | "explanation"
>;

export type QuizAttempt = Tables["quiz_attempts"]["Row"];
export type QuizAnswer = Narrow<
  Tables["quiz_answers"]["Row"],
  { selected_option: QuizOption | null }
>;

/* --- Derived view models -------------------------------------------------- */

/** A chapter plus the signed-in user's progress through it. */
export interface ChapterWithProgress extends Chapter {
  verses_read: number;
  verses_memorized: number;
}

/** A verse list row: enough to render the list without loading full content. */
export interface VerseListItem {
  id: string;
  verse_number: number;
  verse_number_end: number | null;
  preview: string;
  is_read: boolean;
  is_memorized: boolean;
}

/** Aggregate totals for the user dashboard. */
export interface ProgressSummary {
  verses_read: number;
  verses_memorized: number;
  total_time_seconds: number;
  total_verses: number;
}
