import { describe, expect, it } from "vitest";

import {
  chapterContentSchema,
  findVerseGaps,
  verseContentSchema,
} from "@/lib/content/schema";

/** A minimal valid verse, used as a base for targeted mutations. */
function validVerse(overrides: Record<string, unknown> = {}) {
  return {
    verse_number: 1,
    sanskrit_text:
      "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः ।\nमामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय ॥",
    word_to_word: "धर्मक्षेत्रे — पवित्र धर्मभूमीवर; कुरुक्षेत्रे — कुरुक्षेत्रावर",
    translation: "धृतराष्ट्र म्हणाला: हे संजया! धर्मभूमी कुरुक्षेत्रावर…",
    purport: "धृतराष्ट्र जन्मांध होता आणि आपल्या पुत्रांबद्दल मोहग्रस्त होता.",
    ...overrides,
  };
}

function validChapter(overrides: Record<string, unknown> = {}) {
  return {
    chapter_number: 1,
    name_sanskrit: "अर्जुनविषादयोग",
    name_marathi: "अर्जुनाचा विषाद",
    verses: [validVerse()],
    ...overrides,
  };
}

describe("verseContentSchema", () => {
  it("accepts a complete verse", () => {
    expect(verseContentSchema.safeParse(validVerse()).success).toBe(true);
  });

  it("treats easy_explanation and example as optional, since the admin writes them", () => {
    const result = verseContentSchema.safeParse(validVerse());
    expect(result.success).toBe(true);
  });

  it("accepts admin-authored explanation and example when present", () => {
    const result = verseContentSchema.safeParse(
      validVerse({
        easy_explanation: "मुख्य संकल्पना: संशयी मन नेहमी चिंतीत असते.",
        example: "उदा. दोन भावंडांमध्ये भेद केल्यावर संघर्ष निर्माण होतो.",
      }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects sanskrit_text that contains no Devanagari", () => {
    // Guards against a transliterated or placeholder value being imported as
    // though it were the verse.
    const result = verseContentSchema.safeParse(
      validVerse({ sanskrit_text: "dharma-kshetre kuru-kshetre" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only required text", () => {
    expect(verseContentSchema.safeParse(validVerse({ translation: "   " })).success).toBe(
      false,
    );
    expect(verseContentSchema.safeParse(validVerse({ purport: "\n\t " })).success).toBe(
      false,
    );
  });

  it("rejects a missing required field", () => {
    const verse = validVerse();
    delete (verse as Record<string, unknown>).purport;
    expect(verseContentSchema.safeParse(verse).success).toBe(false);
  });

  it("rejects unknown keys, which are usually typos", () => {
    const result = verseContentSchema.safeParse(
      validVerse({ tranlsation: "typo key" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a verse_number below 1 or non-integer", () => {
    expect(verseContentSchema.safeParse(validVerse({ verse_number: 0 })).success).toBe(
      false,
    );
    expect(verseContentSchema.safeParse(validVerse({ verse_number: 1.5 })).success).toBe(
      false,
    );
  });

  it("allows an empty audio_url so content can land before audio", () => {
    const result = verseContentSchema.safeParse(validVerse({ audio_url: "" }));
    expect(result.success).toBe(true);
  });

  it("rejects a non-https audio_url", () => {
    expect(
      verseContentSchema.safeParse(validVerse({ audio_url: "http://x.com/a.mp3" }))
        .success,
    ).toBe(false);
    expect(
      verseContentSchema.safeParse(validVerse({ audio_url: "/local/a.mp3" })).success,
    ).toBe(false);
  });

  it("rejects an unrecognised audio_provider", () => {
    const result = verseContentSchema.safeParse(
      validVerse({ audio_url: "https://x.com/a.mp3", audio_provider: "dropbox" }),
    );
    expect(result.success).toBe(false);
  });
});

describe("chapterContentSchema", () => {
  it("accepts a valid chapter", () => {
    expect(chapterContentSchema.safeParse(validChapter()).success).toBe(true);
  });

  it("rejects a chapter_number outside 1-18", () => {
    expect(chapterContentSchema.safeParse(validChapter({ chapter_number: 0 })).success).toBe(
      false,
    );
    expect(
      chapterContentSchema.safeParse(validChapter({ chapter_number: 19 })).success,
    ).toBe(false);
  });

  it("rejects an empty verse list", () => {
    expect(chapterContentSchema.safeParse(validChapter({ verses: [] })).success).toBe(
      false,
    );
  });

  it("rejects duplicate verse numbers before they hit the unique constraint", () => {
    const result = chapterContentSchema.safeParse(
      validChapter({
        verses: [validVerse({ verse_number: 5 }), validVerse({ verse_number: 5 })],
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes("Duplicate verse_number 5")),
      ).toBe(true);
    }
  });

  it("reports the path of an invalid nested verse", () => {
    const result = chapterContentSchema.safeParse(
      validChapter({
        verses: [validVerse({ verse_number: 1 }), validVerse({ verse_number: 2, translation: "" })],
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (i) => i.path.join(".") === "verses.1.translation",
        ),
      ).toBe(true);
    }
  });
});

describe("findVerseGaps", () => {
  it("returns nothing for a contiguous run", () => {
    const verses = [1, 2, 3, 4].map((n) => validVerse({ verse_number: n }));
    expect(findVerseGaps(verses as never)).toEqual([]);
  });

  it("finds missing verse numbers", () => {
    const verses = [1, 2, 5, 7].map((n) => validVerse({ verse_number: n }));
    expect(findVerseGaps(verses as never)).toEqual([3, 4, 6]);
  });

  it("handles a single verse and an empty list", () => {
    expect(findVerseGaps([validVerse()] as never)).toEqual([]);
    expect(findVerseGaps([])).toEqual([]);
  });
});
