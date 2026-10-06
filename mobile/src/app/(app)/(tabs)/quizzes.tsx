import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { EmptyState, Loading } from "@/components/ui";
import { getPublishedQuizzes } from "@/lib/data";
import { useTheme } from "@/lib/theme";
import type { Quiz } from "@/lib/types";

export default function QuizzesScreen() {
  const t = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  const load = useCallback(async () => {
    setQuizzes(await getPublishedQuizzes());
    setLoading(false);
  }, []);

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
      contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
      data={quizzes}
      keyExtractor={(q) => q.id}
      ListEmptyComponent={
        <EmptyState message="सध्या कोणतीही प्रश्नमंजुषा उपलब्ध नाही." />
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/(app)/quiz/${item.id}`)}
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
          <Ionicons name="help-circle-outline" size={26} color={t.accent} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.ink, fontSize: 16, fontWeight: "600" }}>
              {item.title}
            </Text>
            {item.description ? (
              <Text style={{ color: t.inkMuted, fontSize: 13, marginTop: 2 }} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color={t.inkSubtle} />
        </Pressable>
      )}
    />
  );
}
