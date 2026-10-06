#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Extract one chapter of the Marathi Bhagavad-gita As It Is from the legacy
Chanakya-encoded PDF into content/chapter-NN.json.

Hybrid pipeline (v2):
  1. Decode the whole PDF with krutiextract (logical character stream).
  2. Apply correction table for systematic half-form glyph gaps.
  3. Slice the requested chapter, split on danda+number markers.
  4. Within each verse, separate word-to-word, translation, purport from
     the book's markers — with improved splitting and furniture removal.
  5. REPLACE the PDF's often-truncated Sanskrit with the clean text from
     vedicscriptures.github.io (cached in content/sanskrit-cache.json).
  6. Flag residual U+FFFD as "[?]" for manual review.
  7. Emit JSON matching the validator/importer schema.

Usage:
  python scripts/extract_chapter.py 1
  python scripts/extract_chapter.py all --cache decoded.md
"""

import json
import re
import sys
from pathlib import Path

# Windows consoles default to cp1252, which cannot encode Devanagari in status
# lines. Force UTF-8 so progress output (chapter names) never crashes the run.
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

try:
    from krutiextract import convert_pdf
except ImportError:
    sys.exit("krutiextract is required: python -m pip install krutiextract")

PDF = Path(r"C:\Users\ysary\Downloads\Documents\bhagvad-gita-marathi-_compress.pdf")
REPO = Path(__file__).resolve().parent.parent.parent  # scripts/ -> web/ -> repo
CONTENT_DIR = REPO / "content"
SANSKRIT_CACHE = CONTENT_DIR / "sanskrit-cache.json"

# Clean Sanskrit text, keyed "chapter.verse", from vedicscriptures.github.io.
# Populated by scripts/fetch_sanskrit.py. Used to override the PDF's Sanskrit,
# which is the weakest-extracted field (frequent truncation to just the danda).
_SANSKRIT: dict | None = None


def load_sanskrit() -> dict:
    global _SANSKRIT
    if _SANSKRIT is None:
        if SANSKRIT_CACHE.exists():
            _SANSKRIT = json.loads(SANSKRIT_CACHE.read_text(encoding="utf-8"))
        else:
            _SANSKRIT = {}
    return _SANSKRIT


def clean_api_slok(slok: str) -> str:
    """
    Normalise the API's Sanskrit, preserving the verse's line structure exactly
    like vedabase.io: each pada on its own line, the ASCII "|" line-end markers
    converted to the Devanagari danda "।", and the trailing "||c-v||" reference
    converted to a double danda "॥". Line breaks are KEPT (the verse display uses
    white-space: pre-line) so a two- or three-line verse renders as such.
    """
    if not slok:
        return ""
    # Convert the closing verse reference "||1-1||" to a double danda.
    s = re.sub(r"\s*\|\|[\d\-\.]+\|\|\s*", " ॥", slok)
    # Any remaining "||" (without a number) -> double danda.
    s = s.replace("||", "॥")
    # Single ASCII pipe line-end -> single Devanagari danda.
    s = s.replace("|", "।")
    # Normalise spaces within each line but keep newlines between padas.
    lines = [re.sub(r"[ \t]+", " ", ln).strip() for ln in s.split("\n")]
    lines = [ln for ln in lines if ln]
    return "\n".join(lines)


def int_to_dev(n: int) -> str:
    """Render an integer in Devanagari digits (16 -> '१६')."""
    return "".join("०१२३४५६७८९"[int(d)] for d in str(n))


def api_sanskrit(chapter: int, start: int, end: int | None) -> str:
    """
    Clean Sanskrit for a verse or combined range, joined from the cache.
    Returns "" if any member is missing so the caller can fall back to the PDF.
    """
    cache = load_sanskrit()
    nums = range(start, (end or start) + 1)
    parts = []
    for n in nums:
        entry = cache.get(f"{chapter}.{n}")
        if not entry or not entry.get("slok"):
            return ""
        text = clean_api_slok(entry["slok"])
        # Embed the Devanagari verse number in the closing danda, like
        # vedabase.io ("॥ १६ ॥"). Replace the final bare "॥" with "॥ N ॥".
        dev_n = int_to_dev(n)
        if text.endswith("॥"):
            text = text[:-1].rstrip() + f" ॥ {dev_n} ॥"
        parts.append(text)
    return "\n".join(parts).strip()

# Marathi ordinal words in the book's chapter headings, index 1..18. Some
# chapters use spelling variants (ch4 "चवथा", not "चौथा"), so each entry is a
# list of accepted spellings. Boundaries are the BODY heading "अध्याय <word>**"
# (the "**" distinguishes the real heading from the "अध्याय 4" running header).
CHAPTER_ORDINALS = [
    ["पहिला"],
    ["दुसरा"],
    ["तिसरा"],
    ["चवथा", "चौथा"],
    ["पाचवा"],
    ["सहावा"],
    ["सातवा"],
    ["आठवा"],
    ["नववा"],
    ["दहावा"],
    ["अकरावा"],
    ["बारावा"],
    ["तेरावा"],
    ["चौदावा"],
    ["पंधरावा"],
    ["सोळावा"],
    ["सतरावा"],
    ["अठरावा"],
]

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
    ("\u00d3", "'"),              # Ó closing single quote
    ("\u00d2", "'"),              # Ò opening single quote
    ("धाृमक", "धार्मिक"),          # धार्मिक
    ("दुृमळ", "दुर्मिळ"),           # दुर्मिळ
    ("ॢ", "ृ"),                   # vocalic-r variant fallback
    ("²", "दृ"),                  # ²ष्ट्वा -> दृष्ट्वा (verse 2 opening)
    # Additional corrections from scanning chapters 1-18 drafts:
    ("आृथक", "आर्थिक"),           # आर्थिक (economic)
    ("अकीृतकर", "अकीर्तिकर"),     # अकीर्तिकर
    ("निरा:या", "निराऱ्या"),       # eyelash-ra in other contexts
    ("दुस:या", "दुसऱ्या"),         # दुसऱ्या (second)
    ("जिव्हाûया", "जिव्हाळ्या"),   # जिव्हाळ्या
    ("निरनिराûया", "निरनिराळ्या"), # निरनिराळ्या
    ("सार[?]या", "सारख्या"),       # common post-[?] fix
    ("तु[?]हाला", "तुम्हाला"),     # तुम्हाला
    ("तु[?]ही", "तुम्ही"),         # तुम्ही
    ("आ[?]ही", "आम्ही"),           # आम्ही
    ("आ[?]हाला", "आम्हाला"),       # आम्हाला
    ("[?]हटले", "म्हटले"),         # म्हटले
    ("मनुष्य[?]जीवन", "मनुष्यजीवन"),
    ("मानव[?]समाज", "मानवसमाज"),
    ("सां[?]य", "सांख्य"),         # सांख्ययोग
    ("आत्[?]य", "आत्म्य"),        # आत्म्या
    ("जुûया", "जुळ्या"),           # जुळ्या
    # Nasal/conjunct fixes from systematic scan of all 18 chapters:
    ("कृष्णस[?]बन्ध", "कृष्णसम्बन्ध"),
    ("चरणा[?]बुज", "चरणाम्बुज"),
    ("तु[?]यम्", "तुल्यम्"),
    ("कामका[?]यया", "कामकाम्यया"),
    ("धृष्टद्यु[?]न", "धृष्टद्युम्न"),
    ("उपसङ्ग[?]य", "उपसङ्गम्य"),
    ("स[?]बन्ध", "सम्बन्ध"),
    ("स[?]पूर्ण", "सम्पूर्ण"),
    ("स[?]पत्ती", "सम्पत्ती"),
    ("स[?]मत", "सम्मत"),
    ("स[?]भव", "सम्भव"),
    ("स[?]न्यास", "संन्यास"),
    ("नि[?]न", "निम्न"),
    ("प्रशंसनी[?]", "प्रशंसनीय"),
    ("ज्ञान[?]य", "ज्ञानमय"),
    ("भगवद्गीता [?] जशी आहे तशी", ""),
    ("भगवद्गीता[?]जशी आहे तशी", ""),
    ("श्री[?]\n", "\n"),
    ("श्री[?] ", " "),
]

# Running page furniture to strip from commentary: the header line, chapter
# label lines, and standalone page numbers.
PAGE_FURNITURE = [
    re.compile(r"\n\s*भगवद्गीता.{0,30}जशी आहे तशी\s*\n"),
    re.compile(r"\n\s*भगवद्गीता\s*\[\?\].{0,20}जशी आहे तशी\s*\n"),
    re.compile(r"\n\s*अध्याय\s*[०-९\d]+\s*\n"),
    re.compile(r"\n\s*\d{1,3}\s*\n"),
    re.compile(r"\n\s*श्लोक\s+[०-९\d]+\s*\n"),
    re.compile(r"\n\s*[ऀ-ॿ]+योग\s*\n"),
    re.compile(r"\n\s*अर्जुनविषादयोग\s*\n"),
]

# The eyelash-ra: the book renders ऱ्य as "X:या". krutiextract passes the ':'
# through. "करणा:या" -> "करणाऱ्या". Apply only in the ":या" word context, which
# is where the eyelash-ra legitimately occurs in Marathi.
EYELASH_RA = re.compile(r"ा:या")


def correct(text: str) -> str:
    # First pass: fix the FFFD-based glyph gaps while the raw marker is present.
    for a, b in CORRECTIONS:
        if FFFD in a:
            text = text.replace(a, b)
    text = EYELASH_RA.sub("ाऱ्या", text)
    # Any remaining replacement char: make it visible for review.
    text = text.replace(FFFD, "[?]")
    # Second pass: fix patterns that reference the visible "[?]" marker and the
    # non-FFFD glyph mis-decodes (quotes, reph, eyelash-ra variants).
    for a, b in CORRECTIONS:
        if FFFD not in a:
            text = text.replace(a, b)
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


def chapter_body_offset(md: str, chapter: int) -> int:
    """
    Offset of a chapter's heading in the BODY (not the table of contents).

    Each "अध्याय <ordinal>" appears twice: once in the TOC (small offset, with
    dotted leaders) and once at the real chapter start. We take the last
    occurrence, which is the body one. Chapters whose heading renders only once
    fall back to the single hit.
    """
    words = CHAPTER_ORDINALS[chapter - 1]
    # Match the real heading "अध्याय <word>**" (the trailing ** separates it from
    # the "अध्याय 4" running-header on every page). Try each spelling variant.
    # Note \s* not \s+: some headings render with no space ("अध्यायपंधरावा").
    for word in words:
        hits = [m.start() for m in re.finditer(r"अध्याय\s*" + word + r"\s*\*\*", md)]
        body_hits = [h for h in hits if h > 20000]
        if body_hits:
            return body_hits[0]
    # Fallback: plain "अध्याय <word>" without the ** (some headings differ).
    for word in words:
        hits = [h for h in (m.start() for m in re.finditer(r"अध्याय\s*" + word, md)) if h > 20000]
        if hits:
            return hits[0]
    sys.exit(f"Could not find body heading for chapter {chapter} ({words})")


# Canonical chapter names (Sanskrit yoga name + Marathi descriptive title),
# used as a reliable fallback when the PDF heading parse misses. Marathi titles
# follow the Bhagavad-gita As It Is Marathi edition's chapter descriptions.
CHAPTER_NAMES = {
    1: ("अर्जुनविषादयोग", "कुरुक्षेत्रातील युद्धस्थळावर सैन्यांचे निरीक्षण"),
    2: ("सांख्ययोग", "गीतेचा सारांश"),
    3: ("कर्मयोग", "कर्मयोग"),
    4: ("ज्ञानकर्मसंन्यासयोग", "दिव्य ज्ञान"),
    5: ("कर्मसंन्यासयोग", "कृष्णभावनाभावित कर्म"),
    6: ("ध्यानयोग", "ध्यानयोग"),
    7: ("ज्ञानविज्ञानयोग", "भगवज्ज्ञान"),
    8: ("अक्षरब्रह्मयोग", "भगवत्प्राप्ती"),
    9: ("राजविद्याराजगुह्ययोग", "परमगुह्य ज्ञान"),
    10: ("विभूतियोग", "श्रीभगवंतांचे ऐश्वर्य"),
    11: ("विश्वरूपदर्शनयोग", "विराट रूप"),
    12: ("भक्तियोग", "भक्तियोग"),
    13: ("क्षेत्रक्षेत्रज्ञविभागयोग", "प्रकृती, पुरुष आणि चेतना"),
    14: ("गुणत्रयविभागयोग", "प्रकृतीचे तीन गुण"),
    15: ("पुरुषोत्तमयोग", "पुरुषोत्तम योग"),
    16: ("दैवासुरसंपद्विभागयोग", "दैवी आणि आसुरी स्वभाव"),
    17: ("श्रद्धात्रयविभागयोग", "श्रद्धेचे तीन प्रकार"),
    18: ("मोक्षसंन्यासयोग", "उपसंहार - संन्यासाची सिद्धी"),
}


def extract_chapter_name(body: str, chapter: int) -> tuple[str, str]:
    """
    Prefer the canonical name table; fall back to the PDF heading parse.
    """
    if chapter in CHAPTER_NAMES:
        return CHAPTER_NAMES[chapter]
    head = body[:400]
    m = re.search(r"\*\*\s*([ऀ-ॿ][ऀ-ॿ \u200d]*?योग)\s*\**\s*(?:\(([^)]*)\))?", head)
    if not m:
        return ("", "")
    sanskrit = re.sub(r"\s+", "", m.group(1)).strip()
    marathi = (m.group(2) or sanskrit).strip()
    return sanskrit, marathi


def extract_chapter_from_md(md: str, chapter: int) -> dict:
    """Extract one chapter from already-decoded + corrected markdown."""
    start = chapter_body_offset(md, chapter)
    # Bound by the next chapter's body heading, or end of document for ch 18.
    if chapter < 18:
        end = chapter_body_offset(md, chapter + 1)
    else:
        end = len(md)
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

        api_san = api_sanskrit(chapter, start_num, end_num)
        if api_san:
            sanskrit = api_san

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

    name_sanskrit, name_marathi = extract_chapter_name(body, chapter)
    # Fallbacks so required fields are never empty if the heading parse misses;
    # the admin can correct names in the UI like any other field.
    if not name_sanskrit:
        name_sanskrit = f"अध्याय {chapter}"
    if not name_marathi:
        name_marathi = name_sanskrit

    return {
        "chapter_number": chapter,
        "name_sanskrit": name_sanskrit,
        "name_marathi": name_marathi,
        "description": "",
        "verses": verses,
    }


def split_commentary(commentary: str) -> tuple[str, str, str]:
    """
    Split a verse's commentary block into (word_to_word, translation, purport).

    Structure in the book, after the Sanskrit danda marker:
      <word gloss: "term— meaning; term— meaning; …">
      <translation: one bold Marathi sentence/paragraph (after last gloss ';')>
      तात्पर्य : <purport, one or more paragraphs>
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
        last_dash = pre_clean.rfind("—")
        semi_after = pre_clean.find(";", last_dash)
        dot_after = pre_clean.find(".", last_dash)
        if semi_after != -1:
            word_to_word = pre_clean[: semi_after + 1].strip()
            translation = pre_clean[semi_after + 1 :].strip()
        elif dot_after != -1 and dot_after < len(pre_clean) - 5:
            word_to_word = pre_clean[: dot_after + 1].strip()
            translation = pre_clean[dot_after + 1 :].strip()
        else:
            word_to_word = pre_clean
    else:
        translation = pre_clean

    purport = strip_trailing_sanskrit(purport)
    translation = strip_trailing_sanskrit(translation)

    return word_to_word, translation, purport


TRAILING_SANSKRIT = re.compile(
    r"\n\s*(?:श्री)?(?:भगवान|सञ्जय|अर्जुन|धृतराष्ट्र)[ऀ-ॿ]*\s*उवाच\s*$"
    r"|"
    r"\n\s*[ऀ-ॿ\s:।॥\-–]{20,}$"
)


def strip_trailing_sanskrit(text: str) -> str:
    """Remove next verse's Sanskrit that leaked into the tail of this field."""
    if not text:
        return text
    text = TRAILING_SANSKRIT.sub("", text).rstrip()
    lines = text.rsplit("\n", 3)
    if len(lines) >= 2:
        last = lines[-1].strip()
        if last and re.fullmatch(r"[ऀ-ॿ\s:।॥\-–'\"]+", last) and len(last) > 15:
            text = "\n".join(lines[:-1]).rstrip()
    return text


# Marathi prose markers: finite verbs, pronouns and words that appear in
# translations/purports but not in a bare Sanskrit verse line.
MARATHI_MARKERS = (
    "म्हणाला", "म्हणाले", "आहे", "आहेत", "केले", "नाही", "असे", "अशा",
    "तू", "तुझ", "मी", "माझ", "त्या", "या ", "हे ", "होते", "पाहून",
    "करून", "यांनी", "कडून", "मला", "आपल", "त्यांच", "कसे", "काय",
)


def looks_like_sanskrit(text: str) -> bool:
    """
    True if the text looks like a bare Sanskrit verse line (leaked next-verse
    text) rather than Marathi prose. Sanskrit verse lines end with a danda
    ("।"/"|") and contain none of the Marathi prose markers.
    """
    t = text.strip()
    if not t:
        return False
    has_danda = ("।" in t) or ("|" in t) or t.endswith("॥")
    has_marathi = any(m in t for m in MARATHI_MARKERS)
    # Short, danda-bearing, marker-less => almost certainly a verse line.
    if has_danda and not has_marathi:
        return True
    # No Marathi markers at all and reasonably short: also suspect.
    if not has_marathi and len(t) < 160 and has_danda:
        return True
    return False


# Authoritative ISKCON (Bhagavad-gita As It Is) combined-verse ranges, keyed by
# chapter. Each (start, end) means verses start..end are presented as one unit
# with shared word-to-word, translation and purport. This is the exact grouping
# used by vedabase.io and by the recitation audio files (e.g. Bg-01-16-18.mp3),
# cross-verified against both. Do NOT infer grouping from the PDF: the PDF's
# per-verse commentary is unreliable and the API Sanskrit is always per-verse.
REVIEW = "[पुनरावलोकन आवश्यक]"  # "review required"

ISKCON_COMBINED: dict[int, list[tuple[int, int]]] = {
    1: [(16, 18), (21, 22), (32, 35), (37, 38)],
    2: [(42, 43)],
    5: [(8, 9), (27, 28)],
    6: [(11, 12), (13, 14), (20, 23)],
    10: [(4, 5), (12, 13)],
    11: [(10, 11), (26, 27), (41, 42)],
    12: [(3, 4), (6, 7), (13, 14), (18, 19)],
    13: [(1, 2), (6, 7), (8, 12)],
    14: [(22, 25)],
    15: [(3, 4)],
    16: [(1, 3), (11, 12), (13, 15)],
    17: [(5, 6), (26, 27)],
    18: [(51, 53)],
}


def group_combined_verses(verses: list[dict], chapter: int) -> list[dict]:
    """
    Merge combined verses according to the authoritative ISKCON grouping.

    The parser produces one entry per Sanskrit danda number. ISKCON presents
    certain consecutive verses as a single unit (shared gloss/translation/
    purport). We fold each ISKCON range into one entry: Sanskrit concatenated
    (clean API text), commentary taken from the member that carries it (usually
    the last), verse span and combined audio URL set to match the range.
    """
    ranges = ISKCON_COMBINED.get(chapter, [])
    if not ranges:
        return verses

    # Map each verse_number to its owning range start, for quick lookup.
    start_of = {}
    span_end = {}
    for s, e in ranges:
        for n in range(s, e + 1):
            start_of[n] = s
        span_end[s] = e

    by_num = {v["verse_number"]: v for v in verses}
    grouped: list[dict] = []
    consumed: set[int] = set()

    for v in verses:
        n = v["verse_number"]
        if n in consumed:
            continue

        if n in start_of and start_of[n] == n:
            s, e = n, span_end[n]
            members = [by_num[m] for m in range(s, e + 1) if m in by_num]

            def nonempty(field: str) -> str:
                # Prefer the member whose field is real Marathi prose (not a
                # review marker, not empty, not leaked Sanskrit verse text).
                for mem in members:
                    val = (mem.get(field) or "").strip()
                    if val and val != REVIEW and not looks_like_sanskrit(val):
                        return mem[field]
                # Nothing usable: leave it for review rather than keep garbage.
                return REVIEW

            combined_san = api_sanskrit(chapter, s, e)
            if not combined_san:
                combined_san = "\n".join(m["sanskrit_text"] for m in members)

            grouped.append({
                "verse_number": s,
                "verse_number_end": e,
                "sanskrit_text": combined_san,
                "word_to_word": nonempty("word_to_word"),
                "translation": nonempty("translation"),
                "purport": nonempty("purport"),
                "easy_explanation": "",
                "example": "",
                "audio_url": audio_url(chapter, s, e),
                "audio_provider": "supabase_storage",
            })
            consumed.update(range(s, e + 1))
        else:
            grouped.append(v)
            consumed.add(n)

    return grouped



def postprocess_verses(verses: list[dict]) -> None:
    """
    Clean up systematic artifacts that survive the main extraction pass:
    1. Compound-word [?] in word_to_word → hyphen (the book's compound splits)
    2. Remaining page header fragments
    3. Recover blank purports from oversized neighbors (parser merged two purports)
    """
    # 1. In word_to_word, [?] between two Devanagari words is a compound split.
    compound_re = re.compile(r"([ऀ-ॿ:]+)\[?\?\]([ऀ-ॿ])")
    for v in verses:
        if "[?]" in v["word_to_word"]:
            v["word_to_word"] = compound_re.sub(r"\1\2", v["word_to_word"])

    # 2. Strip any residual page header lines from all text fields.
    header_re = re.compile(r"भगवद्गीता\s*(?:\[\?\])?\s*जशी आहे तशी")
    for v in verses:
        for field in ("word_to_word", "translation", "purport"):
            if header_re.search(v[field]):
                v[field] = header_re.sub("", v[field]).strip()

    # 3. Recover blank purports from oversized neighbors.
    # If verse N has no purport but verse N-1 or N+1 has a purport that's 2x+
    # the chapter average, try splitting at "श्लोक N" boundary in the neighbor.
    avg_purport = 0
    real_purports = [v["purport"] for v in verses if v["purport"].strip() and v["purport"] != REVIEW]
    if real_purports:
        avg_purport = sum(len(p) for p in real_purports) / len(real_purports)

    for i, v in enumerate(verses):
        if v["purport"].strip() and v["purport"] != REVIEW:
            continue
        vnum = v["verse_number"]
        # Check previous verse's purport for being oversized and containing a
        # split marker like "श्लोक <this_verse_number>".
        if i > 0:
            prev = verses[i - 1]
            pp = prev["purport"]
            if len(pp) > avg_purport * 1.8:
                split_pat = re.compile(
                    r"\n\s*(?:श्लोक\s+" + str(vnum) + r"|" +
                    r"[ऀ-ॿ]+\s+उवाच)\s*\n"
                )
                m = split_pat.search(pp)
                if m:
                    prev["purport"] = pp[:m.start()].rstrip()
                    v["purport"] = pp[m.end():].strip()


def write_chapter(md: str, chapter: int) -> None:
    """Extract one chapter from already-decoded markdown and write its draft."""
    data = extract_chapter_from_md(md, chapter)

    verses = data["verses"]
    postprocess_verses(verses)
    empty_fields = 0
    for v in verses:
        for field in ("word_to_word", "translation", "purport"):
            val = v[field].strip()
            if not val or looks_like_sanskrit(val):
                v[field] = REVIEW
                empty_fields += 1

    CONTENT_DIR.mkdir(exist_ok=True)
    out = CONTENT_DIR / f"chapter-{chapter:02d}.draft.json"
    out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    residual = sum(
        f.count("[?]")
        for v in verses
        for f in (v["sanskrit_text"], v["word_to_word"], v["translation"], v["purport"])
    )
    nums = [v["verse_number"] for v in verses]
    span = f"{nums[0]}..{nums[-1]}" if nums else "none"
    print(
        f"ch{chapter:02d}: {len(verses):3d} verses ({span})  "
        f"name={data['name_sanskrit']!r}  [?]={residual}  blank_fields={empty_fields}"
    )


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    arg = args[0] if args else "1"

    # Optional decode cache: decoding the PDF is slow (minutes), so a cached copy
    # of the raw decoded markdown speeds up iteration. Pass --cache <path>.
    cache_path = None
    if "--cache" in sys.argv:
        cache_path = Path(sys.argv[sys.argv.index("--cache") + 1])

    if cache_path and cache_path.exists():
        print(f"Using cached decode: {cache_path}")
        md = cache_path.read_text(encoding="utf-8")
    else:
        print("Decoding PDF (Chanakya -> Unicode)…")
        md, _profile, _warnings = convert_pdf(str(PDF))
        if cache_path:
            cache_path.write_text(md, encoding="utf-8")
    md = correct(md)

    chapters = range(1, 19) if arg.lower() == "all" else [int(arg)]
    for chapter in chapters:
        write_chapter(md, chapter)

    print(
        "\nDRAFTS written to content/chapter-NN.draft.json. These are "
        "machine-extracted scripture: proofread, rename to chapter-NN.json, "
        "then `npm run content:validate` before import. (Import of a .draft "
        "file is also supported for an audit-in-browser launch.)"
    )


if __name__ == "__main__":
    main()
