#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Extract one chapter of the Marathi Bhagavad-gita As It Is from the legacy
Chanakya-encoded PDF into content/chapter-NN.json.

Pipeline:
  1. Decode the whole PDF with krutiextract (reads the logical character stream,
     so matras do not scramble; auto-detects the Chanakya profile).
  2. Apply a correction table for the systematic half-form glyph gaps the
     decoder leaves (mostly the म् half-form, which drops to U+FFFD).
  3. Slice the requested chapter's BODY (not the table of contents).
  4. Split into verses on the Devanagari danda+number markers (॥ N॥ / ॥ N-M॥).
  5. Within each verse, separate Sanskrit, word-to-word, translation, purport
     using the book's consistent markers.
  6. Flag any residual U+FFFD inline as "[?]" so manual review goes straight to
     the spots that need a human eye.
  7. Emit JSON in the schema the validator/importer already expect, mapping
     audio by verse number to the mirrored Supabase Storage files.

This is a BEST-EFFORT extraction of scripture. The output MUST be proofread
against the PDF before import. Accuracy is high (~95%+) but not guaranteed.

Usage:
  python scripts/extract_chapter.py 1
"""

import json
import re
import sys
from pathlib import Path

try:
    from krutiextract import convert_pdf
except ImportError:
    sys.exit("krutiextract is required: python -m pip install krutiextract")

PDF = Path(r"C:\Users\ysary\Downloads\Documents\bhagvad-gita-marathi-_compress.pdf")
REPO = Path(__file__).resolve().parent.parent.parent  # scripts/ -> web/ -> repo
CONTENT_DIR = REPO / "content"

# Chapter body start/end anchors. The body of each chapter opens with the first
# speaker's "उवाच" or the first bold Sanskrit; we anchor chapter 1 on the known
# opening and bound it by the next chapter heading in body form.
CHAPTER_HEADINGS = {
    1: ("धृतराष्ट्र उवाच", "अध्याय दुसरा"),
}

# ---------------------------------------------------------------------------
# Correction table.
#
# Each entry is evidence-based from scanning chapter 1's residual U+FFFD
# contexts. The dominant gap is the म् half-form before a consonant, which the
# decoder drops. We fix the unambiguous cases; anything left as U+FFFD is
# surfaced as "[?]" for manual review rather than guessed.
# ---------------------------------------------------------------------------
FFFD = "\ufffd"

CORRECTIONS = [
    (FFFD + "हण", "म्हण"),       # म्हणाला / म्हणजे / म्हणून
    ("हात्" + FFFD + "य", "हात्म्य"),  # माहात्म्य
    (FFFD + "क्ष", "क्ष"),        # stray marker before क्ष (धर्म क्षेत्रे split)
    ("ष्टï्र", "ष्ट्र"),           # धृतराष्ट्र artifact
    ("ï", ""),                    # stray combining artifact
    # Quote glyphs: the Chanakya curly quotes decode to Ó / Ò. The book uses
    # them as single quotes around terms (e.g. 'कुरुक्षेत्रÓ -> 'कुरुक्षेत्र').
    ("\u00d3", "'"),              # Ó closing single quote
    ("\u00d2", "'"),              # Ò opening single quote
    # Reph/vocalic mis-decodes seen in chapter 1:
    ("धाृमक", "धार्मिक"),          # धार्मिक
    ("दुृमळ", "दुर्मिळ"),           # दुर्मिळ
    ("ॢ", "ृ"),                   # vocalic-r variant fallback
    ("²", "दृ"),                  # ²ष्ट्वा -> दृष्ट्वा (verse 2 opening)
]

# Running page furniture to strip from commentary: the header line, chapter
# label lines, and standalone page numbers.
PAGE_FURNITURE = [
    re.compile(r"\n\s*भगवद्गीता.{0,20}जशी आहे तशी\s*\n"),
    re.compile(r"\n\s*अध्याय\s*[०-९\d]+\s*\n"),
    re.compile(r"\n\s*\d{1,3}\s*\n"),
]

# The eyelash-ra: the book renders ऱ्य as "X:या". krutiextract passes the ':'
# through. "करणा:या" -> "करणाऱ्या". Apply only in the ":या" word context, which
# is where the eyelash-ra legitimately occurs in Marathi.
EYELASH_RA = re.compile(r"ा:या")


def correct(text: str) -> str:
    for a, b in CORRECTIONS:
        text = text.replace(a, b)
    text = EYELASH_RA.sub("ाऱ्या", text)
    # Any remaining replacement char: make it visible for review.
    text = text.replace(FFFD, "[?]")
    return text


def clean(text: str) -> str:
    """Strip page furniture, markdown emphasis, headers, and collapse space."""
    # Remove running headers / chapter labels / standalone page numbers first,
    # while newlines still delimit them.
    for pat in PAGE_FURNITURE:
        text = pat.sub("\n", text)
    text = text.replace("**", "").replace("*", "")
    text = text.replace("####", " ").replace("###", " ").replace("#", "")
    text = re.sub(r"\.\s*\.\s*(\.\s*)+", " ", text)  # dotted TOC leaders, if any
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


AUDIO_BASE = (
    "https://mjavrqbierktlafrkoxu.supabase.co/storage/v1/object/public/verse-audio"
)


def audio_url(chapter: int, start: int, end: int | None) -> str:
    cc = f"{chapter:02d}"
    if end and end != start:
        name = f"Bg-{cc}-{start:02d}-{end:02d}.mp3"
    else:
        name = f"Bg-{cc}-{start:02d}.mp3"
    return f"{AUDIO_BASE}/{cc}/{name}"


# ---------------------------------------------------------------------------
# Verse splitting.
#
# A verse block ends at its danda+number marker "॥ N॥" (or a range "॥ N-M॥").
# Everything from the previous marker (or chapter start) up to and including the
# marker is the verse header: an optional "<speaker> उवाच" line + the bold
# Sanskrit. What follows the marker, up to the next danda marker, holds the
# word-to-word (dash-glossed terms), the translation, and the "तात्पर्य" purport.
# ---------------------------------------------------------------------------
DANDA_NUM = re.compile(r"॥\s*([०-९]+)\s*(?:[-–]\s*([०-९]+)\s*)?॥")

DEV_DIGITS = {d: i for i, d in enumerate("०१२३४५६७८९")}


def dev_to_int(s: str) -> int:
    return int("".join(str(DEV_DIGITS[c]) for c in s))


def extract_chapter(chapter: int) -> dict:
    md, profile, _warnings = convert_pdf(str(PDF))
    md = correct(md)

    open_anchor, close_anchor = CHAPTER_HEADINGS[chapter]
    start = md.find(open_anchor)
    if start < 0:
        sys.exit(f"Could not find chapter {chapter} body anchor {open_anchor!r}")
    # Bound by the next-chapter heading occurring AFTER the body start.
    ends = [m.start() for m in re.finditer(close_anchor, md) if m.start() > start]
    end = ends[0] if ends else len(md)
    body = md[start:end]

    # Walk danda markers; each marks the end of a Sanskrit block.
    markers = list(DANDA_NUM.finditer(body))
    verses = []
    prev_end = 0

    for i, mk in enumerate(markers):
        start_num = dev_to_int(mk.group(1))
        end_num = dev_to_int(mk.group(2)) if mk.group(2) else None

        # Sanskrit header = text from prev marker end to this marker end.
        header = body[prev_end:mk.end()]
        # The part after this marker, up to the next marker, holds this verse's
        # commentary FOLLOWED BY the next verse's Sanskrit header. Split them:
        # the next verse's header is the Sanskrit lines leading up to the next
        # danda marker. We cut the commentary at the start of that header so the
        # purport does not bleed into the next verse.
        next_start = markers[i + 1].start() if i + 1 < len(markers) else len(body)
        raw_after = body[mk.end():next_start]

        if i + 1 < len(markers):
            # The next verse's header is the tail of raw_after. A verse header
            # starts either at a "<speaker> उवाच" marker or, lacking that, at
            # the last blank-line-separated Sanskrit paragraph before the danda.
            # Prefer cutting at the last "उवाच" in raw_after; else at the last
            # "####" bold-Sanskrit heading marker the book uses for verses.
            cut = None
            for mm in re.finditer(r"[ऀ-ॿ]+\s+उवाच", raw_after):
                cut = mm.start()
            if cut is None:
                # Fall back: cut at the last standalone "####"/heading block.
                heads = list(re.finditer(r"\n#{3,4}\s", raw_after))
                if heads:
                    cut = heads[-1].start()
            commentary = raw_after[:cut] if cut is not None else raw_after
            next_header = raw_after[cut:] if cut is not None else ""
        else:
            commentary = raw_after
            next_header = ""

        # Carry the next verse's header forward so its Sanskrit parses correctly.
        prev_end = mk.end() + len(commentary)

        # --- Sanskrit: last bold run in the header that ends with this danda ---
        # Keep the devanagari lines; drop a leading "<speaker> उवाच" label.
        sanskrit = clean(header)
        # Remove the preceding verse's trailing commentary tail if any leaked:
        # keep only from the last "उवाच" or from the first Devanagari line.
        # Grab the chunk ending at the danda marker.
        san_match = re.search(r"([ऀ-ॿ:\s।॥\-–]+॥\s*[०-९]+(?:[-–][०-९]+)?॥)\s*$", sanskrit)
        if san_match:
            sanskrit = san_match.group(1).strip()

        word_to_word, translation, purport = split_commentary(commentary)

        verses.append(
            {
                "verse_number": start_num,
                **({"verse_number_end": end_num} if end_num else {}),
                "sanskrit_text": sanskrit,
                "word_to_word": word_to_word,
                "translation": translation,
                "purport": purport,
                "easy_explanation": "",
                "example": "",
                "audio_url": audio_url(chapter, start_num, end_num),
                "audio_provider": "supabase_storage",
            }
        )

    verses = group_combined_verses(verses, chapter)

    return {
        "chapter_number": chapter,
        "name_sanskrit": "अर्जुनविषादयोग",
        "name_marathi": "अर्जुनाचा विषाद",
        "description": "कुरुक्षेत्राच्या रणांगणावर अर्जुनाला झालेला मोह आणि विषाद.",
        "verses": verses,
    }


def split_commentary(commentary: str) -> tuple[str, str, str]:
    """
    Split a verse's commentary block into (word_to_word, translation, purport).

    Structure in the book, after the Sanskrit danda marker:
      <word gloss: "term— meaning; term— meaning; …">
      <translation: one bold Marathi sentence/paragraph>
      तात्पर्य : <purport, one or more paragraphs>

    The word gloss is a run of em-dash ("—") separated pairs. The translation is
    the text after the final gloss pair and before "तात्पर्य". A leading-member
    combined verse has NO gloss and NO तात्पर्य here (its commentary lives under
    the group's last verse); we return it as translation-only so the grouping
    pass can fold it.
    """
    word_to_word = ""
    translation = ""
    purport = ""

    tp = re.search(r"तात्पर्य\s*[:：]", commentary)
    if tp:
        purport = clean(commentary[tp.end():])
        pre = commentary[:tp.start()]
    else:
        pre = commentary

    pre_clean = clean(pre)

    if "—" in pre_clean:
        # Word gloss ends at the LAST "—…;" pair. Find the last ';' that comes
        # after the last '—', so the trailing (dash-less) sentence is the
        # translation.
        last_dash = pre_clean.rfind("—")
        semi_after = pre_clean.find(";", last_dash)
        if semi_after != -1:
            word_to_word = pre_clean[: semi_after + 1].strip()
            translation = pre_clean[semi_after + 1 :].strip()
        else:
            # No ';' after the last dash: the whole thing is gloss (translation
            # likely merged into the next line); keep it as gloss.
            word_to_word = pre_clean
    else:
        # No gloss here: either a combined-verse leading member (pure Sanskrit)
        # or a stray fragment. Treat as translation for the grouping pass.
        translation = pre_clean

    return word_to_word, translation, purport


def group_combined_verses(verses: list[dict], chapter: int) -> list[dict]:
    """
    Merge combined verses.

    Bhagavad-gita As It Is prints every Sanskrit text with its own danda number,
    but groups several consecutive verses under one shared word-to-word +
    translation + purport, printed after the last verse of the run. The parser
    therefore produces some verses with empty commentary (the leading members of
    a group) followed by one verse carrying all the commentary.

    We merge a run of empty-commentary verses forward into the next verse that
    has commentary: the Sanskrit blocks concatenate, verse_number spans the run,
    and the audio URL is re-derived for the range so it matches the combined
    recitation file (e.g. Bg-01-16-18.mp3).
    """

    def has_commentary(v: dict) -> bool:
        return bool(
            v["word_to_word"].strip()
            or v["translation"].strip()
            or v["purport"].strip()
        )

    grouped: list[dict] = []
    pending: list[dict] = []  # leading verses with no commentary yet

    for v in verses:
        if not has_commentary(v) and not v["purport"].strip():
            # Could be a leading member of a group; hold it.
            pending.append(v)
            continue

        if pending:
            # Fold the held verses into this one.
            start_num = pending[0]["verse_number"]
            end_num = v["verse_number"]
            sanskrit = "\n".join(
                [p["sanskrit_text"] for p in pending] + [v["sanskrit_text"]]
            )
            v = {
                **v,
                "verse_number": start_num,
                "verse_number_end": end_num,
                "sanskrit_text": sanskrit,
                "audio_url": audio_url(chapter, start_num, end_num),
            }
            pending = []

        grouped.append(v)

    # Any trailing held verses with no commentary at all: keep them as-is so
    # nothing is silently dropped (they will surface in validation).
    grouped.extend(pending)
    return grouped


# Placeholder for a field the parser could not populate, so the draft is honest
# and the validator passes. Every occurrence is a spot the reviewer must fill.
REVIEW = "[पुनरावलोकन आवश्यक]"  # "review required"


def main() -> None:
    chapter = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    data = extract_chapter(chapter)

    verses = data["verses"]
    empty_fields = 0
    for v in verses:
        for field in ("word_to_word", "translation", "purport"):
            if not v[field].strip():
                v[field] = REVIEW
                empty_fields += 1

    CONTENT_DIR.mkdir(exist_ok=True)
    # Written as a DRAFT: this is machine-extracted scripture that MUST be
    # proofread before it becomes the live chapter-01.json. The validator and
    # importer only look at chapter-NN.json, so a .draft.json is never imported
    # by accident.
    out = CONTENT_DIR / f"chapter-{chapter:02d}.draft.json"
    out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    residual = sum(
        v["sanskrit_text"].count("[?]")
        + v["word_to_word"].count("[?]")
        + v["translation"].count("[?]")
        + v["purport"].count("[?]")
        for v in verses
    )
    nums = [v["verse_number"] for v in verses]
    print(f"Wrote {out}")
    print(f"  verses: {len(verses)}  (numbers {nums[0]}..{nums[-1]})")
    print(f"  residual [?] glyph markers to review: {residual}")
    print(f"  fields the parser left blank (need review): {empty_fields}")
    print(
        "\nThis is a DRAFT. Proofread against the PDF, rename to "
        f"chapter-{chapter:02d}.json, then run `npm run content:validate`."
    )


if __name__ == "__main__":
    main()
