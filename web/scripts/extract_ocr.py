#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Extract a chapter from the OCR'd Marathi Bhagavad-gita As It Is PDF.

Unlike the Chanakya decode, the OCR text is clean, copy-pasteable Unicode
Marathi, so the word-to-word / translation / purport come out readable. We
still take the Sanskrit shloka and the canonical verse grouping from vedabase
(done later by enrich-ocr.ts), because OCR of the Sanskrit line is less reliable
than vedabase's authoritative Devanagari.

This script only parses the OCR text into structured verses and writes
content/chapter-NN.ocr.json. The vedabase overlay + final JSON is a second step.

Usage:
  python scripts/extract_ocr.py all --cache <ocr_pages.txt>
  python scripts/extract_ocr.py 1  --cache <ocr_pages.txt>
"""

import json
import re
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

OCR_PDF = Path(r"C:\Users\ysary\Pictures\BG OCR\pdf\bhagavad-gita-marathi-OCR.pdf")
REPO = Path(__file__).resolve().parent.parent.parent
CONTENT_DIR = REPO / "content"

CHAPTER_ORDINALS = [
    ["पहिला"], ["दुसरा"], ["तिसरा"], ["चौथा", "चवथा"], ["पाचवा"], ["सहावा"],
    ["सातवा"], ["आठवा"], ["नववा"], ["दहावा"], ["अकरावा"], ["बारावा"],
    ["तेरावा"], ["चौदावा"], ["पंधरावा"], ["सोळावा"], ["सतरावा"], ["अठरावा"],
]

# Verse-end marker "॥ N॥". OCR sometimes inserts stray dandas/spaces between the
# opening ॥ and the number (e.g. "॥। ७॥"), so tolerate leading । and whitespace.
DANDA_NUM = re.compile(r"॥[।\s]*([०-९]+)\s*[।\s]*॥")
DEV = {d: i for i, d in enumerate("०१२३४५६७८९")}


def dev_to_int(s: str) -> int:
    return int("".join(str(DEV[c]) for c in s))


def load_ocr(cache: Path | None) -> str:
    if cache and cache.exists():
        return cache.read_text(encoding="utf-8")
    import pymupdf
    d = pymupdf.open(str(OCR_PDF))
    md = "".join((d[i].get_text() or "") for i in range(d.page_count))
    if cache:
        cache.write_text(md, encoding="utf-8")
    return md


# Page furniture lines to drop (running header, chapter label, श्लोक N, page #).
FURNITURE = [
    re.compile(r"भगवद्\u200cगीता[^\n]{0,25}जशी आहे तशी"),
    re.compile(r"भगवद्गीता[^\n]{0,25}जशी आहे तशी"),
    re.compile(r"अध्याय\s*[०-९\d]+"),
    re.compile(r"श्लोक\s*[०-९\d]+"),
]


def strip_furniture(text: str, chapter_name: str | None) -> str:
    # Page-break markers injected by the OCR cache (@@@PAGE N@@@), with or
    # without a page number. These sit mid-text wherever a verse spans pages.
    text = re.sub(r"@@@\s*PAGE[^@]*@@@", " ", text)
    for pat in FURNITURE:
        text = pat.sub(" ", text)
    if chapter_name:
        text = re.sub(rf"(^|\n)\s*{re.escape(chapter_name)}\s*(\n|$)", "\n", text)
    # Bare page numbers on their own line.
    text = re.sub(r"\n\s*\d{1,3}\s*\n", "\n", text)
    # Join hyphen-broken line ends and collapse whitespace.
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chapter_bounds(md: str, chapter: int) -> tuple[int, int]:
    def find(ch: int) -> int:
        for w in CHAPTER_ORDINALS[ch - 1]:
            hits = [m.start() for m in re.finditer(r"अध्याय\s*" + w, md) if m.start() > 20000]
            if hits:
                return hits[0]
        return -1
    start = find(chapter)
    if start < 0:
        sys.exit(f"chapter {chapter} start not found")
    end = find(chapter + 1) if chapter < 18 else len(md)
    if end < 0:
        end = len(md)
    return start, end


def split_commentary(block: str, chapter_name: str) -> tuple[str, str, str]:
    """Split a verse's post-shloka text into (word_to_word, translation, purport)."""
    w2w = translation = purport = ""
    tp = re.search(r"तात्पर्य\s*[:：]", block)
    if tp:
        purport = strip_furniture(block[tp.end():], chapter_name)
        pre = block[:tp.start()]
    else:
        pre = block
    pre = strip_furniture(pre, chapter_name)

    # Structure of `pre`:  term--meaning; term--meaning; ... ; LASTterm--meaning. TRANSLATION
    # The gloss units are ';'-separated; the FINAL unit ends in '.' (no ';');
    # the translation is a sentence with no ';'. So the gloss list ends at the
    # LAST ';'. The piece after it is "<final-gloss-meaning>. <translation>".
    #
    # We split at the last ';', then within the tail, the final gloss ends at
    # the first sentence terminator AFTER its gloss dash (--, —, <-). The rest is
    # the translation. This is robust even when the translation prose itself
    # contains '--' (e.g. "आत्म--साक्षात्कार"), because we only look at the tail
    # that follows the last ';', and only up to the final gloss's own period.
    GLOSS_DASH = re.compile(r"--|—|<-")
    semi = pre.rfind(";")
    if semi != -1:
        head = pre[: semi + 1]            # all gloss units except the last
        tail = pre[semi + 1 :]            # "<final gloss>. <translation>"
        dash = GLOSS_DASH.search(tail)
        if dash:
            term = re.search(r"[.?।]", tail[dash.end():])
            if term:
                cut = dash.end() + term.end()
                final_gloss = tail[:cut]
                translation = tail[cut:].strip()
                w2w = (head + final_gloss).strip()
            else:
                # Final gloss has no terminator; treat whole tail as gloss.
                w2w = pre.strip()
        else:
            # Tail has no gloss dash -> it is purely translation.
            w2w = head.strip()
            translation = tail.strip()
    elif GLOSS_DASH.search(pre):
        # No ';' but has a gloss dash: single gloss then translation.
        dash = GLOSS_DASH.search(pre)
        term = re.search(r"[.?।]", pre[dash.end():])
        if term:
            cut = dash.end() + term.end()
            w2w = pre[:cut].strip()
            translation = pre[cut:].strip()
        else:
            w2w = pre.strip()
    else:
        # No gloss markers at all: whole block is translation.
        translation = pre.strip()
    return w2w, translation, purport


def extract_chapter(md: str, chapter: int) -> dict:
    start, end = chapter_bounds(md, chapter)
    body = md[start:end]

    # Chapter name: first "... योग" in the heading region.
    name_m = re.search(r"([ऀ-ॿ][ऀ-ॿ \u200d]*?योग)", body[:400])
    name = re.sub(r"\s+", "", name_m.group(1)) if name_m else f"अध्याय {chapter}"

    markers = list(DANDA_NUM.finditer(body))
    verses = []
    prev = 0
    for i, mk in enumerate(markers):
        num = dev_to_int(mk.group(1))
        nxt = markers[i + 1].start() if i + 1 < len(markers) else len(body)
        raw_after = body[mk.end():nxt]

        # raw_after = verse N's commentary (word-gloss, translation, तात्पर्य
        # purport) FOLLOWED BY verse N+1's "<speaker> उवाच" + shloka. The purport
        # is always the last part of verse N's commentary, so the next verse's
        # header is the FIRST "उवाच" that appears AFTER the last तात्पर्य. If the
        # verse has no उवाच header (most verses don't), the next verse's shloka
        # is simply the Devanagari that trails after the purport; we leave that
        # to split_commentary (the shloka is replaced from vedabase anyway).
        cut = None
        last_tp = None
        for mm in re.finditer(r"तात्पर्य\s*[:：]", raw_after):
            last_tp = mm.end()
        search_from = last_tp if last_tp is not None else 0
        um = re.search(r"[ऀ-ॿ]+\s*उवाच", raw_after[search_from:])
        if um:
            cut = search_from + um.start()
        commentary = raw_after[:cut] if cut is not None else raw_after

        w2w, translation, purport = split_commentary(commentary, name)
        verses.append({
            "verse_number": num,
            "word_to_word": w2w,
            "translation": translation,
            "purport": purport,
        })
        prev = nxt

    return {"chapter_number": chapter, "name_sanskrit": name, "verses": verses}


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    arg = args[0] if args else "1"
    cache = None
    if "--cache" in sys.argv:
        cache = Path(sys.argv[sys.argv.index("--cache") + 1])

    print("Loading OCR text…")
    md = load_ocr(cache)

    CONTENT_DIR.mkdir(exist_ok=True)
    chapters = range(1, 19) if arg.lower() == "all" else [int(arg)]
    for ch in chapters:
        data = extract_chapter(md, ch)
        out = CONTENT_DIR / f"chapter-{ch:02d}.ocr.json"
        out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        nums = [v["verse_number"] for v in data["verses"]]
        empties = sum(1 for v in data["verses"] if not v["purport"].strip())
        print(f"ch{ch:02d}: {len(data['verses'])} verses ({nums[0] if nums else '-'}..{nums[-1] if nums else '-'})  name={data['name_sanskrit']!r}  empty_purport={empties}")


if __name__ == "__main__":
    main()
