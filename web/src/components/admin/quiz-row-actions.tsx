"use client";

import { useTransition } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";

import { deleteQuiz, deleteQuestion, setQuizPublished } from "@/lib/data/admin-quiz-actions";
import { Button } from "@/components/ui/button";

export function QuizPublishToggle({ quizId, published }: { quizId: string; published: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => start(() => setQuizPublished(quizId, !published))}
    >
      {published ? (
        <>
          <Eye className="size-4 text-success" /> प्रकाशित
        </>
      ) : (
        <>
          <EyeOff className="size-4 text-ink-subtle" /> मसुदा
        </>
      )}
    </Button>
  );
}

export function DeleteQuizButton({ quizId, title }: { quizId: string; title: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={`${title} हटवा`}
      onClick={() => {
        if (confirm(`"${title}" आणि त्यातील सर्व प्रश्न हटवायचे?`)) {
          start(() => deleteQuiz(quizId));
        }
      }}
    >
      <Trash2 className="size-4 text-danger" />
    </Button>
  );
}

export function DeleteQuestionButton({ questionId, quizId }: { questionId: string; quizId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label="प्रश्न हटवा"
      onClick={() => {
        if (confirm("हा प्रश्न हटवायचा?")) start(() => deleteQuestion(questionId, quizId));
      }}
    >
      <Trash2 className="size-4 text-danger" />
    </Button>
  );
}
