import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { Button, Card, Loading } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import {
  getProgressSummary,
  getRecentQuizResult,
  getUpcomingClasses,
} from "@/lib/data";
import { formatClassDate, formatClassTime, formatDuration, toDevanagari } from "@/lib/format";
import { useTheme } from "@/lib/theme";
import type { ClassSession, ProgressSummary } from "@/lib/types";

export default function DashboardScreen() {
  const t = useTheme();
  const router = useRouter();
  const { session, profile, isAdmin } = useAuth();
  const userId = session?.user.id ?? null;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [nextClass, setNextClass] = useState<ClassSession | null>(null);
  const [recentQuiz, setRecentQuiz] = useState<{
    title: string;
    score: number;
    total: number;
  } | null>(null);

  const load = useCallback(async () => {
    const [s, classes, quiz] = await Promise.all([
      getProgressSummary(userId),
      getUpcomingClasses(),
      userId ? getRecentQuizResult(userId) : Promise.resolve(null),
    ]);
    setSummary(s);
    setNextClass(classes[0] ?? null);
    setRecentQuiz(quiz);
    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (loading) return <Loading />;

  const pct =
    summary && summary.total_verses > 0
      ? Math.round((summary.verses_read / summary.total_verses) * 100)
      : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.canvas }}
      contentContainerStyle={{ padding: 16, gap: 14 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />
      }
    >
      <View>
        <Text style={{ color: t.inkMuted, fontSize: 14 }}>नमस्कार,</Text>
        <Text style={{ color: t.ink, fontSize: 22, fontWeight: "700" }}>
          {profile?.full_name ?? "साधक"}
        </Text>
      </View>

      <Card>
        <Text style={{ color: t.inkMuted, fontSize: 13, fontWeight: "600" }}>
          वाचनाची प्रगती
        </Text>
        <Text style={{ color: t.ink, fontSize: 28, fontWeight: "700", marginTop: 4 }}>
          {toDevanagari(summary?.verses_read ?? 0)}
          <Text style={{ color: t.inkSubtle, fontSize: 18 }}>
            {" "}/ {toDevanagari(summary?.total_verses ?? 0)} श्लोक
          </Text>
        </Text>
        <View
          style={{
            height: 8,
            backgroundColor: t.surfaceAlt,
            borderRadius: 999,
            marginTop: 12,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${pct}%`,
              height: "100%",
              backgroundColor: t.accent,
            }}
          />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12 }}>
          <View>
            <Text style={{ color: t.inkSubtle, fontSize: 12 }}>पाठ केलेले</Text>
            <Text style={{ color: t.ink, fontSize: 16, fontWeight: "600" }}>
              {toDevanagari(summary?.verses_memorized ?? 0)}
            </Text>
          </View>
          <View>
            <Text style={{ color: t.inkSubtle, fontSize: 12 }}>अभ्यास वेळ</Text>
            <Text style={{ color: t.ink, fontSize: 16, fontWeight: "600" }}>
              {formatDuration(summary?.total_time_seconds ?? 0)}
            </Text>
          </View>
          <View>
            <Text style={{ color: t.inkSubtle, fontSize: 12 }}>पूर्ण</Text>
            <Text style={{ color: t.ink, fontSize: 16, fontWeight: "600" }}>
              {toDevanagari(pct)}%
            </Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={{ color: t.inkMuted, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
          पुढील वर्ग
        </Text>
        {nextClass ? (
          <>
            <Text style={{ color: t.ink, fontSize: 17, fontWeight: "600" }}>
              {nextClass.title}
            </Text>
            <Text style={{ color: t.inkMuted, fontSize: 14, marginTop: 2 }}>
              {formatClassDate(nextClass.class_date)} • {formatClassTime(nextClass.class_time)}
            </Text>
            <Button
              title="वर्गात सहभागी व्हा"
              variant="secondary"
              onPress={() => router.push("/(app)/(tabs)/classes")}
              style={{ marginTop: 12 }}
            />
          </>
        ) : (
          <Text style={{ color: t.inkSubtle, fontSize: 14 }}>
            सध्या कोणताही वर्ग नियोजित नाही.
          </Text>
        )}
      </Card>

      {recentQuiz ? (
        <Card>
          <Text style={{ color: t.inkMuted, fontSize: 13, fontWeight: "600", marginBottom: 6 }}>
            अलीकडील प्रश्नमंजुषा
          </Text>
          <Text style={{ color: t.ink, fontSize: 16, fontWeight: "600" }}>
            {recentQuiz.title}
          </Text>
          <Text style={{ color: t.accent, fontSize: 15, marginTop: 2 }}>
            गुण: {toDevanagari(recentQuiz.score)} / {toDevanagari(recentQuiz.total)}
          </Text>
        </Card>
      ) : null}

      {isAdmin ? (
        <Button
          title="प्रशासन"
          variant="ghost"
          onPress={() => router.push("/(app)/admin")}
        />
      ) : null}
    </ScrollView>
  );
}
