"use client";

import { useEffect, useRef } from "react";

import { recordReadingTime } from "@/lib/data/progress-actions";
import { MAX_SESSION_SECONDS } from "@/lib/validation/schemas";

/**
 * Reading timer.
 *
 * Counts active seconds on a verse page and reports them when the reader leaves
 * or the tab is hidden. Renders nothing.
 *
 * Safeguards against counting a tab left open:
 *   - The timer pauses when the tab is hidden (visibilitychange) and resumes on
 *     return, so background time is never counted.
 *   - It also pauses after IDLE_LIMIT with no interaction, catching a foreground
 *     tab the reader has walked away from.
 *   - Accumulated time is capped at MAX_SESSION_SECONDS.
 *   - The final flush uses sendBeacon-style fire-and-forget via a Server Action;
 *     the server clamps again, and the DB column constraint is the last backstop.
 *
 * Only mounted for signed-in users (the page decides), so an anonymous reader
 * never triggers a write that RLS would reject anyway.
 */

const IDLE_LIMIT_MS = 60_000; // pause after a minute with no interaction

export function ReadingTimer({ verseId }: { verseId: string }) {
  // All refs start with static values; the effect sets the real timestamps on
  // mount. Calling Date.now() in a ref initializer would run during render,
  // which is impure.
  const accumulatedMs = useRef(0);
  const lastTickAt = useRef<number | null>(null);
  const lastInteractionAt = useRef<number>(0);
  const flushed = useRef(false);

  useEffect(() => {
    accumulatedMs.current = 0;
    lastTickAt.current = Date.now();
    lastInteractionAt.current = Date.now();
    flushed.current = false;

    function accrue() {
      const now = Date.now();
      if (lastTickAt.current !== null) {
        const delta = now - lastTickAt.current;
        // Only count if the reader interacted recently (not idle).
        if (now - lastInteractionAt.current < IDLE_LIMIT_MS) {
          accumulatedMs.current = Math.min(
            accumulatedMs.current + delta,
            MAX_SESSION_SECONDS * 1000,
          );
        }
      }
      lastTickAt.current = now;
    }

    function markInteraction() {
      lastInteractionAt.current = Date.now();
      if (lastTickAt.current === null) lastTickAt.current = Date.now();
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        accrue();
        lastTickAt.current = null; // stop counting
        void flush();
      } else {
        lastTickAt.current = Date.now();
        lastInteractionAt.current = Date.now();
      }
    }

    async function flush() {
      accrue();
      const seconds = Math.floor(accumulatedMs.current / 1000);
      if (seconds <= 0) return;
      // Reset so a later flush in the same mount does not double-count.
      accumulatedMs.current = 0;
      try {
        await recordReadingTime(verseId, seconds);
      } catch {
        // Best-effort; losing a few seconds of tracked time is acceptable.
      }
    }

    const ticker = setInterval(accrue, 5_000);
    const interactions: Array<keyof DocumentEventMap> = [
      "pointerdown",
      "keydown",
      "scroll",
      "pointermove",
    ];
    for (const evt of interactions) {
      document.addEventListener(evt, markInteraction, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(ticker);
      for (const evt of interactions) {
        document.removeEventListener(evt, markInteraction);
      }
      document.removeEventListener("visibilitychange", onVisibility);
      if (!flushed.current) {
        flushed.current = true;
        void flush();
      }
    };
  }, [verseId]);

  return null;
}
