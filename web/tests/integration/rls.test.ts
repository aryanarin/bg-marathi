import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Live RLS behaviour tests.
 *
 * These run against the real Supabase project using the anon key (exactly what
 * a browser holds) and the service-role key (to seed and clean up). They assert
 * that Row Level Security and the column grants actually BEHAVE correctly, not
 * merely that RLS is enabled.
 *
 * They are opt-in: the whole suite skips unless the three Supabase env vars are
 * present, so a fresh clone or CI without secrets is unaffected. Run locally
 * with `npm run test:rls`.
 *
 * This suite caught a real hole during Phase 2: the `anon` role retained
 * Supabase's default full-table grant on quiz_questions, exposing the answer
 * key to unauthenticated clients. Migration 0009 closed it. Keeping the test
 * makes that a permanent regression guard.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const configured = Boolean(url && anonKey && serviceKey);

// Fixed ids in a range that cannot collide with real content.
const chapterId = "00000000-0000-0000-0000-0000000c0001";
const verseId = "00000000-0000-0000-0000-0000000e0001";
const quizId = "00000000-0000-0000-0000-0000000f0001";
const questionId = "00000000-0000-0000-0000-00000000a001";

describe.skipIf(!configured)("RLS behaviour (live)", () => {
  let anon: SupabaseClient;
  let admin: SupabaseClient;

  beforeAll(async () => {
    anon = createClient(url!, anonKey!);
    admin = createClient(url!, serviceKey!, { auth: { persistSession: false } });

    await admin.from("chapters").upsert({
      id: chapterId,
      chapter_number: 18,
      name_sanskrit: "परीक्षा",
      name_marathi: "चाचणी",
      total_verses: 1,
      display_order: 99,
    });
    await admin.from("verses").upsert({
      id: verseId,
      chapter_id: chapterId,
      verse_number: 1,
      sanskrit_text: "परीक्षा श्लोक",
      display_order: 1,
    });
    await admin.from("quizzes").upsert({ id: quizId, title: "rls test quiz", is_published: true });
    await admin.from("quiz_questions").upsert({
      id: questionId,
      quiz_id: quizId,
      question: "test?",
      option_a: "a",
      option_b: "b",
      option_c: "c",
      option_d: "d",
      correct_option: "b",
      explanation: "because b",
      display_order: 1,
    });
  });

  afterAll(async () => {
    if (!admin) return;
    await admin.from("quiz_questions").delete().eq("id", questionId);
    await admin.from("quizzes").delete().eq("id", quizId);
    await admin.from("verses").delete().eq("id", verseId);
    await admin.from("chapters").delete().eq("id", chapterId);
  });

  it("lets anon read public chapter content", async () => {
    const { data, error } = await anon.from("chapters").select("id").eq("id", chapterId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("blocks anon from inserting chapters", async () => {
    const { error } = await anon.from("chapters").insert({
      chapter_number: 17,
      name_sanskrit: "x",
      name_marathi: "x",
      total_verses: 1,
      display_order: 17,
    });
    expect(error).not.toBeNull();
  });

  it("blocks anon from modifying verses", async () => {
    await anon.from("verses").update({ translation: "hacked" }).eq("id", verseId);
    const { data } = await admin
      .from("verses")
      .select("translation")
      .eq("id", verseId)
      .single();
    expect(data?.translation).toBeNull();
  });

  it("never exposes the quiz answer key to anon", async () => {
    const { data, error } = await anon
      .from("quiz_questions")
      .select("correct_option")
      .eq("id", questionId);
    const blocked = Boolean(error) || !data || data.length === 0;
    expect(blocked).toBe(true);
  });

  it("blocks anon from reading quiz questions at all (signed-in feature)", async () => {
    const { data, error } = await anon
      .from("quiz_questions")
      .select("id, question")
      .eq("id", questionId);
    const blocked = Boolean(error) || !data || data.length === 0;
    expect(blocked).toBe(true);
  });

  it("blocks anon from reading profiles", async () => {
    const { data, error } = await anon.from("profiles").select("id");
    const blocked = Boolean(error) || !data || data.length === 0;
    expect(blocked).toBe(true);
  });
});
