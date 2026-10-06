import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { EmptyState, Loading } from "@/components/ui";
import { adminGetClasses, adminSetClassPublished } from "@/lib/admin-data";
import { formatClassDate, formatClassTime } from "@/lib/format";
import { useTheme } from "@/lib/theme";
import type { ClassSession } from "@/lib/types";

export default function AdminClasses() {
  const t = useTheme();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassSession[]>([]);

  const load = useCallback(async () => {
    setClasses(await adminGetClasses());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function togglePublish(c: ClassSession) {
    const next = !c.is_published;
    await adminSetClassPublished(c.id, next);
    setClasses((cs) => cs.map((x) => (x.id === c.id ? { ...x, is_published: next } : x)));
  }

  if (loading) return <Loading />;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: t.canvas }}
      contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
      data={classes}
      keyExtractor={(c) => c.id}
      ListEmptyComponent={<EmptyState message="अजून वर्ग नाहीत. वेबवरून वर्ग तयार करा." />}
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
          <Text style={{ color: t.inkMuted, fontSize: 13, marginTop: 2 }}>
            {formatClassDate(item.class_date)} • {formatClassTime(item.class_time)}
          </Text>
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
