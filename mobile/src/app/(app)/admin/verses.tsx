import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Loading } from "@/components/ui";
import {
  adminGetChapterVerses,
  adminGetChapters,
  adminSetChapterPublished,
} from "@/lib/admin-data";
import { verseLabel, toDevanagari } from "@/lib/format";
import { useTheme } from "@/lib/theme";
import type { Chapter, Verse } from "@/lib/types";

export default function AdminVerses() {
  const t = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selected, setSelected] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [versesLoading, setVersesLoading] = useState(false);

  useEffect(() => {
    adminGetChapters().then((cs) => {
      setChapters(cs);
      setSelected(cs[0] ?? null);
      setLoading(false);
    });
  }, []);

  const loadVerses = useCallback(async (chapterId: string) => {
    setVersesLoading(true);
    setVerses(await adminGetChapterVerses(chapterId));
    setVersesLoading(false);
  }, []);

  useEffect(() => {
    if (selected) loadVerses(selected.id);
  }, [selected, loadVerses]);

  async function togglePublish() {
    if (!selected) return;
    const next = !selected.is_published;
    await adminSetChapterPublished(selected.id, next);
    setSelected({ ...selected, is_published: next });
    setChapters((cs) =>
      cs.map((c) => (c.id === selected.id ? { ...c, is_published: next } : c)),
    );
  }

  if (loading) return <Loading />;

  return (
    <View style={{ flex: 1, backgroundColor: t.canvas }}>
      {/* Chapter selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        style={{ flexGrow: 0 }}
      >
        {chapters.map((c) => {
          const active = selected?.id === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => setSelected(c)}
              style={{
                backgroundColor: active ? t.accent : t.surface,
                borderColor: active ? t.accent : t.rule,
                borderWidth: 1,
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: active ? "#fff" : t.inkMuted, fontWeight: "600" }}>
                {toDevanagari(c.chapter_number)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {selected ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingBottom: 8,
          }}
        >
          <Text style={{ color: t.ink, fontSize: 15, fontWeight: "600", flex: 1 }}>
            {selected.name_marathi}
          </Text>
          <Pressable
            onPress={togglePublish}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: selected.is_published ? t.success : t.surfaceAlt,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Ionicons
              name={selected.is_published ? "eye" : "eye-off"}
              size={14}
              color={selected.is_published ? "#fff" : t.inkMuted}
            />
            <Text
              style={{
                color: selected.is_published ? "#fff" : t.inkMuted,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {selected.is_published ? "प्रकाशित" : "अप्रकाशित"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {versesLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={verses}
          keyExtractor={(v) => v.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 8 }}
          renderItem={({ item }) => {
            const needsReview =
              (item.translation ?? "").includes("[") ||
              (item.purport ?? "").includes("[?]") ||
              !item.translation;
            return (
              <Pressable
                onPress={() => router.push(`/(app)/admin/verse-edit/${item.id}`)}
                style={{
                  backgroundColor: t.surface,
                  borderColor: t.rule,
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Text style={{ color: t.accent, fontWeight: "700", minWidth: 44 }}>
                  {verseLabel(item)}
                </Text>
                <Text style={{ color: t.inkMuted, flex: 1 }} numberOfLines={1}>
                  {(item.translation ?? item.sanskrit_text ?? "").slice(0, 60)}
                </Text>
                {needsReview ? (
                  <Ionicons name="alert-circle" size={18} color={t.danger} />
                ) : null}
                <Ionicons name="chevron-forward" size={18} color={t.inkSubtle} />
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
