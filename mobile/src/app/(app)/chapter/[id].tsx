import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { EmptyState, Loading } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { getChapter, getChapterVerses } from "@/lib/data";
import { verseLabel } from "@/lib/format";
import { useTheme } from "@/lib/theme";
import type { Chapter, VerseListItem } from "@/lib/types";

export default function ChapterDetailScreen() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<VerseListItem[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const [ch, vs] = await Promise.all([
      getChapter(id),
      getChapterVerses(id, userId),
    ]);
    setChapter(ch);
    setVerses(vs);
    setLoading(false);
  }, [id, userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) return <Loading />;

  return (
    <>
      <Stack.Screen
        options={{
          title: chapter?.name_marathi ?? "अध्याय",
          headerStyle: { backgroundColor: t.canvas },
          headerTintColor: t.ink,
        }}
      />
      <FlatList
        style={{ flex: 1, backgroundColor: t.canvas }}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        data={verses}
        keyExtractor={(v) => v.id}
        ListHeaderComponent={
          chapter?.description ? (
            <View
              style={{
                backgroundColor: t.surfaceAlt,
                borderRadius: 12,
                padding: 14,
                marginBottom: 6,
              }}
            >
              <Text style={{ color: t.inkMuted, fontSize: 14, lineHeight: 21 }}>
                {chapter.description}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={<EmptyState message="या अध्यायात अजून श्लोक नाहीत." />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(app)/verse/${item.id}`)}
            style={({ pressed }) => ({
              backgroundColor: t.surface,
              borderColor: t.rule,
              borderWidth: 1,
              borderRadius: 12,
              padding: 14,
              opacity: pressed ? 0.9 : 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            })}
          >
            <View
              style={{
                minWidth: 40,
                height: 40,
                paddingHorizontal: 8,
                borderRadius: 20,
                backgroundColor: t.accentSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: t.accent, fontSize: 15, fontWeight: "700" }}>
                {verseLabel(item)}
              </Text>
            </View>
            <Text style={{ color: t.inkMuted, fontSize: 14, flex: 1 }} numberOfLines={2}>
              {item.preview}
            </Text>
            <View style={{ flexDirection: "row", gap: 4 }}>
              {item.is_read ? (
                <Ionicons name="checkmark-circle" size={18} color={t.success} />
              ) : null}
              {item.is_memorized ? (
                <Ionicons name="star" size={18} color={t.accent} />
              ) : null}
            </View>
          </Pressable>
        )}
      />
    </>
  );
}
