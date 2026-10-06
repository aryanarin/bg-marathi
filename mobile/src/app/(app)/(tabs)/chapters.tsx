import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Loading } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { getChaptersWithProgress } from "@/lib/data";
import { toDevanagari } from "@/lib/format";
import { useTheme } from "@/lib/theme";
import type { ChapterWithProgress } from "@/lib/types";

export default function ChaptersScreen() {
  const t = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chapters, setChapters] = useState<ChapterWithProgress[]>([]);

  const load = useCallback(async () => {
    setChapters(await getChaptersWithProgress(userId));
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
    <FlatList
      style={{ flex: 1, backgroundColor: t.canvas }}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      data={chapters}
      keyExtractor={(c) => c.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/(app)/chapter/${item.id}`)}
          style={({ pressed }) => ({
            backgroundColor: t.surface,
            borderColor: t.rule,
            borderWidth: 1,
            borderRadius: 12,
            padding: 16,
            opacity: pressed ? 0.9 : 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          })}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: t.accentSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: t.accent, fontSize: 16, fontWeight: "700" }}>
              {toDevanagari(item.chapter_number)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.ink, fontSize: 16, fontWeight: "600" }}>
              {item.name_marathi}
            </Text>
            <Text style={{ color: t.inkSubtle, fontSize: 13, marginTop: 1 }}>
              {item.name_sanskrit}
            </Text>
            <Text style={{ color: t.inkMuted, fontSize: 12, marginTop: 4 }}>
              {toDevanagari(item.verses_read)} / {toDevanagari(item.total_verses)} वाचले
              {item.verses_memorized > 0
                ? `  •  ${toDevanagari(item.verses_memorized)} पाठ`
                : ""}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={t.inkSubtle} />
        </Pressable>
      )}
    />
  );
}
