"use client";

import { useTransition } from "react";

import { startQuizAttempt } from "@/lib/data/quiz-actions";
import { Button } from "@/components/ui/button";

export function StartQuizButton({ quizId, label }: { quizId: string; label: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="lg"
      disabled={pending}
      onClick={() => startTransition(() => startQuizAttempt(quizId))}
    >
      {pending ? "सुरू करत आहे…" : label}
    </Button>
  );
}
