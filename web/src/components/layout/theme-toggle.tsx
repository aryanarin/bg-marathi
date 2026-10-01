"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

/**
 * Theme toggle.
 *
 * Flips the `.dark` class on <html> and persists the choice to localStorage.
 * ThemeScript sets the initial class before paint, so this only reflects and
 * changes the current state.
 *
 * The current theme is read with useSyncExternalStore rather than mirrored into
 * state in an effect: that avoids a cascading-render on mount and keeps the
 * button in sync if the class changes elsewhere. The server snapshot is "light"
 * so SSR and the first client render agree; the real value resolves on mount.
 */

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle() {
  // useSyncExternalStore returns the server snapshot (false) during SSR and the
  // first hydration render, then the live DOM value — no setState-in-effect.
  const isDark = useSyncExternalStore(subscribe, getSnapshot, () => false);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private mode or storage disabled; the choice simply won't persist.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "उजळ रंगसंगतीकडे जा" : "गडद रंगसंगतीकडे जा"}
      className="inline-flex size-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {isDark ? (
        <Sun className="size-5" aria-hidden="true" />
      ) : (
        <Moon className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}
