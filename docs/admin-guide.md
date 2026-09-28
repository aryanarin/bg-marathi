# Administrator guide

For the person managing content, classes and quizzes.

> **Status.** The admin interface is built in Phases 6–8. This document describes
> how it will work and is written now so the design can be reviewed before it is
> coded. Sections marked **[not yet built]** describe planned behaviour.
>
> What *is* settled and will not change: there is exactly one administrator, the
> role can only be granted with SQL, and no page in the application can promote
> anyone.

## Becoming the administrator

There is no "make me an admin" button anywhere, deliberately. New accounts are
always created as ordinary users — the database trigger hard-codes it — and the
role can only be changed by someone who is already an administrator, or by hand
in SQL.

To set up the first administrator, see `docs/setup.md` step 7. It is a one-time
`update public.profiles set role = 'admin' where email = '...'` in the Supabase
SQL Editor.

If you ever lose admin access, the recovery is the same SQL statement. Keep
access to the Supabase dashboard.

## Signing in

Use the normal `/login` page with the administrator's email. Once signed in,
`/admin` becomes reachable. Ordinary users who try `/admin` are sent to their
dashboard.

Your admin account is also a normal learner account: you can read verses and
track your own progress with it.

---

## Dashboard — `/admin` [not yet built]

An overview of:

- Total registered users
- Active users (those with a reading session in the last 30 days)
- Total verses read across all users
- Total verses memorized across all users
- The next upcoming published class
- Count of published quizzes

---

## Users — `/admin/users` [not yet built]

A list of registered learners with name, email, join date, and a progress
summary.

`/admin/users/[userId]` shows one learner's detail: verses read, verses
memorized, total learning time, chapter-wise progress and quiz history.

You can **view** progress. You cannot edit it — a learner's record of their own
study is theirs, and an admin edit button would only create a way to corrupt it
by accident.

---

## Chapters — `/admin/chapters` [not yet built]

Create and edit chapters: Sanskrit name, Marathi name, description, and
**total verses**.

`total_verses` is the number the chapter *should* contain, and it drives progress
display ("12 of 47 read"). It is editable rather than counted automatically for a
reason: editions of the Gita disagree on some chapter lengths, and you may have
imported only part of a chapter so far. Set it to the true count for your
edition.

Bulk content is loaded via the import script instead of typed here. See
`docs/content-import.md`.

---

## Verses — `/admin/verses` [not yet built]

Filter by chapter, then edit a verse at `/admin/verses/[verseId]`:

| Field | Source |
| ----- | ------ |
| Sanskrit text | Source edition (imported) |
| Word-to-word | Source edition (imported) |
| Translation | Source edition (imported) |
| Purport | Source edition (imported) |
| **Easy explanation** | **You write this** |
| **Example** | **You write this** |
| Audio URL | Uploaded audio file's public URL |

The last three are the fields the application expects you to fill in. The easy
explanation and example are never generated automatically — that is a deliberate
constraint, not a missing feature. Generated commentary on scripture would be
worse than none.

Formatting: text is stored and displayed as plain text with line breaks
preserved. Bullet points work as plain lines starting with `•` or `-`. HTML is
not rendered, which is what keeps the pages safe from injected markup.

### Audio

Paste the public URL of the audio file for that verse. See
`docs/content-import.md` for hosting. If the field is empty, the verse page
simply shows no player and everything else works.

---

## Classes — `/admin/classes` [not yet built]

Create a class with:

| Field | Notes |
| ----- | ----- |
| Title | e.g. "अध्याय २ — श्लोक ११ ते १५" |
| Description | Optional |
| Date | Calendar picker |
| Time | Local wall-clock time |
| Platform | Google Meet, Zoom, or Other |
| Meeting URL | Paste the full link |
| Published | Off by default |

**The meeting URL must start with `https://`.** The form rejects anything else.
This is not fussiness: learners click this link, so an unvalidated value there
would be a way to inject a malicious URL into every learner's screen. Links with
embedded credentials (`https://user:pass@...`) are also rejected.

There is no Google Meet or Zoom integration and none is needed. You create the
meeting in Meet or Zoom as usual and paste the link here.

**Publishing:** a class is invisible to learners until you switch Published on.
This is enforced by the database, not just hidden in the interface, so a draft
cannot leak. Unpublishing hides it again immediately.

Learners see the next upcoming published class on their dashboard with a
**Join Class** button that opens your link in a new tab.

---

## Quizzes — `/admin/quizzes` [not yet built]

The intended rhythm, from the requirements: after each class, a quiz of roughly
25 multiple-choice questions on the 4–5 verses covered.

Create a quiz with a title, optional description, and an optional chapter plus
verse range (e.g. chapter 2, verses 11–15) to record what it covers.

Then add questions at `/admin/quizzes/[quizId]`:

- Question text
- Four options (A, B, C, D) — all four required
- The correct option
- An optional explanation, shown to learners **after** they submit

**Publishing** works as it does for classes: off by default, invisible to
learners until you turn it on, enforced in the database.

### Two things the system guarantees

**Correct answers never reach the browser before submission.** The answer key
column is not readable by learner accounts at the database level — not merely
filtered out in the interface. Scoring happens on the server.

**A submitted attempt cannot be changed.** Once a learner submits, the score is
final; the database refuses further writes to that attempt. Learners may retake
a quiz, which creates a new attempt, and you see each one.

You can view all attempts and scores per quiz.

---

## Things you cannot do, and why

| Not possible | Reason |
| ------------ | ------ |
| Promote a user to admin from the interface | Role changes require SQL. Removes the highest-value attack target from the app entirely. |
| Edit a learner's progress | Their study record is theirs. An edit path is mostly a way to break it by accident. |
| Change a submitted quiz score | Scores are immutable once submitted, for the learner's trust. |
| See or reset a user's password | Passwords are hashed by Supabase and never visible to anyone. Direct them to "Forgot password". |
| Delete a user from the interface | Rare and irreversible. Do it in the Supabase dashboard, deliberately. |

## If something goes wrong

**A learner cannot sign in.** Have them use "Forgot password". If no email
arrives, check Supabase → **Authentication** → **Logs**; it is almost always
SMTP. See `docs/email-setup.md`.

**A learner reports missing progress.** Check `/admin/users/[userId]`. If their
reading time looks low, note that a single sitting is capped at 30 minutes and
the timer pauses when the tab is hidden — both are intentional, to stop a tab
left open overnight from counting as study.

**Audio does not play.** Open the verse's `audio_url` directly in a browser. If
it does not play there, the problem is the hosting, not the site. This is the
most common symptom of Google Drive links, which do not work as direct audio
sources.

**A published class or quiz is not visible.** Confirm Published is actually on
and saved. For classes, also confirm the date is not in the past — only upcoming
classes appear on the learner dashboard.
