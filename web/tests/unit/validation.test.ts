import { describe, expect, it } from "vitest";

import {
  MAX_SESSION_SECONDS,
  clampSessionSeconds,
  isSafeExternalUrl,
  loginSchema,
  meetingUrlSchema,
  recordSessionSchema,
  registerSchema,
} from "@/lib/validation/schemas";

describe("meetingUrlSchema", () => {
  it("accepts real meeting URLs from any provider", () => {
    const valid = [
      "https://meet.google.com/abc-defg-hij",
      "https://zoom.us/j/1234567890",
      "https://us02web.zoom.us/j/8412345678?pwd=Abc123",
      "https://teams.microsoft.com/l/meetup-join/19%3ameeting",
      "https://example.org/my-custom-room",
    ];

    for (const url of valid) {
      expect(meetingUrlSchema.safeParse(url).success, url).toBe(true);
    }
  });

  it("rejects script and data URLs", () => {
    // This is the important case: the admin pastes this value and a student
    // clicks it, so an unchecked scheme here would be stored XSS.
    const dangerous = [
      "javascript:alert(document.cookie)",
      "JavaScript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
    ];

    for (const url of dangerous) {
      expect(meetingUrlSchema.safeParse(url).success, url).toBe(false);
    }
  });

  it("rejects plaintext http", () => {
    expect(meetingUrlSchema.safeParse("http://zoom.us/j/123").success).toBe(false);
  });

  it("rejects credentials embedded in the URL", () => {
    expect(
      meetingUrlSchema.safeParse("https://user:pass@evil.example.com/a").success,
    ).toBe(false);
  });

  it("rejects hosts without a dot, which are not real public domains", () => {
    expect(meetingUrlSchema.safeParse("https://localhost/room").success).toBe(false);
  });

  it("rejects empty and malformed values", () => {
    expect(meetingUrlSchema.safeParse("").success).toBe(false);
    expect(meetingUrlSchema.safeParse("not a url").success).toBe(false);
    expect(meetingUrlSchema.safeParse("meet.google.com/abc").success).toBe(false);
  });
});

describe("isSafeExternalUrl", () => {
  it("guards against null and undefined", () => {
    expect(isSafeExternalUrl(null)).toBe(false);
    expect(isSafeExternalUrl(undefined)).toBe(false);
    expect(isSafeExternalUrl("")).toBe(false);
  });

  it("agrees with the schema", () => {
    expect(isSafeExternalUrl("https://meet.google.com/abc-defg-hij")).toBe(true);
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("reading session limits", () => {
  it("caps a session at 30 minutes so an idle tab cannot inflate time", () => {
    expect(clampSessionSeconds(999_999)).toBe(MAX_SESSION_SECONDS);
    expect(clampSessionSeconds(8 * 60 * 60)).toBe(MAX_SESSION_SECONDS);
  });

  it("floors fractional values and rejects nonsense", () => {
    expect(clampSessionSeconds(12.9)).toBe(12);
    expect(clampSessionSeconds(-5)).toBe(0);
    expect(clampSessionSeconds(Number.NaN)).toBe(0);
    expect(clampSessionSeconds(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("rejects durations below the minimum worth recording", () => {
    const result = recordSessionSchema.safeParse({
      verseId: "3f8c6d5e-1a2b-4c3d-9e8f-7a6b5c4d3e2f",
      durationSeconds: 2,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a duration above the maximum", () => {
    const result = recordSessionSchema.safeParse({
      verseId: "3f8c6d5e-1a2b-4c3d-9e8f-7a6b5c4d3e2f",
      durationSeconds: MAX_SESSION_SECONDS + 1,
    });
    expect(result.success).toBe(false);
  });

  it("requires a valid uuid for the verse", () => {
    const result = recordSessionSchema.safeParse({
      verseId: "1",
      durationSeconds: 60,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a plausible session", () => {
    const result = recordSessionSchema.safeParse({
      verseId: "3f8c6d5e-1a2b-4c3d-9e8f-7a6b5c4d3e2f",
      durationSeconds: 240,
    });
    expect(result.success).toBe(true);
  });
});

describe("auth schemas", () => {
  it("requires a well-formed email to log in", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(
      true,
    );
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(
      false,
    );
  });

  it("rejects a registration where the passwords differ", () => {
    const result = registerSchema.safeParse({
      fullName: "Aryan Raj",
      email: "a@b.com",
      password: "correct-horse",
      confirmPassword: "correct-hose",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("confirmPassword"))).toBe(
        true,
      );
    }
  });

  it("enforces a minimum password length", () => {
    const result = registerSchema.safeParse({
      fullName: "Aryan Raj",
      email: "a@b.com",
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse({
      fullName: "Aryan Raj",
      email: "aryan@example.com",
      password: "a-good-passphrase",
      confirmPassword: "a-good-passphrase",
    });
    expect(result.success).toBe(true);
  });
});
