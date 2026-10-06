import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { Card, Loading } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { getChaptersWithProgress, getProgressSummary } from "@/lib/data";
import { formatDuration, toDevanagari } from "@/lib/format";
import { useTheme } from "@/lib/theme";
import type { ChapterWithProgress, ProgressSummary } from "@/lib/types";

export default function ProgressScreen() {
  const t = useTheme();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [chapters, setChapters] = useState<ChapterWithProgress[]>([]);

  const load = useCallback(async () => {
    const [s, c] = await Promise.all([
      getProgressSummary(userId),
      getChaptersWithProgress(userId),
    ]);
    setSummary(s);
    setChapters(c);
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.canvas }}
      contentContainerStyle={{ padding: 16, gap: 14 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />
      }
    >
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Stat label="वाचले" value={toDevanagari(summary?.verses_read ?? 0)} t={t} />
          <Stat label="पाठ केले" value={toDevanagari(summary?.verses_memorized ?? 0)} t={t} />
          <Stat label="वेळ" value={formatDuration(summary?.total_time_seconds ?? 0)} t={t} />
        </View>
      </Card>

      <Text style={{ color: t.inkMuted, fontSize: 14, fontWeight: "600", marginTop: 4 }}>
        अध्यायानुसार प्रगती
      </Text>

      {chapters.map((c) => {
        const pct =
          c.total_verses > 0 ? Math.round((c.verses_read / c.total_verses) * 100) : 0;
        return (
          <Card key={c.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ color: t.ink, fontSize: 15, fontWeight: "600", flex: 1 }}>
                {toDevanagari(c.chapter_number)}. {c.name_marathi}
              </Text>
              <Text style={{ color: t.inkMuted, fontSize: 13 }}>
                {toDevanagari(c.verses_read)}/{toDevanagari(c.total_verses)}
              </Text>
            </View>
            <View
              style={{
                height: 6,
                backgroundColor: t.surfaceAlt,
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <View style={{ width: `${pct}%`, height: "100%", backgroundColor: t.accent }} />
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

function Stat({ label, value, t }: { label: string; value: string; t: ReturnType<typeof useTheme> }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ color: t.ink, fontSize: 20, fontWeight: "700" }}>{value}</Text>
      <Text style={{ color: t.inkSubtle, fontSize: 12, marginTop: 2 }}>{label}</Text>
    </View>
  );
}
