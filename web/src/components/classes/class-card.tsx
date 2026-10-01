import { CalendarDays, Clock, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isSafeExternalUrl } from "@/lib/validation/schemas";
import type { ClassSession, MeetingPlatform } from "@/lib/types";

const platformLabel: Record<MeetingPlatform, string> = {
  google_meet: "Google Meet",
  zoom: "Zoom",
  other: "ऑनलाइन",
};

/** Format an ISO date (YYYY-MM-DD) in Marathi long form. */
function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat("mr-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

/** Format a 24h time string (HH:MM[:SS]) to a Marathi-locale time. */
function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const date = new Date();
  date.setHours(Number(h), Number(m), 0, 0);
  return new Intl.DateTimeFormat("mr-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function ClassCard({ session }: { session: ClassSession }) {
  // The URL is validated when the admin saves it, but re-check at render time:
  // this value becomes an anchor the learner clicks, so never trust it blindly.
  const joinable = isSafeExternalUrl(session.meeting_url);

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="font-devanagari text-lg font-semibold text-ink">
          {session.title}
        </h3>

        {session.description && (
          <p className="mt-1 text-sm text-ink-muted prose-marathi">
            {session.description}
          </p>
        )}

        <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-4 text-accent" aria-hidden="true" />
            <dt className="sr-only">तारीख</dt>
            <dd className="font-devanagari">{formatDate(session.class_date)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-4 text-accent" aria-hidden="true" />
            <dt className="sr-only">वेळ</dt>
            <dd>{formatTime(session.class_time)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Video className="size-4 text-accent" aria-hidden="true" />
            <dt className="sr-only">माध्यम</dt>
            <dd>{platformLabel[session.meeting_platform]}</dd>
          </div>
        </dl>

        <div className="mt-5">
          {joinable ? (
            <Button asChild>
              {/* Open in a new tab; rel prevents the opened page from accessing
                  window.opener. */}
              <a href={session.meeting_url} target="_blank" rel="noopener noreferrer">
                वर्गात सामील व्हा
              </a>
            </Button>
          ) : (
            <p className="text-sm text-ink-subtle">
              सामील होण्याचा दुवा लवकरच उपलब्ध होईल.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
