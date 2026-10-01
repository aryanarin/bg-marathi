"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { meetingUrlSchema } from "@/lib/validation/schemas";

/**
 * Admin class management Server Actions.
 *
 * Every action calls requireAdmin() itself: Server Actions are reachable as
 * plain POSTs, so the layout guard is not sufficient. Writes still pass through
 * RLS (the is_admin() policies), so this is defence in depth, not the only gate.
 */

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

const classSchema = z.object({
  title: z.string().min(1, "शीर्षक आवश्यक आहे").max(200),
  description: z.string().max(2000).optional().default(""),
  class_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "वैध तारीख आवश्यक आहे"),
  class_time: z.string().regex(/^\d{2}:\d{2}$/, "वैध वेळ आवश्यक आहे"),
  meeting_platform: z.enum(["google_meet", "zoom", "other"]),
  meeting_url: meetingUrlSchema,
  is_published: z.boolean().default(false),
});

function parse(formData: FormData) {
  return classSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    class_date: formData.get("class_date"),
    class_time: formData.get("class_time"),
    meeting_platform: formData.get("meeting_platform"),
    meeting_url: formData.get("meeting_url"),
    is_published: formData.get("is_published") === "on",
  });
}

export async function createClass(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parse(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("classes").insert({
    ...parsed.data,
    description: parsed.data.description || null,
    created_by: admin.id,
  });

  if (error) return { error: "वर्ग जतन करता आला नाही." };

  revalidatePath("/admin/classes");
  revalidatePath("/classes");
  redirect("/admin/classes");
}

export async function updateClass(
  classId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parse(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("classes")
    .update({
      ...parsed.data,
      description: parsed.data.description || null,
    })
    .eq("id", classId);

  if (error) return { error: "वर्ग अद्ययावत करता आला नाही." };

  revalidatePath("/admin/classes");
  revalidatePath("/classes");
  redirect("/admin/classes");
}

export async function setClassPublished(classId: string, publish: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("classes").update({ is_published: publish }).eq("id", classId);
  revalidatePath("/admin/classes");
  revalidatePath("/classes");
}

export async function deleteClass(classId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("classes").delete().eq("id", classId);
  revalidatePath("/admin/classes");
  revalidatePath("/classes");
}
