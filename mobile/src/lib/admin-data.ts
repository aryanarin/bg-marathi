/**
 * Admin-only data access. These reads/writes are allowed by RLS only when the
 * signed-in user's profile has role='admin'. Mirrors the web admin surface:
 * list all chapters/verses (incl. unpublished), edit verse fields, manage
 * classes and quizzes (create / publish toggle).
 */
import { supabase } from "@/lib/supabase";
import type {
  Chapter,
  ClassSession,
  Quiz,
  Verse,
} from "@/lib/types";

/* Chapters & verses */

export async function adminGetChapters(): Promise<Chapter[]> {
  const { data } = await supabase
    .from("chapters")
    .select("*")
    .order("display_order", { ascending: true });
  return (data as Chapter[]) ?? [];
}

export async function adminGetChapterVerses(
  chapterId: string,
): Promise<Verse[]> {
  const { data } = await supabase
    .from("verses")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("display_order", { ascending: true });
  return (data as Verse[]) ?? [];
}

export async function adminGetVerse(verseId: string): Promise<Verse | null> {
  const { data } = await supabase
    .from("verses")
    .select("*")
    .eq("id", verseId)
    .maybeSingle();
  return (data as Verse) ?? null;
}

export interface VerseEditFields {
  sanskrit_text: string;
  word_to_word: string | null;
  translation: string | null;
  purport: string | null;
  easy_explanation: string | null;
  example: string | null;
  audio_url: string | null;
}

export async function adminUpdateVerse(
  verseId: string,
  fields: VerseEditFields,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("verses")
    .update(fields)
    .eq("id", verseId);
  return { error: error?.message ?? null };
}

export async function adminSetChapterPublished(
  chapterId: string,
  isPublished: boolean,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("chapters")
    .update({ is_published: isPublished })
    .eq("id", chapterId);
  return { error: error?.message ?? null };
}

/* Classes */

export async function adminGetClasses(): Promise<ClassSession[]> {
  const { data } = await supabase
    .from("classes")
    .select("*")
    .order("class_date", { ascending: false });
  return (data as ClassSession[]) ?? [];
}

export async function adminSetClassPublished(
  classId: string,
  isPublished: boolean,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("classes")
    .update({ is_published: isPublished })
    .eq("id", classId);
  return { error: error?.message ?? null };
}

export interface ClassCreateFields {
  title: string;
  description: string | null;
  class_date: string;
  class_time: string;
  meeting_platform: "google_meet" | "zoom" | "other";
  meeting_url: string;
  is_published: boolean;
}

export async function adminCreateClass(
  userId: string,
  fields: ClassCreateFields,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("classes")
    .insert({ ...fields, created_by: userId });
  return { error: error?.message ?? null };
}

/* Quizzes */

export async function adminGetQuizzes(): Promise<Quiz[]> {
  const { data } = await supabase
    .from("quizzes")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Quiz[]) ?? [];
}

export async function adminSetQuizPublished(
  quizId: string,
  isPublished: boolean,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("quizzes")
    .update({ is_published: isPublished })
    .eq("id", quizId);
  return { error: error?.message ?? null };
}
