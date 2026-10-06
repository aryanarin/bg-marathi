import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card, EmptyState, Loading } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import {
  getQuiz,
  getQuizQuestions,
  getUserAttempts,
  startQuizAttempt,
  submitQuizAttempt,
} from "@/lib/data";
import { QUIZ_OPTIONS, optionLabel, toDevanagari } from "@/lib/format";
import { useTheme } from "@/lib/theme";
import type {
  PublicQuizQuestion,
  Quiz,
  QuizAttempt,
  QuizOption,
  SubmitQuizResult,
} from "@/lib/types";

type Phase = "intro" | "answering" | "results";

export default function QuizScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<PublicQuizQuestion[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  const [phase, setPhase] = useState<Phase>("intro");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, QuizOption>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitQuizResult | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const [q, qs, at] = await Promise.all([
      getQuiz(id),
      getQuizQuestions(id),
      userId ? getUserAttempts(id, userId) : Promise.resolve([]),
    ]);
    setQuiz(q);
    setQuestions(qs);
    setAttempts(at);
    setLoading(false);
  }, [id, userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onStart() {
    if (!id || !userId) return;
    const newAttemptId = await startQuizAttempt(id, userId);
    if (!newAttemptId) return;
    setAttemptId(newAttemptId);
    setAnswers({});
    setResult(null);
    setPhase("answering");
  }

  async function onSubmit() {
    if (!attemptId) return;
    setSubmitting(true);
    const payload = questions.map((q) => ({
      question_id: q.id,
      selected_option: answers[q.id] ?? null,
    }));
    const res = await submitQuizAttempt(attemptId, payload);
    setSubmitting(false);
    if (res) {
      setResult(res);
      setPhase("results");
      load();
    }
  }

  if (loading) return <Loading />;
  if (!quiz) return <EmptyState message="प्रश्नमंजुषा सापडली नाही." />;

  return (
    <>
      <Stack.Screen
        options={{
          title: quiz.title,
          headerStyle: { backgroundColor: t.canvas },
          headerTintColor: t.ink,
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: t.canvas }}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}
      >
        {phase === "intro" ? (
          <IntroPhase
            quiz={quiz}
            questionCount={questions.length}
            attempts={attempts}
            onStart={onStart}
            t={t}
          />
        ) : null}

        {phase === "answering" ? (
          <AnsweringPhase
            questions={questions}
            answers={answers}
            onSelect={(qid, opt) => setAnswers((a) => ({ ...a, [qid]: opt }))}
            onSubmit={onSubmit}
            submitting={submitting}
            t={t}
          />
        ) : null}

        {phase === "results" && result ? (
          <ResultsPhase
            result={result}
            questions={questions}
            onRetake={onStart}
            t={t}
          />
        ) : null}
      </ScrollView>
    </>
  );
}

function IntroPhase({
  quiz,
  questionCount,
  attempts,
  onStart,
  t,
}: {
  quiz: Quiz;
  questionCount: number;
  attempts: QuizAttempt[];
  onStart: () => void;
  t: ReturnType<typeof useTheme>;
}) {
  const completed = attempts.filter((a) => a.completed_at);
  return (
    <>
      <Card>
        {quiz.description ? (
          <Text style={{ color: t.inkMuted, fontSize: 15, lineHeight: 23, marginBottom: 10 }}>
            {quiz.description}
          </Text>
        ) : null}
        <Text style={{ color: t.inkMuted, fontSize: 14 }}>
          एकूण प्रश्न: {toDevanagari(questionCount)}
        </Text>
      </Card>

      <Button
        title={completed.length > 0 ? "पुन्हा प्रयत्न करा" : "सुरू करा"}
        onPress={onStart}
        disabled={questionCount === 0}
      />

      {completed.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: t.inkMuted, fontSize: 14, fontWeight: "600" }}>
            मागील प्रयत्न
          </Text>
          {completed.map((a) => (
            <Card key={a.id}>
              <Text style={{ color: t.ink, fontSize: 15 }}>
                गुण: {toDevanagari(a.score)} / {toDevanagari(a.total_questions)}
              </Text>
            </Card>
          ))}
        </View>
      ) : null}
    </>
  );
}

function AnsweringPhase({
  questions,
  answers,
  onSelect,
  onSubmit,
  submitting,
  t,
}: {
  questions: PublicQuizQuestion[];
  answers: Record<string, QuizOption>;
  onSelect: (qid: string, opt: QuizOption) => void;
  onSubmit: () => void;
  submitting: boolean;
  t: ReturnType<typeof useTheme>;
}) {
  const allAnswered = questions.every((q) => answers[q.id]);
  return (
    <>
      {questions.map((q, idx) => (
        <Card key={q.id}>
          <Text style={{ color: t.ink, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
            {toDevanagari(idx + 1)}. {q.question}
          </Text>
          <View style={{ gap: 8 }}>
            {QUIZ_OPTIONS.map((opt) => {
              const text = q[`option_${opt}` as keyof PublicQuizQuestion] as string;
              const selected = answers[q.id] === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => onSelect(q.id, opt)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    backgroundColor: selected ? t.accentSoft : t.canvas,
                    borderColor: selected ? t.accent : t.rule,
                    borderWidth: 1,
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: selected ? t.accent : t.surfaceAlt,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: selected ? "#fff" : t.inkMuted, fontWeight: "700", fontSize: 13 }}>
                      {optionLabel(opt)}
                    </Text>
                  </View>
                  <Text style={{ color: t.ink, fontSize: 15, flex: 1 }}>{text}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ))}

      <Button
        title="उत्तरे सबमिट करा"
        onPress={onSubmit}
        loading={submitting}
        disabled={!allAnswered}
      />
    </>
  );
}

function ResultsPhase({
  result,
  questions,
  onRetake,
  t,
}: {
  result: SubmitQuizResult;
  questions: PublicQuizQuestion[];
  onRetake: () => void;
  t: ReturnType<typeof useTheme>;
}) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  return (
    <>
      <Card style={{ alignItems: "center" }}>
        <Text style={{ color: t.inkMuted, fontSize: 14 }}>तुमचे गुण</Text>
        <Text style={{ color: t.accent, fontSize: 36, fontWeight: "700" }}>
          {toDevanagari(result.score)} / {toDevanagari(result.total_questions)}
        </Text>
      </Card>

      {result.answers.map((a, idx) => {
        const q = byId.get(a.question_id);
        return (
          <Card key={a.question_id}>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
              <Ionicons
                name={a.is_correct ? "checkmark-circle" : "close-circle"}
                size={20}
                color={a.is_correct ? t.success : t.danger}
              />
              <Text style={{ color: t.ink, fontSize: 15, fontWeight: "600", flex: 1 }}>
                {toDevanagari(idx + 1)}. {q?.question}
              </Text>
            </View>
            <Text style={{ color: t.inkMuted, fontSize: 14 }}>
              योग्य उत्तर: {optionLabel(a.correct_option)}
            </Text>
            {a.explanation ? (
              <Text style={{ color: t.inkMuted, fontSize: 14, marginTop: 6, lineHeight: 21 }}>
                {a.explanation}
              </Text>
            ) : null}
          </Card>
        );
      })}

      <Button title="पुन्हा प्रयत्न करा" variant="secondary" onPress={onRetake} />
    </>
  );
}
