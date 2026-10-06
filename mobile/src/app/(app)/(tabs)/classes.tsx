import { useCallback, useState } from "react";
import { FlatList, Linking, RefreshControl, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, EmptyState, Loading } from "@/components/ui";
import { getUpcomingClasses } from "@/lib/data";
import { formatClassDate, formatClassTime } from "@/lib/format";
import { useTheme } from "@/lib/theme";
import type { ClassSession } from "@/lib/types";

const PLATFORM_LABEL: Record<string, string> = {
  google_meet: "Google Meet",
  zoom: "Zoom",
  other: "ऑनलाइन",
};

export default function ClassesScreen() {
  const t = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<ClassSession[]>([]);

  const load = useCallback(async () => {
    setClasses(await getUpcomingClasses());
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
      contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
      data={classes}
      keyExtractor={(c) => c.id}
      ListEmptyComponent={<EmptyState message="सध्या कोणताही वर्ग नियोजित नाही." />}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />
      }
      renderItem={({ item }) => (
        <View
          style={{
            backgroundColor: t.surface,
            borderColor: t.rule,
            borderWidth: 1,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Ionicons name="videocam-outline" size={16} color={t.accent} />
            <Text style={{ color: t.accent, fontSize: 12, fontWeight: "600" }}>
              {PLATFORM_LABEL[item.meeting_platform] ?? "ऑनलाइन"}
            </Text>
          </View>
          <Text style={{ color: t.ink, fontSize: 17, fontWeight: "600" }}>
            {item.title}
          </Text>
          {item.description ? (
            <Text style={{ color: t.inkMuted, fontSize: 14, marginTop: 2 }}>
              {item.description}
            </Text>
          ) : null}
          <Text style={{ color: t.inkMuted, fontSize: 14, marginTop: 6 }}>
            {formatClassDate(item.class_date)} • {formatClassTime(item.class_time)}
          </Text>
          <Button
            title="वर्गात सहभागी व्हा"
            onPress={() => Linking.openURL(item.meeting_url)}
            style={{ marginTop: 12 }}
          />
        </View>
      )}
    />
  );
}
