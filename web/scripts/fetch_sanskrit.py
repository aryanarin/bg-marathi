#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Fetch clean Sanskrit verses from the vedicscriptures.github.io API and cache
them locally as content/sanskrit-cache.json.

This avoids hitting the API repeatedly during extraction iteration.

Usage:
    python scripts/fetch_sanskrit.py
"""

import json
import sys
import time
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import HTTPError

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

REPO = Path(__file__).resolve().parent.parent.parent
CONTENT_DIR = REPO / "content"
CACHE_FILE = CONTENT_DIR / "sanskrit-cache.json"

API_BASE = "https://vedicscriptures.github.io"

VERSE_COUNTS = {
    1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28,
    9: 34, 10: 42, 11: 55, 12: 20, 13: 35, 14: 27, 15: 20,
    16: 24, 17: 28, 18: 78,
}


def fetch_verse(ch: int, v: int) -> dict | None:
    url = f"{API_BASE}/slok/{ch}/{v}"
    req = Request(url, headers={"User-Agent": "gita-content-fetcher/1.0"})
    try:
        with urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        if e.code == 404:
            return None
        raise


def main() -> None:
    if CACHE_FILE.exists():
        existing = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
        print(f"Cache exists with {len(existing)} verses. Updating missing only.")
    else:
        existing = {}

    total = sum(VERSE_COUNTS.values())
    fetched = 0
    skipped = 0

    for ch in range(1, 19):
        count = VERSE_COUNTS[ch]
        for v in range(1, count + 1):
            key = f"{ch}.{v}"
            if key in existing:
                skipped += 1
                continue

            data = fetch_verse(ch, v)
            if data:
                existing[key] = {
                    "slok": data.get("slok", ""),
                    "transliteration": data.get("transliteration", ""),
                }
                fetched += 1
            else:
                print(f"  WARN: {ch}.{v} not found (404)")

            if fetched % 50 == 0 and fetched > 0:
                print(f"  fetched {fetched}, skipped {skipped}, total so far {len(existing)}/{total}")
                CONTENT_DIR.mkdir(exist_ok=True)
                CACHE_FILE.write_text(
                    json.dumps(existing, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )

            time.sleep(0.1)

        print(f"ch{ch:02d}: done ({len(existing)}/{total})")

    CONTENT_DIR.mkdir(exist_ok=True)
    CACHE_FILE.write_text(
        json.dumps(existing, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\nCached {len(existing)} verses to {CACHE_FILE}")


if __name__ == "__main__":
    main()
