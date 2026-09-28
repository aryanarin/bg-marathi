"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/schemas";

/**
 * Authentication Server Actions.
 *
 * Every action re-validates its input with Zod on the server, because client
 * validation is only a UX affordance. Errors are returned as a typed FormState
 * for `useActionState`, never thrown, so the form can show a friendly Marathi
 * message. Raw Supabase errors are mapped to plain messages and never surfaced
 * verbatim.
 */

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: string;
}

/** Map a Supabase auth error to a calm Marathi message. */
function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "ईमेल किंवा पासवर्ड चुकीचा आहे.";
  }
  if (m.includes("email not confirmed")) {
    return "कृपया आधी आपला ईमेल तपासून खाते सक्रिय करा.";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "हा ईमेल आधीच नोंदणीकृत आहे. कृपया प्रवेश करा.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "बरेच प्रयत्न झाले आहेत. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.";
  }
  return "काहीतरी अडचण आली. कृपया पुन्हा प्रयत्न करा.";
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: authErrorMessage(error.message) };
  }

  const next = formData.get("next");
  // Validated to be a same-site relative path. `typedRoutes` cannot know a
  // runtime string is a valid route, so cast after the startsWith guard.
  const target =
    typeof next === "string" && next.startsWith("/")
      ? (next as Route)
      : "/dashboard";

  revalidatePath("/", "layout");
  redirect(target);
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${getSiteUrl()}/auth/callback`,
    },
  });

  if (error) {
    return { error: authErrorMessage(error.message) };
  }

  return {
    success:
      "नोंदणी झाली! आपल्या ईमेलवर पाठवलेल्या दुव्यावर क्लिक करून खाते सक्रिय करा.",
  };
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  // Supabase does not reveal whether an address exists, and neither do we: the
  // success message is identical regardless, to avoid leaking which emails are
  // registered.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
  });

  return {
    success:
      "जर हा ईमेल नोंदणीकृत असेल, तर पासवर्ड पुन्हा सेट करण्याचा दुवा पाठवला आहे.",
  };
}

export async function updatePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  // Requires the recovery session established by the callback route from the
  // emailed link. Without it, updateUser fails and we show a plain message.
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return {
      error:
        "पासवर्ड बदलता आला नाही. दुवा कालबाह्य झाला असावा. कृपया पुन्हा विनंती करा.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
