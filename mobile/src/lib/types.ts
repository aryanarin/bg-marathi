/**
 * Shared domain types — the exact contract from the web app's Supabase schema.
 * Kept in sync with web/src/lib/types.ts so both clients agree on shapes.
 */

export type UserRole = "user" | "admin";
export type MeetingPlatform = "google_meet" | "zoom" | "other";
export type AudioProvider = "supabase_storage" | "google_drive" | "external";
export type QuizOption = "a" | "b" | "c" | "d";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  chapter_number: number;
  name_sanskrit: string;
  name_marathi: string;
  description: string | null;
  total_verses: number;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Verse {
  id: string;
  chapter_id: string;
  verse_number: number;
  verse_number_end: number | null;
  sanskrit_text: string;
  word_to_word: string | null;
  translation: string | null;
  purport: string | null;
  easy_explanation: string | null;
  example: string | null;
  audio_url: string | null;
  audio_provider: AudioProvider | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface VerseProgress {
  id: string;
  user_id: string;
  verse_id: string;
  is_read: boolean;
  is_memorized: boolean;
  read_at: string | null;
  memorized_at: string | null;
  total_time_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface ClassSession {
  id: string;
  title: string;
  description: string | null;
  class_date: string;
  class_time: string;
  meeting_platform: MeetingPlatform;
  meeting_url: string;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  chapter_id: string | null;
  verse_start: number | null;
  verse_end: number | null;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicQuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion extends PublicQuizQuestion {
  correct_option: QuizOption;
  explanation: string | null;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  started_at: string;
  completed_at: string | null;
}

export interface QuizAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option: QuizOption | null;
  is_correct: boolean;
}

/** View models (no direct table equivalent). */

export interface VerseListItem {
  id: string;
  verse_number: number;
  verse_number_end: number | null;
  preview: string;
  is_read: boolean;
  is_memorized: boolean;
}

export interface ChapterWithProgress extends Chapter {
  verses_read: number;
  verses_memorized: number;
}

export interface ProgressSummary {
  verses_read: number;
  verses_memorized: number;
  total_time_seconds: number;
  total_verses: number;
}

/** Result returned by the submit_quiz_attempt RPC. */
export interface SubmitQuizResult {
  attempt_id: string;
  score: number;
  total_questions: number;
  answers: {
    question_id: string;
    selected_option: QuizOption | null;
    correct_option: QuizOption;
    is_correct: boolean;
    explanation: string | null;
  }[];
}
