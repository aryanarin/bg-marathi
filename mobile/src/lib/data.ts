/**
 * Data access — mirrors web/src/lib/data/*. All reads go through the anon-key
 * client under RLS; the signed-in user's JWT scopes per-user rows. Writes use
 * the same RPCs the web app uses (set_verse_progress, record_reading_session,
 * submit_quiz_attempt).
 */
import { supabase } from "@/lib/supabase";
import type {
  Chapter,
  ChapterWithProgress,
  ClassSession,
  ProgressSummary,
  PublicQuizQuestion,
  Quiz,
  QuizAttempt,
  QuizAnswer,
  SubmitQuizResult,
  Verse,
  VerseListItem,
  VerseProgress,
} from "@/lib/types";

/* ----------------------------- Content ----------------------------- */

export async function getChapters(): Promise<Chapter[]> {
  const { data } = await supabase
    .from("chapters")
    .select("*")
    .order("display_order", { ascending: true });
  return (data as Chapter[]) ?? [];
}

export async function getChapterByNumber(
  chapterNumber: number,
): Promise<Chapter | null> {
  const { data } = await supabase
    .from("chapters")
    .select("*")
    .eq("chapter_number", chapterNumber)
    .maybeSingle();
  return (data as Chapter) ?? null;
}

export async function getChapter(chapterId: string): Promise<Chapter | null> {
  const { data } = await supabase
    .from("chapters")
    .select("*")
    .eq("id", chapterId)
    .maybeSingle();
  return (data as Chapter) ?? null;
}

export async function getChaptersWithProgress(
  userId: string | null,
): Promise<ChapterWithProgress[]> {
  const chapters = await getChapters();
  if (!userId) {
    return chapters.map((c) => ({
      ...c,
      verses_read: 0,
      verses_memorized: 0,
    }));
  }

  const { data } = await supabase
    .from("verse_progress")
    .select("is_read, is_memorized, verses!inner(chapter_id)")
    .eq("user_id", userId);

  const read = new Map<string, number>();
  const mem = new Map<string, number>();
  for (const row of (data as any[]) ?? []) {
    const chapterId = row.verses?.chapter_id as string | undefined;
    if (!chapterId) continue;
    if (row.is_read) read.set(chapterId, (read.get(chapterId) ?? 0) + 1);
    if (row.is_memorized) mem.set(chapterId, (mem.get(chapterId) ?? 0) + 1);
  }

  return chapters.map((c) => ({
    ...c,
    verses_read: read.get(c.id) ?? 0,
    verses_memorized: mem.get(c.id) ?? 0,
  }));
}

export async function getChapterVerses(
  chapterId: string,
  userId: string | null,
): Promise<VerseListItem[]> {
  const { data } = await supabase
    .from("verses")
    .select(
      "id, verse_number, verse_number_end, translation, sanskrit_text, display_order",
    )
    .eq("chapter_id", chapterId)
    .order("display_order", { ascending: true });

  const verses = (data as any[]) ?? [];

  let progressByVerse = new Map<
    string,
    { is_read: boolean; is_memorized: boolean }
  >();
  if (userId && verses.length > 0) {
    const ids = verses.map((v) => v.id as string);
    const { data: prog } = await supabase
      .from("verse_progress")
      .select("verse_id, is_read, is_memorized")
      .eq("user_id", userId)
      .in("verse_id", ids);
    progressByVerse = new Map(
      ((prog as any[]) ?? []).map((p) => [
        p.verse_id as string,
        { is_read: !!p.is_read, is_memorized: !!p.is_memorized },
      ]),
    );
  }

  return verses.map((v) => {
    const p = progressByVerse.get(v.id as string);
    const preview = ((v.translation ?? v.sanskrit_text ?? "") as string)
      .trim()
      .slice(0, 90);
    return {
      id: v.id,
      verse_number: v.verse_number,
      verse_number_end: v.verse_number_end,
      preview,
      is_read: p?.is_read ?? false,
      is_memorized: p?.is_memorized ?? false,
    };
  });
}

export async function getVerse(verseId: string): Promise<Verse | null> {
  const { data } = await supabase
    .from("verses")
    .select("*")
    .eq("id", verseId)
    .maybeSingle();
  return (data as Verse) ?? null;
}

export async function getVerseProgress(
  verseId: string,
  userId: string | null,
): Promise<VerseProgress | null> {
  if (!userId) return null;
  const { data } = await supabase
    .from("verse_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("verse_id", verseId)
    .maybeSingle();
  return (data as VerseProgress) ?? null;
}

export async function getVerseNeighbors(
  chapterId: string,
  displayOrder: number,
): Promise<{ prevId: string | null; nextId: string | null }> {
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
  return {
    prevId: (prev as any)?.id ?? null,
    nextId: (next as any)?.id ?? null,
  };
}

/* ----------------------------- Progress ----------------------------- */

export async function toggleRead(
  verseId: string,
  isRead: boolean,
): Promise<void> {
  await supabase.rpc("set_verse_progress", {
    p_verse_id: verseId,
    p_is_read: isRead,
  });
}

export async function toggleMemorized(
  verseId: string,
  isMemorized: boolean,
): Promise<void> {
  await supabase.rpc("set_verse_progress", {
    p_verse_id: verseId,
    p_is_memorized: isMemorized,
    ...(isMemorized ? { p_is_read: true } : {}),
  });
}

export async function recordReadingTime(
  verseId: string,
  seconds: number,
): Promise<void> {
  const clamped = Math.min(1800, Math.max(0, Math.round(seconds)));
  if (clamped < 5) return;
  await supabase.rpc("record_reading_session", {
    p_verse_id: verseId,
    p_duration: clamped,
  });
}

export async function getProgressSummary(
  userId: string | null,
): Promise<ProgressSummary> {
  const { data: chapters } = await supabase
    .from("chapters")
    .select("total_verses");
  const totalVerses = ((chapters as any[]) ?? []).reduce(
    (sum, c) => sum + (c.total_verses ?? 0),
    0,
  );

  if (!userId) {
    return {
      verses_read: 0,
      verses_memorized: 0,
      total_time_seconds: 0,
      total_verses: totalVerses,
    };
  }

  const { data } = await supabase
    .from("verse_progress")
    .select("is_read, is_memorized, total_time_seconds")
    .eq("user_id", userId);

  let read = 0;
  let mem = 0;
  let time = 0;
  for (const row of (data as any[]) ?? []) {
    if (row.is_read) read += 1;
    if (row.is_memorized) mem += 1;
    time += row.total_time_seconds ?? 0;
  }

  return {
    verses_read: read,
    verses_memorized: mem,
    total_time_seconds: time,
    total_verses: totalVerses,
  };
}

/* ----------------------------- Classes ----------------------------- */

export async function getUpcomingClasses(): Promise<ClassSession[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("classes")
    .select("*")
    .gte("class_date", today)
    .order("class_date", { ascending: true })
    .order("class_time", { ascending: true });
  return (data as ClassSession[]) ?? [];
}

/* ----------------------------- Quizzes ----------------------------- */

export async function getPublishedQuizzes(): Promise<Quiz[]> {
  const { data } = await supabase
    .from("quizzes")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Quiz[]) ?? [];
}

export async function getQuiz(quizId: string): Promise<Quiz | null> {
  const { data } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .maybeSingle();
  return (data as Quiz) ?? null;
}

export async function getQuizQuestions(
  quizId: string,
): Promise<PublicQuizQuestion[]> {
  const { data } = await supabase
    .from("quiz_questions")
    .select(
      "id, quiz_id, question, option_a, option_b, option_c, option_d, display_order, created_at, updated_at",
    )
    .eq("quiz_id", quizId)
    .order("display_order", { ascending: true });
  return (data as PublicQuizQuestion[]) ?? [];
}

export async function getUserAttempts(
  quizId: string,
  userId: string,
): Promise<QuizAttempt[]> {
  const { data } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", quizId)
    .eq("user_id", userId)
    .order("started_at", { ascending: false });
  return (data as QuizAttempt[]) ?? [];
}

export async function getAttempt(
  attemptId: string,
): Promise<QuizAttempt | null> {
  const { data } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("id", attemptId)
    .maybeSingle();
  return (data as QuizAttempt) ?? null;
}

export async function getAttemptAnswers(
  attemptId: string,
): Promise<QuizAnswer[]> {
  const { data } = await supabase
    .from("quiz_answers")
    .select("*")
    .eq("attempt_id", attemptId);
  return (data as QuizAnswer[]) ?? [];
}

export async function startQuizAttempt(
  quizId: string,
  userId: string,
): Promise<string | null> {
  const questions = await getQuizQuestions(quizId);
  if (questions.length === 0) return null;
  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: quizId,
      user_id: userId,
      total_questions: questions.length,
    })
    .select("id")
    .single();
  if (error) return null;
  return (data as any).id as string;
}

export async function submitQuizAttempt(
  attemptId: string,
  answers: { question_id: string; selected_option: string | null }[],
): Promise<SubmitQuizResult | null> {
  const { data, error } = await supabase.rpc("submit_quiz_attempt", {
    p_attempt_id: attemptId,
    p_answers: answers,
  });
  if (error) return null;
  return data as SubmitQuizResult;
}

export async function getRecentQuizResult(
  userId: string,
): Promise<{ title: string; score: number; total: number } | null> {
  const { data } = await supabase
    .from("quiz_attempts")
    .select("score, total_questions, completed_at, quizzes(title)")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const row = data as any;
  return {
    title: row.quizzes?.title ?? "प्रश्नमंजुषा",
    score: row.score ?? 0,
    total: row.total_questions ?? 0,
  };
}
