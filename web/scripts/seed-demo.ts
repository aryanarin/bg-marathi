#!/usr/bin/env tsx
/**
 * Seed demonstration content.
 *
 * Inserts ONE chapter with a few verses, one upcoming class, and one published
 * quiz, so the app can be exercised end to end before the real Marathi content
 * is proofread and imported.
 *
 * IMPORTANT about the text:
 *   - sanskrit_text and audio_url are REAL (audio points at the mirrored files
 *     in Supabase Storage).
 *   - word_to_word / translation / purport here are SAMPLE placeholders, clearly
 *     marked, NOT verified scripture. They exist only to make the UI functional.
 *     Replace them via the admin UI or the content import once proofread.
 *
 * Uses the service-role key (no user session in a CLI). Idempotent: upserts on
 * natural keys so re-running does not duplicate.
 *
 * Usage: npm run seed:demo
 */

import path from "node:path";
import process from "node:process";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/lib/database.types";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase env in .env.local");
  process.exit(1);
}

const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });

const AUDIO_BASE =
  `${url}/storage/v1/object/public/verse-audio`;

/** Real first verses of chapter 1 (Sanskrit + audio); Marathi is placeholder. */
const CH1_VERSES = [
  {
    verse_number: 1,
    sanskrit_text:
      "धृतराष्ट्र उवाच\nधर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः ।\nमामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय ॥ १ ॥",
    file: "Bg-01-01.mp3",
  },
  {
    verse_number: 2,
    sanskrit_text:
      "सञ्जय उवाच\nदृष्ट्वा तु पाण्डवानीकं व्यूढं दुर्योधनस्तदा ।\nआचार्यमुपसङ्गम्य राजा वचनमब्रवीत् ॥ २ ॥",
    file: "Bg-01-02.mp3",
  },
  {
    verse_number: 3,
    sanskrit_text:
      "पश्यैतां पाण्डुपुत्राणामाचार्य महतीं चमूम् ।\nव्यूढां द्रुपदपुत्रेण तव शिष्येण धीमता ॥ ३ ॥",
    file: "Bg-01-03.mp3",
  },
] as const;

const PLACEHOLDER = "[नमुना मजकूर — पडताळणीनंतर बदला]";

async function seedChapter() {
  const { data: chapter, error } = await supabase
    .from("chapters")
    .upsert(
      {
        chapter_number: 1,
        name_sanskrit: "अर्जुनविषादयोग",
        name_marathi: "अर्जुनाचा विषाद",
        description: "कुरुक्षेत्राच्या रणांगणावर अर्जुनाला झालेला मोह आणि विषाद.",
        total_verses: 47,
        display_order: 1,
      },
      { onConflict: "chapter_number" },
    )
    .select("id")
    .single();

  if (error || !chapter) throw new Error(`chapter: ${error?.message}`);

  for (const v of CH1_VERSES) {
    const { error: vErr } = await supabase.from("verses").upsert(
      {
        chapter_id: chapter.id,
        verse_number: v.verse_number,
        sanskrit_text: v.sanskrit_text,
        word_to_word: PLACEHOLDER,
        translation: PLACEHOLDER,
        purport: PLACEHOLDER,
        audio_url: `${AUDIO_BASE}/01/${v.file}`,
        audio_provider: "supabase_storage",
        display_order: v.verse_number,
      },
      { onConflict: "chapter_id,verse_number" },
    );
    if (vErr) throw new Error(`verse ${v.verse_number}: ${vErr.message}`);
  }

  console.log(`  chapter 1 + ${CH1_VERSES.length} verses`);
  return chapter.id;
}

async function seedClass() {
  const next = new Date();
  next.setDate(next.getDate() + 3);
  const dateStr = next.toISOString().slice(0, 10);

  // No natural unique key on classes; look for an existing demo row by title.
  const { data: existing } = await supabase
    .from("classes")
    .select("id")
    .eq("title", "अध्याय १ — प्रास्ताविक वर्ग")
    .maybeSingle();

  const row = {
    title: "अध्याय १ — प्रास्ताविक वर्ग",
    description: "भगवद्गीतेच्या पहिल्या अध्यायाची ओळख.",
    class_date: dateStr,
    class_time: "19:30:00",
    meeting_platform: "google_meet" as const,
    meeting_url: "https://meet.google.com/abc-defg-hij",
    is_published: true,
  };

  if (existing) {
    await supabase.from("classes").update(row).eq("id", existing.id);
  } else {
    await supabase.from("classes").insert(row);
  }
  console.log("  1 published class");
}

async function seedQuiz() {
  const { data: existing } = await supabase
    .from("quizzes")
    .select("id")
    .eq("title", "अध्याय १ — प्रश्नमंजुषा")
    .maybeSingle();

  let quizId: string;
  if (existing) {
    quizId = existing.id;
    await supabase.from("quizzes").update({ is_published: true }).eq("id", quizId);
  } else {
    const { data, error } = await supabase
      .from("quizzes")
      .insert({
        title: "अध्याय १ — प्रश्नमंजुषा",
        description: "पहिल्या अध्यायावर आधारित छोटी प्रश्नमंजुषा.",
        is_published: true,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(`quiz: ${error?.message}`);
    quizId = data.id;
  }

  // Replace questions so re-running stays idempotent.
  await supabase.from("quiz_questions").delete().eq("quiz_id", quizId);
  await supabase.from("quiz_questions").insert([
    {
      quiz_id: quizId,
      question: "भगवद्गीतेचा संवाद कोणत्या रणांगणावर घडला?",
      option_a: "कुरुक्षेत्र",
      option_b: "हस्तिनापूर",
      option_c: "मथुरा",
      option_d: "द्वारका",
      correct_option: "a",
      explanation: "पहिल्या श्लोकातच ‘धर्मक्षेत्रे कुरुक्षेत्रे’ असा उल्लेख आहे.",
      display_order: 1,
    },
    {
      quiz_id: quizId,
      question: "पहिल्या श्लोकात कोण बोलत आहे?",
      option_a: "अर्जुन",
      option_b: "श्रीकृष्ण",
      option_c: "धृतराष्ट्र",
      option_d: "संजय",
      correct_option: "c",
      explanation: "‘धृतराष्ट्र उवाच’ — पहिला श्लोक धृतराष्ट्र बोलतो.",
      display_order: 2,
    },
  ]);

  console.log("  1 published quiz + 2 questions");
}

async function main() {
  console.log("Seeding demo content…");
  await seedChapter();
  await seedClass();
  await seedQuiz();
  console.log("Done. NOTE: Marathi verse fields are sample placeholders — replace before launch.");
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
