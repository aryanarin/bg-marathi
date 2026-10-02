# Quick Start Guides

Site: https://gita.bhakti.eu.org

---

## For the Administrator

You manage all content, classes and quizzes from the browser. There is one admin account.

### Sign in
1. Go to https://gita.bhakti.eu.org/login
2. Sign in with the admin email and password.
3. Open https://gita.bhakti.eu.org/admin — the dashboard loads only for you.

Your admin account is also a normal learner account, so you can read and track progress with it too.

### Edit a verse (your main task)
1. Admin → **श्लोक (Verses)**.
2. Filter by chapter, then click a verse.
3. Review and correct the fields:
   - Sanskrit, Word-to-word, Translation, Purport (imported — fix as needed).
   - **Easy explanation** and **Example** — you write these.
   - **Audio URL** — the public link to that verse's audio.
4. Click **Save**. Changes show to learners immediately.

Draft Marathi text contains review markers like `[?]` and `[पुनरावलोकन आवश्यक]`. Replace them as you correct each verse.

Formatting: plain text, line breaks preserved. Lines starting with `•` or `-` act as bullets. HTML is not rendered.

### Chapters
Admin → **अध्याय (Chapters)**. Edit Sanskrit/Marathi name, description, and **total verses** (the count your edition should have — drives "12 of 47 read").

### Classes
Admin → **Classes** → New. Fill title, date, time, platform, and the **meeting URL** (must start with `https://`). Create the meeting in Meet/Zoom yourself and paste the link. A class is hidden until you turn **Published** on. Learners see the next upcoming published class with a **Join Class** button.

### Quizzes
Admin → **Quizzes** → New. Add a title and optional chapter/verse range. Add questions: text, four options (A–D), the correct option, and an optional explanation shown after submission. Hidden until **Published** is on. Correct answers never reach the browser before submission; submitted attempts are final.

### You cannot (by design)
- Promote a user to admin from the UI (role changes need SQL in Supabase).
- Edit a learner's progress or a submitted quiz score.
- See or reset passwords — direct users to "Forgot password".

### If something breaks
- **No login/confirmation email:** Supabase → Authentication → Logs (usually SMTP).
- **Audio won't play:** open the verse's audio URL directly; if it fails there, the hosting is the problem (Google Drive links do not work as direct audio).
- **Published class/quiz not visible:** confirm Published is saved; for classes, the date must be in the future.

---

## For the Learner

Site: https://gita.bhakti.eu.org

### Get started
1. Open the site and click **Register**.
2. Sign up with your email and a password.
3. Click the confirmation link in your email — it signs you in.
4. Forgot your password? Use **Forgot password** on the login page.

### Read verses
- **अध्याय (Chapters)** → pick a chapter → pick a verse.
- Each verse shows Sanskrit, word-to-word meaning, Marathi translation, purport, an easy explanation with an example, and audio.
- Press **play** to hear the recitation.

### Track your progress
- Mark a verse **Read** or **Memorized** as you study.
- Your reading time is tracked automatically while a verse is open.
- See totals and chapter-wise progress on your **Dashboard** and **Progress** pages.
- Note: a single sitting is capped at 30 minutes and the timer pauses when the tab is hidden, so an idle tab won't count as study.

### Classes
- Your dashboard shows the next upcoming online class.
- Click **Join Class** at class time to open the meeting link.

### Quizzes
- Open **Quizzes** and start one.
- Answer the multiple-choice questions and submit.
- You see your score and explanations after submitting.
- You can retake a quiz — each attempt is saved separately.

### Appearance
Use the light/dark toggle in the top bar. You can install the site to your phone's home screen ("Add to Home Screen") and use it like an app.
