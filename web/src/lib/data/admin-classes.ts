import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { ClassSession } from "@/lib/types";

/**
 * Admin-side reads for classes: ALL classes including unpublished drafts.
 * Caller must have passed requireAdmin(); the is_admin() RLS policy then returns
 * drafts (a learner would only ever see published rows).
 */
export const getAllClasses = cache(async (): Promise<ClassSession[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("*")
    .order("class_date", { ascending: false })
    .order("class_time", { ascending: false });
  return (data as ClassSession[] | null) ?? [];
});

export const getClassById = cache(
  async (classId: string): Promise<ClassSession | null> => {
    const supabase = await createClient();
    const { data } = await supabase.from("classes").select("*").eq("id", classId).maybeSingle();
    return (data as ClassSession | null) ?? null;
  },
);
