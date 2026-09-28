"use client";

import { AlertCircle } from "lucide-react";
import { useState } from "react";

/**
 * Verse audio player.
 *
 * A thin wrapper over the native <audio> element, which already gives correct,
 * accessible controls and range-request seeking (the reason audio was mirrored
 * to Supabase Storage). If there is no URL or the file fails to load, a quiet
 * unavailable state is shown and the rest of the page works normally.
 */
export function AudioPlayer({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!src) {
    return (
      <p className="flex items-center gap-2 rounded border border-rule bg-sand/50 px-3 py-2 text-sm text-ink-subtle">
        <AlertCircle className="size-4" aria-hidden="true" />
        या श्लोकाचे उच्चारण अद्याप उपलब्ध नाही.
      </p>
    );
  }

  if (failed) {
    return (
      <p className="flex items-center gap-2 rounded border border-rule bg-sand/50 px-3 py-2 text-sm text-ink-subtle">
        <AlertCircle className="size-4" aria-hidden="true" />
        उच्चारण सध्या ऐकता येत नाही.
      </p>
    );
  }

  return (
    <audio
      controls
      preload="none"
      src={src}
      onError={() => setFailed(true)}
      className="h-11 w-full"
    >
      आपला ब्राउझर ऑडिओ प्ले करू शकत नाही.
    </audio>
  );
}
