import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { ClassSession } from "@/lib/types";

/**
 * Classes data access.
 *
 * Uses the anon-key server client, so RLS decides visibility: learners only
 * ever see published classes (the "read published or admin" policy). We never
 * use the service-role client here — that would bypass RLS and leak drafts.
 */

/**
 * Upcoming published classes, soonest first.
 *
 * "Upcoming" is computed from today's date. Past classes drop off automatically
 * so the learner view stays current without any cleanup job.
 */
export const getUpcomingClasses = cache(async (): Promise<ClassSession[]> => {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data } = await supabase
    .from("classes")
    .select("*")
    .gte("class_date", today)
    .order("class_date", { ascending: true })
    .order("class_time", { ascending: true });

  // RLS already restricts to published rows for a learner; the filter is not
  // repeated here so an admin previewing sees the same list shape.
  return (data as ClassSession[] | null) ?? [];
});

/** The single next upcoming class, for the dashboard. Null if none. */
export const getNextClass = cache(async (): Promise<ClassSession | null> => {
  const classes = await getUpcomingClasses();
  return classes[0] ?? null;
});
