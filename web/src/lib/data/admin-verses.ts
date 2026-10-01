import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Verse } from "@/lib/types";

/** Admin verse reads: full rows for a chapter, and a single verse by id. */
export const getVersesForChapter = cache(
  async (chapterId: string): Promise<Verse[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("verses")
      .select("*")
      .eq("chapter_id", chapterId)
      .order("display_order", { ascending: true });
    return (data as Verse[] | null) ?? [];
  },
);

export const getVerseById = cache(async (verseId: string): Promise<Verse | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("verses").select("*").eq("id", verseId).maybeSingle();
  return (data as Verse | null) ?? null;
});
