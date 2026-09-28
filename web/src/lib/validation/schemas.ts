import { z } from "zod";

/**
 * Validation schemas.
 *
 * Shared between client forms (via react-hook-form + zodResolver) and Server
 * Actions. The server always re-validates: client-side validation is a UX
 * affordance, never a trust boundary.
 */

/* --- Auth ----------------------------------------------------------------- */

export const emailSchema = z
  .string()
  .min(1, "ईमेल आवश्यक आहे")
  .email("वैध ईमेल पत्ता प्रविष्ट करा");

/**
 * Password policy: length over composition rules.
 *
 * A 8+ character minimum with no forced symbol classes produces stronger real
 * passwords than short-but-complex requirements, and is far kinder to users
 * typing on a phone keyboard. Supabase enforces its own minimum too.
 */
export const passwordSchema = z
  .string()
  .min(8, "पासवर्ड किमान ८ अक्षरांचा असावा")
  .max(72, "पासवर्ड ७२ अक्षरांपेक्षा जास्त असू शकत नाही");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "पासवर्ड आवश्यक आहे"),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "पूर्ण नाव आवश्यक आहे")
      .max(100, "नाव १०० अक्षरांपेक्षा जास्त असू शकत नाही"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "पासवर्ड जुळत नाहीत",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "पासवर्ड जुळत नाहीत",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/* --- Meeting URLs --------------------------------------------------------- */

/**
 * Validate an external meeting URL.
 *
 * The administrator pastes these by hand and the student clicks them, so this
 * is an untrusted-input-to-navigation path. Rules:
 *   - https only. Blocks `javascript:`, `data:` and plaintext http.
 *   - Host must be a real hostname, rejecting credentials-in-URL tricks.
 *
 * We deliberately do NOT restrict to a hosts allowlist: the requirement is that
 * any meeting provider works. Scheme restriction is what prevents XSS here.
 */
export const meetingUrlSchema = z
  .string()
  .min(1, "मीटिंग लिंक आवश्यक आहे")
  .max(2048, "लिंक खूप लांब आहे")
  .superRefine((value, ctx) => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "वैध लिंक प्रविष्ट करा (https:// ने सुरू होणारी)",
      });
      return;
    }

    if (url.protocol !== "https:") {
      ctx.addIssue({
        code: "custom",
        message: "लिंक https:// ने सुरू होणे आवश्यक आहे",
      });
    }

    if (url.username || url.password) {
      ctx.addIssue({ code: "custom", message: "लिंकमध्ये लॉगिन माहिती असू शकत नाही" });
    }

    if (!url.hostname.includes(".")) {
      ctx.addIssue({ code: "custom", message: "वैध डोमेन नाव आवश्यक आहे" });
    }
  });

/**
 * Runtime guard for rendering a link. Mirrors `meetingUrlSchema` but returns a
 * boolean, for use in components that must decide whether to render an anchor.
 */
export function isSafeExternalUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  return meetingUrlSchema.safeParse(value).success;
}

/* --- Reading sessions ----------------------------------------------------- */

/**
 * Upper bound on a single recorded reading session: 30 minutes.
 *
 * Guards against a browser tab left open overnight inflating learning time.
 * The client timer also pauses on tab blur; this is the server-side backstop,
 * because the client value is user-controllable and must never be trusted.
 */
export const MAX_SESSION_SECONDS = 30 * 60;

/** Minimum duration worth recording. Filters out accidental taps. */
export const MIN_SESSION_SECONDS = 5;

export const recordSessionSchema = z.object({
  verseId: z.string().uuid("वैध श्लोक आयडी आवश्यक आहे"),
  durationSeconds: z
    .number()
    .int()
    .min(MIN_SESSION_SECONDS)
    .max(MAX_SESSION_SECONDS),
});

export type RecordSessionInput = z.infer<typeof recordSessionSchema>;

/** Clamp a client-reported duration into the accepted range. */
export function clampSessionSeconds(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds < 0) return 0;
  return Math.min(Math.floor(seconds), MAX_SESSION_SECONDS);
}
