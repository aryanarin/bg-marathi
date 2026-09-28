# Email setup

Authentication emails (confirmation, password reset) are sent by **Supabase
Auth**, not by the application. The app never holds SMTP credentials and never
sends mail itself.

That is a deliberate boundary: it means there is no mail-sending code to get
wrong, no credentials in the deployment, and no custom mail server to maintain.

## Why you must configure SMTP

Supabase's built-in email service is for development only. It is rate-limited
(a few emails per hour), sends from a Supabase-owned address, and Supabase
explicitly does not guarantee delivery. Without custom SMTP, learners will
register and never receive a confirmation email.

## Choosing a provider

| Provider | Free tier | Notes |
| -------- | --------- | ----- |
| **Brevo** (ex-Sendinblue) | 300/day | No custom domain required to start. Recommended. |
| **Resend** | 3,000/month | Clean setup; requires a verified domain for production. |
| **Gmail / Google Workspace** | ~500/day | Works, but see the warning below. |
| **Amazon SES** | 3,000/month | Cheapest at volume, but the brief rules out AWS. |

For a study group of tens to low hundreds of users, any of these is ample.
**Brevo** is the least friction if you do not own a domain yet.

### On using Gmail

It works with an **App Password** (never your real password), but:

- It requires 2-Step Verification enabled on the account.
- Mail arrives from your personal address, and replies go to your inbox.
- Google may throttle or flag bulk authentication mail.
- App Passwords are unavailable on some Workspace configurations.

Acceptable for early testing. Move to a transactional provider before real
users.

---

## Option A: Brevo — [YOU]

### 1. Create the account

**Where:** https://www.brevo.com

Sign up for the free plan. You may be asked to confirm your own email and answer
a short questionnaire about sending volume.

### 2. Get SMTP credentials

**Where:** Brevo dashboard → click your account name (top right) → **SMTP & API**
→ **SMTP** tab

You will see:

| Field | Example value |
| ----- | ------------- |
| SMTP Server | `smtp-relay.brevo.com` |
| Port | `587` |
| Login | `8a1b2c001@smtp-brevo.com` |
| SMTP key | click **Generate a new SMTP key** |

Copy the SMTP key immediately — it is shown once. This is a **secret**.

> The login is *not* your Brevo account email. It is the generated
> `...@smtp-brevo.com` value. Using the account email here is the single most
> common cause of authentication failures.

### 3. Add a verified sender

**Where:** Brevo → **Settings** → **Senders, Domains & Dedicated IPs** →
**Senders** → **Add a sender**

Enter the name and address emails should come from, e.g.
`Bhagavad Gita Study` / `no-reply@yourdomain.com`. Brevo emails that address a
confirmation link; click it.

If you do not own a domain yet, use an address you control (a Gmail address is
fine) and verify that. Deliverability is better with your own domain, but this
unblocks you today.

### 4. Enter the credentials in Supabase

**Where:** Supabase Dashboard → **Project Settings** → **Authentication** →
scroll to **SMTP Settings** → toggle **Enable Custom SMTP**

| Supabase field | Value |
| -------------- | ----- |
| Sender email | the address verified in step 3 |
| Sender name | `Bhagavad Gita Study` (or your choice) |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | the `...@smtp-brevo.com` login |
| Password | the SMTP key from step 2 |
| Minimum interval between emails | `60` (seconds) |

Click **Save**.

Use port **587** (STARTTLS). Port 465 also works with some providers, but 587 is
the modern default and is less likely to be blocked.

**Expected result:** the settings save without an error banner.

---

## Option B: Gmail App Password — [YOU]

### 1. Enable 2-Step Verification

**Where:** https://myaccount.google.com/security → **2-Step Verification**

App Passwords do not exist until this is on.

### 2. Create an App Password

**Where:** https://myaccount.google.com/apppasswords

1. App name: `Bhagavad Gita Supabase`
2. Click **Create**
3. Copy the 16-character password shown (e.g. `abcd efgh ijkl mnop`)

Remove the spaces when pasting it. This is a **secret** and is shown once. It
grants mail-sending access to your Google account — revoke it from the same page
if it is ever exposed.

### 3. Enter it in Supabase

Same location as Option A step 4:

| Supabase field | Value |
| -------------- | ----- |
| Sender email | your full Gmail address |
| Sender name | `Bhagavad Gita Study` |
| Host | `smtp.gmail.com` |
| Port | `587` |
| Username | your full Gmail address |
| Password | the 16-character App Password, no spaces |
| Minimum interval | `60` |

---

## Configure redirect URLs — [YOU]

Auth emails contain links back to the site. Supabase will only redirect to URLs
on an allowlist, so an attacker cannot craft a confirmation link that redirects
to their own site.

**Where:** Supabase Dashboard → **Authentication** → **URL Configuration**

**Site URL:**
```
http://localhost:3000
```
Change to `https://your-domain.com` at deployment.

**Redirect URLs** — add each of these:
```
http://localhost:3000/**
https://your-domain.com/**
https://your-project.vercel.app/**
```

Include the Vercel preview domain if you want auth to work in preview
deployments.

**Expected result:** the list saves and shows all entries.

---

## Email templates — [YOU, optional]

**Where:** Supabase Dashboard → **Authentication** → **Email Templates**

Defaults are in English and functional. Since the audience is Marathi-speaking,
here are replacements. Paste into the **Message body (HTML)** field for each
template.

`{{ .ConfirmationURL }}` is substituted by Supabase — leave it exactly as
written.

### Confirm signup

Subject:
```
आपले खाते सक्रिय करा — श्रीमद्भगवद्गीता
```

Body:
```html
<div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #2d1f15;">
  <p style="font-size: 22px; color: #9c7c18; margin: 0 0 16px;">ॐ</p>

  <h2 style="font-size: 20px; margin: 0 0 16px;">हरे कृष्ण,</h2>

  <p style="line-height: 1.9; margin: 0 0 20px;">
    श्रीमद्भगवद्गीता अभ्यास मंचावर नोंदणी केल्याबद्दल धन्यवाद.
    कृपया खालील दुव्यावर क्लिक करून आपले खाते सक्रिय करा.
  </p>

  <p style="margin: 0 0 24px;">
    <a href="{{ .ConfirmationURL }}"
       style="display: inline-block; background: #c2410c; color: #fdfbf7;
              padding: 12px 24px; border-radius: 4px; text-decoration: none;">
      खाते सक्रिय करा
    </a>
  </p>

  <p style="line-height: 1.8; font-size: 14px; color: #5c4a3a; margin: 0;">
    आपण नोंदणी केली नसेल, तर हा संदेश दुर्लक्षित करा.
  </p>
</div>
```

### Reset password

Subject:
```
पासवर्ड पुन्हा सेट करा — श्रीमद्भगवद्गीता
```

Body:
```html
<div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #2d1f15;">
  <p style="font-size: 22px; color: #9c7c18; margin: 0 0 16px;">ॐ</p>

  <h2 style="font-size: 20px; margin: 0 0 16px;">हरे कृष्ण,</h2>

  <p style="line-height: 1.9; margin: 0 0 20px;">
    आपला पासवर्ड पुन्हा सेट करण्यासाठी खालील दुव्यावर क्लिक करा.
    हा दुवा मर्यादित काळासाठी वैध आहे.
  </p>

  <p style="margin: 0 0 24px;">
    <a href="{{ .ConfirmationURL }}"
       style="display: inline-block; background: #c2410c; color: #fdfbf7;
              padding: 12px 24px; border-radius: 4px; text-decoration: none;">
      नवीन पासवर्ड सेट करा
    </a>
  </p>

  <p style="line-height: 1.8; font-size: 14px; color: #5c4a3a; margin: 0;">
    आपण ही विनंती केली नसेल, तर हा संदेश दुर्लक्षित करा. आपला पासवर्ड बदलला जाणार नाही.
  </p>
</div>
```

Keep the inline styles. Email clients strip `<style>` blocks, so inline is the
only reliable option. Gmail also does not load custom fonts, hence the Georgia
fallback.

---

## Verifying it works — [YOU]

1. Start the app: `npm run dev`
2. Register with a **real** address you can check (not `test@test.com`)
3. The email should arrive within a minute

**If it does not arrive:**

- Check spam. First sends from a new sender often land there.
- Supabase Dashboard → **Authentication** → **Logs**. Look for the send attempt
  and its error message. This is the single most useful diagnostic.
- Brevo dashboard → **Transactional** → **Logs** shows per-message delivery
  status.

**Common causes:**

| Symptom | Cause |
| ------- | ----- |
| `535 Authentication failed` | Using the account email as Username instead of the `...@smtp-brevo.com` login, or a stale SMTP key |
| `550 Sender not verified` | Sender email not verified with the provider (Option A step 3) |
| Email arrives, link says "invalid" | Site URL / Redirect URLs not configured, or the link was already used |
| Nothing in Supabase logs at all | Custom SMTP toggle not enabled, or settings not saved |

**Send me:** the error text from Supabase Auth logs if it fails. Do not send the
SMTP key.

---

## Not in scope

- **Marketing email.** No newsletters or campaigns in the MVP.
- **Class reminder emails.** The requirement is that learners *see* upcoming
  classes in the app. Scheduled reminder mail would need a cron job and a
  sending service; it is a reasonable later addition, not MVP.
- **A custom mail server.** Explicitly ruled out by the brief, and correctly so.
