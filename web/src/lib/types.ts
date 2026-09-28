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

export type {
  UserRole,
  MeetingPlatform,
  AudioProvider,
  QuizOption,
} from "@/lib/database.types";

type Tables = Database["public"]["Tables"];

export type Profile = Tables["profiles"]["Row"];
export type Chapter = Tables["chapters"]["Row"];
export type Verse = Tables["verses"]["Row"];
export type VerseProgress = Tables["verse_progress"]["Row"];
export type ReadingSession = Tables["reading_sessions"]["Row"];
export type ClassSession = Tables["classes"]["Row"];
export type Quiz = Tables["quizzes"]["Row"];

/**
 * A quiz question as stored, including the answer key.
 *
 * Never send this shape to the browser before submission. Use
 * `PublicQuizQuestion` for the attempt UI. RLS column grants also prevent a
 * learner account from reading `correct_option`/`explanation` at all.
 */
export type QuizQuestion = Tables["quiz_questions"]["Row"];

/** A question with the answer key stripped, for an in-progress attempt. */
export type PublicQuizQuestion = Omit<
  QuizQuestion,
  "correct_option" | "explanation"
>;

export type QuizAttempt = Tables["quiz_attempts"]["Row"];
export type QuizAnswer = Tables["quiz_answers"]["Row"];

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
