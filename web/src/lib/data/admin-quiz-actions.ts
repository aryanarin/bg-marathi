"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin quiz management: quizzes, their questions, and publish state.
 * Each action calls requireAdmin(); writes also pass the is_admin() RLS policy.
 */

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

const quizSchema = z.object({
  title: z.string().min(1, "शीर्षक आवश्यक आहे").max(200),
  description: z.string().max(2000).optional().default(""),
});

export async function upsertQuiz(
  quizId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = quizSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const row = {
    title: parsed.data.title,
    description: parsed.data.description || null,
  };

  if (quizId) {
    const { error } = await supabase.from("quizzes").update(row).eq("id", quizId);
    if (error) return { error: "प्रश्नमंजुषा जतन करता आली नाही." };
    revalidatePath("/admin/quizzes");
    revalidatePath("/quizzes");
    redirect(`/admin/quizzes/${quizId}` as Route);
  }

  const { data, error } = await supabase
    .from("quizzes")
    .insert({ ...row, created_by: admin.id })
    .select("id")
    .single();
  if (error || !data) return { error: "प्रश्नमंजुषा जतन करता आली नाही." };

  revalidatePath("/admin/quizzes");
  redirect(`/admin/quizzes/${data.id}` as Route);
}

export async function setQuizPublished(quizId: string, publish: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("quizzes").update({ is_published: publish }).eq("id", quizId);
  revalidatePath("/admin/quizzes");
  revalidatePath("/quizzes");
}

export async function deleteQuiz(quizId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("quizzes").delete().eq("id", quizId);
  revalidatePath("/admin/quizzes");
  revalidatePath("/quizzes");
  redirect("/admin/quizzes");
}

/* --- Questions ------------------------------------------------------------ */

const questionSchema = z.object({
  question: z.string().min(1, "प्रश्न आवश्यक आहे"),
  option_a: z.string().min(1, "पर्याय अ आवश्यक आहे"),
  option_b: z.string().min(1, "पर्याय ब आवश्यक आहे"),
  option_c: z.string().min(1, "पर्याय क आवश्यक आहे"),
  option_d: z.string().min(1, "पर्याय ड आवश्यक आहे"),
  correct_option: z.enum(["a", "b", "c", "d"]),
  explanation: z.string().max(2000).optional().default(""),
});

export async function addQuestion(
  quizId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = questionSchema.safeParse({
    question: formData.get("question"),
    option_a: formData.get("option_a"),
    option_b: formData.get("option_b"),
    option_c: formData.get("option_c"),
    option_d: formData.get("option_d"),
    correct_option: formData.get("correct_option"),
    explanation: formData.get("explanation") ?? "",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();

  // Append after the current last question.
  const { count } = await supabase
    .from("quiz_questions")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", quizId);

  const { error } = await supabase.from("quiz_questions").insert({
    quiz_id: quizId,
    ...parsed.data,
    explanation: parsed.data.explanation || null,
    display_order: (count ?? 0) + 1,
  });
  if (error) return { error: "प्रश्न जतन करता आला नाही." };

  revalidatePath(`/admin/quizzes/${quizId}`);
  return {};
}

export async function deleteQuestion(questionId: string, quizId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("quiz_questions").delete().eq("id", questionId);
  revalidatePath(`/admin/quizzes/${quizId}`);
}
