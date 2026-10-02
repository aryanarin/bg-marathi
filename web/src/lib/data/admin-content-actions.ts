"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin chapter and verse management.
 *
 * Chapters carry structural metadata (names, total_verses). Verse content —
 * sanskrit, word-to-word, translation, purport, and the admin-authored
 * easy_explanation and example — is edited per verse. The application never
 * generates easy_explanation or example; they are only ever typed here.
 *
 * Each action calls requireAdmin(); writes also pass the is_admin() RLS policy.
 */

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/* --- Chapters ------------------------------------------------------------- */

const chapterSchema = z.object({
  chapter_number: z.coerce.number().int().min(1).max(18),
  name_sanskrit: z.string().min(1, "संस्कृत नाव आवश्यक आहे").max(200),
  name_marathi: z.string().min(1, "मराठी नाव आवश्यक आहे").max(200),
  description: z.string().max(4000).optional().default(""),
  total_verses: z.coerce.number().int().min(1, "श्लोकसंख्या १ किंवा अधिक असावी"),
});

export async function upsertChapter(
  chapterId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = chapterSchema.safeParse({
    chapter_number: formData.get("chapter_number"),
    name_sanskrit: formData.get("name_sanskrit"),
    name_marathi: formData.get("name_marathi"),
    description: formData.get("description") ?? "",
    total_verses: formData.get("total_verses"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const row = {
    ...parsed.data,
    description: parsed.data.description || null,
    display_order: parsed.data.chapter_number,
  };

  const { error } = chapterId
    ? await supabase.from("chapters").update(row).eq("id", chapterId)
    : await supabase.from("chapters").insert(row);

  if (error) {
    return {
      error: error.message.includes("duplicate")
        ? "या क्रमांकाचा अध्याय आधीच अस्तित्वात आहे."
        : "अध्याय जतन करता आला नाही.",
    };
  }

  revalidatePath("/admin/chapters");
  revalidatePath("/chapters");
  redirect("/admin/chapters");
}

export async function deleteChapter(chapterId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("chapters").delete().eq("id", chapterId);
  revalidatePath("/admin/chapters");
  revalidatePath("/chapters");
}

/**
 * Publish or unpublish a whole chapter.
 *
 * Unpublished chapters (and all their verses) are invisible to learners,
 * enforced in the database by the chapter/verse RLS policies. The admin audits
 * a chapter's content, then publishes it so devotees can read it.
 */
export async function setChapterPublished(
  chapterId: string,
  publish: boolean,
): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("chapters").update({ is_published: publish }).eq("id", chapterId);
  revalidatePath("/admin/chapters");
  revalidatePath("/chapters");
}

/* --- Verses --------------------------------------------------------------- */

const verseSchema = z.object({
  chapter_id: z.string().uuid("वैध अध्याय निवडा"),
  verse_number: z.coerce.number().int().min(1),
  verse_number_end: z.coerce.number().int().min(1).optional().nullable(),
  sanskrit_text: z.string().min(1, "संस्कृत पाठ आवश्यक आहे"),
  word_to_word: z.string().optional().default(""),
  translation: z.string().optional().default(""),
  purport: z.string().optional().default(""),
  easy_explanation: z.string().optional().default(""),
  example: z.string().optional().default(""),
  audio_url: z.string().optional().default(""),
});

export async function upsertVerse(
  verseId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const endRaw = formData.get("verse_number_end");
  const parsed = verseSchema.safeParse({
    chapter_id: formData.get("chapter_id"),
    verse_number: formData.get("verse_number"),
    verse_number_end: endRaw ? endRaw : null,
    sanskrit_text: formData.get("sanskrit_text"),
    word_to_word: formData.get("word_to_word") ?? "",
    translation: formData.get("translation") ?? "",
    purport: formData.get("purport") ?? "",
    easy_explanation: formData.get("easy_explanation") ?? "",
    example: formData.get("example") ?? "",
    audio_url: formData.get("audio_url") ?? "",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const row = {
    chapter_id: d.chapter_id,
    verse_number: d.verse_number,
    verse_number_end: d.verse_number_end && d.verse_number_end > d.verse_number ? d.verse_number_end : null,
    sanskrit_text: d.sanskrit_text,
    word_to_word: d.word_to_word || null,
    translation: d.translation || null,
    purport: d.purport || null,
    easy_explanation: d.easy_explanation || null,
    example: d.example || null,
    audio_url: d.audio_url || null,
    audio_provider: d.audio_url ? ("supabase_storage" as const) : null,
    display_order: d.verse_number,
  };

  const supabase = await createClient();
  const { error } = verseId
    ? await supabase.from("verses").update(row).eq("id", verseId)
    : await supabase.from("verses").insert(row);

  if (error) {
    return {
      error: error.message.includes("duplicate")
        ? "या क्रमांकाचा श्लोक या अध्यायात आधीच आहे."
        : "श्लोक जतन करता आला नाही.",
    };
  }

  revalidatePath("/admin/verses");
  redirect(`/admin/verses?chapter=${d.chapter_id}`);
}

export async function deleteVerse(verseId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("verses").delete().eq("id", verseId);
  revalidatePath("/admin/verses");
}
