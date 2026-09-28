import "server-only";

import { cache } from "react";

import { getCurrentUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type {
  Chapter,
  ChapterWithProgress,
  Verse,
  VerseListItem,
  VerseProgress,
} from "@/lib/types";

/**
 * Content and progress data access.
 *
 * All reads go through the anon-key server client, so RLS decides what is
 * visible. These functions centralise the queries the pages need and keep the
 * page components declarative.
 */

/** All chapters, ordered for display. Public. */
export const getChapters = cache(async (): Promise<Chapter[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chapters")
    .select("*")
    .order("display_order", { ascending: true });
  return data ?? [];
});

/** One chapter by its number. Public. Null if not found. */
export const getChapterByNumber = cache(
  async (chapterNumber: number): Promise<Chapter | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("chapters")
      .select("*")
      .eq("chapter_number", chapterNumber)
      .maybeSingle();
    return data;
  },
);

/**
 * Format a verse's display label, e.g. "५" or "१६-१८", in Devanagari numerals.
 */
export function verseLabel(v: { verse_number: number; verse_number_end: number | null }): string {
  const toDevanagari = (n: number) =>
    String(n).replace(/[0-9]/g, (d) => "०१२३४५६७८९"[Number(d)]);
  return v.verse_number_end && v.verse_number_end !== v.verse_number
    ? `${toDevanagari(v.verse_number)}-${toDevanagari(v.verse_number_end)}`
    : toDevanagari(v.verse_number);
}

/**
 * Verses for a chapter as lightweight list items, with the signed-in user's
 * read/memorized status folded in. Progress is only fetched when signed in.
 */
export const getChapterVerses = cache(
  async (chapterId: string): Promise<VerseListItem[]> => {
    const supabase = await createClient();

    const { data: verses } = await supabase
      .from("verses")
      .select("id, verse_number, verse_number_end, translation, sanskrit_text, display_order")
      .eq("chapter_id", chapterId)
      .order("display_order", { ascending: true });

    if (!verses || verses.length === 0) return [];

    const user = await getCurrentUser();
    const progressByVerse = new Map<string, { is_read: boolean; is_memorized: boolean }>();

    if (user) {
      const { data: progress } = await supabase
        .from("verse_progress")
        .select("verse_id, is_read, is_memorized")
        .eq("user_id", user.id)
        .in(
          "verse_id",
          verses.map((v) => v.id),
        );
      for (const p of progress ?? []) {
        progressByVerse.set(p.verse_id, { is_read: p.is_read, is_memorized: p.is_memorized });
      }
    }

    return verses.map((v) => {
      const preview = (v.translation ?? v.sanskrit_text ?? "").trim().slice(0, 90);
      const prog = progressByVerse.get(v.id);
      return {
        id: v.id,
        verse_number: v.verse_number,
        verse_number_end: v.verse_number_end,
        preview,
        is_read: prog?.is_read ?? false,
        is_memorized: prog?.is_memorized ?? false,
      } satisfies VerseListItem;
    });
  },
);

/** A single verse with full content. Public. Null if not found. */
export const getVerse = cache(async (verseId: string): Promise<Verse | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("verses").select("*").eq("id", verseId).maybeSingle();
  // The DB CHECK constrains audio_provider to the AudioProvider union, which the
  // generated types widen to string. Assert it back at this boundary.
  return (data as Verse | null) ?? null;
});

/** The signed-in user's progress for one verse, if any. */
export const getVerseProgress = cache(
  async (verseId: string): Promise<VerseProgress | null> => {
    const user = await getCurrentUser();
    if (!user) return null;

    const supabase = await createClient();
    const { data } = await supabase
      .from("verse_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("verse_id", verseId)
      .maybeSingle();
    return data;
  },
);

/** Chapter + verse in one shot, for the verse page. */
export const getVerseWithChapter = cache(
  async (verseId: string): Promise<{ verse: Verse; chapter: Chapter } | null> => {
    const verse = await getVerse(verseId);
    if (!verse) return null;

    const supabase = await createClient();
    const { data: chapter } = await supabase
      .from("chapters")
      .select("*")
      .eq("id", verse.chapter_id)
      .maybeSingle();
    if (!chapter) return null;

    return { verse, chapter };
  },
);

/** Adjacent verse ids within the same chapter, for prev/next navigation. */
export const getVerseNeighbors = cache(
  async (
    chapterId: string,
    displayOrder: number,
  ): Promise<{ prevId: string | null; nextId: string | null }> => {
    const supabase = await createClient();

    const [{ data: prev }, { data: next }] = await Promise.all([
      supabase
        .from("verses")
        .select("id")
        .eq("chapter_id", chapterId)
        .lt("display_order", displayOrder)
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("verses")
        .select("id")
        .eq("chapter_id", chapterId)
        .gt("display_order", displayOrder)
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    return { prevId: prev?.id ?? null, nextId: next?.id ?? null };
  },
);

/** All chapters with the signed-in user's per-chapter progress counts. */
export const getChaptersWithProgress = cache(
  async (): Promise<ChapterWithProgress[]> => {
    const chapters = await getChapters();
    const user = await getCurrentUser();

    if (!user || chapters.length === 0) {
      return chapters.map((c) => ({ ...c, verses_read: 0, verses_memorized: 0 }));
    }

    const supabase = await createClient();
    // Join progress to verses to attribute each progress row to its chapter.
    const { data } = await supabase
      .from("verse_progress")
      .select("is_read, is_memorized, verses!inner(chapter_id)")
      .eq("user_id", user.id);

    const readByChapter = new Map<string, number>();
    const memByChapter = new Map<string, number>();

    for (const row of (data ?? []) as unknown as Array<{
      is_read: boolean;
      is_memorized: boolean;
      verses: { chapter_id: string };
    }>) {
      const cid = row.verses.chapter_id;
      if (row.is_read) readByChapter.set(cid, (readByChapter.get(cid) ?? 0) + 1);
      if (row.is_memorized) memByChapter.set(cid, (memByChapter.get(cid) ?? 0) + 1);
    }

    return chapters.map((c) => ({
      ...c,
      verses_read: readByChapter.get(c.id) ?? 0,
      verses_memorized: memByChapter.get(c.id) ?? 0,
    }));
  },
);
