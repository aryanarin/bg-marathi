import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { EmptyState, Loading } from "@/components/ui";
import { adminGetQuizzes, adminSetQuizPublished } from "@/lib/admin-data";
import { useTheme } from "@/lib/theme";
import type { Quiz } from "@/lib/types";

export default function AdminQuizzes() {
  const t = useTheme();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  const load = useCallback(async () => {
    setQuizzes(await adminGetQuizzes());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function togglePublish(q: Quiz) {
    const next = !q.is_published;
    await adminSetQuizPublished(q.id, next);
    setQuizzes((qs) => qs.map((x) => (x.id === q.id ? { ...x, is_published: next } : x)));
  }

  if (loading) return <Loading />;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: t.canvas }}
      contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
      data={quizzes}
      keyExtractor={(q) => q.id}
      ListEmptyComponent={<EmptyState message="अजून प्रश्नमंजुषा नाहीत. वेबवरून तयार करा." />}
      renderItem={({ item }) => (
        <View
          style={{
            backgroundColor: t.surface,
            borderColor: t.rule,
            borderWidth: 1,
            borderRadius: 12,
            padding: 14,
          }}
        >
          <Text style={{ color: t.ink, fontSize: 16, fontWeight: "600" }}>
            {item.title}
          </Text>
          {item.description ? (
            <Text style={{ color: t.inkMuted, fontSize: 13, marginTop: 2 }} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <Pressable
            onPress={() => togglePublish(item)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              alignSelf: "flex-start",
              backgroundColor: item.is_published ? t.success : t.surfaceAlt,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 6,
              marginTop: 10,
            }}
          >
            <Ionicons
              name={item.is_published ? "eye" : "eye-off"}
              size={14}
              color={item.is_published ? "#fff" : t.inkMuted}
            />
            <Text
              style={{
                color: item.is_published ? "#fff" : t.inkMuted,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {item.is_published ? "प्रकाशित" : "अप्रकाशित"}
            </Text>
          </Pressable>
        </View>
      )}
    />
  );
}
