import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

import { Loading } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import {
  getVerse,
  getVerseNeighbors,
  getVerseProgress,
  recordReadingTime,
  toggleMemorized,
  toggleRead,
} from "@/lib/data";
import { verseLabel } from "@/lib/format";
import { useTheme } from "@/lib/theme";
import type { Verse, VerseProgress } from "@/lib/types";

export default function VerseReaderScreen() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [loading, setLoading] = useState(true);
  const [verse, setVerse] = useState<Verse | null>(null);
  const [progress, setProgress] = useState<VerseProgress | null>(null);
  const [neighbors, setNeighbors] = useState<{
    prevId: string | null;
    nextId: string | null;
  }>({ prevId: null, nextId: null });

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const v = await getVerse(id);
    setVerse(v);
    if (v) {
      const [p, n] = await Promise.all([
        getVerseProgress(v.id, userId),
        getVerseNeighbors(v.chapter_id, v.display_order),
      ]);
      setProgress(p);
      setNeighbors(n);
    }
    setLoading(false);
  }, [id, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Flush accumulated reading time when the verse id changes or on unmount.
  useEffect(() => {
    const verseId = id;
    const startedAt = Date.now();
    return () => {
      if (!verseId || !userId) return;
      const seconds = Math.round((Date.now() - startedAt) / 1000);
      recordReadingTime(verseId, seconds).catch(() => {});
    };
  }, [id, userId]);

  async function onToggleRead() {
    if (!verse || !userId) return;
    const next = !(progress?.is_read ?? false);
    setProgress((p) =>
      p
        ? { ...p, is_read: next }
        : ({ is_read: next, is_memorized: false } as VerseProgress),
    );
    await toggleRead(verse.id, next);
  }

  async function onToggleMemorized() {
    if (!verse || !userId) return;
    const next = !(progress?.is_memorized ?? false);
    setProgress((p) =>
      p
        ? { ...p, is_memorized: next, is_read: next ? true : p.is_read }
        : ({ is_memorized: next, is_read: next } as VerseProgress),
    );
    await toggleMemorized(verse.id, next);
  }

  if (loading || !verse) return <Loading />;

  return (
    <>
      <Stack.Screen
        options={{
          title: `श्लोक ${verseLabel(verse)}`,
          headerStyle: { backgroundColor: t.canvas },
          headerTintColor: t.ink,
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: t.canvas }}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
      >
        {/* Sanskrit */}
        <View
          style={{
            backgroundColor: t.surface,
            borderColor: t.rule,
            borderWidth: 1,
            borderRadius: 12,
            padding: 18,
          }}
        >
          <Text
            style={{
              color: t.ink,
              fontSize: 20,
              lineHeight: 34,
              textAlign: "center",
            }}
          >
            {verse.sanskrit_text}
          </Text>
        </View>

        {verse.audio_url ? <AudioPlayer url={verse.audio_url} /> : null}

        {/* Progress actions */}
        {userId ? (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <ToggleButton
              active={progress?.is_read ?? false}
              icon="checkmark-circle"
              label={progress?.is_read ? "वाचले" : "वाचले म्हणून खूण करा"}
              onPress={onToggleRead}
            />
            <ToggleButton
              active={progress?.is_memorized ?? false}
              icon="star"
              label={progress?.is_memorized ? "पाठ झाले" : "पाठ झाले"}
              onPress={onToggleMemorized}
            />
          </View>
        ) : null}

        <Section title="शब्दार्थ" body={verse.word_to_word} t={t} />
        <Section title="भाषांतर" body={verse.translation} t={t} highlight />
        <Section title="भावार्थ" body={verse.purport} t={t} />
        <Section title="सोपे स्पष्टीकरण" body={verse.easy_explanation} t={t} />
        <Section title="उदाहरण" body={verse.example} t={t} />

        {/* Prev / Next */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
          <Pressable
            disabled={!neighbors.prevId}
            onPress={() =>
              neighbors.prevId && router.replace(`/(app)/verse/${neighbors.prevId}`)
            }
            style={{ flexDirection: "row", alignItems: "center", gap: 4, opacity: neighbors.prevId ? 1 : 0.3 }}
          >
            <Ionicons name="chevron-back" size={20} color={t.accent} />
            <Text style={{ color: t.accent, fontSize: 15 }}>मागील</Text>
          </Pressable>
          <Pressable
            disabled={!neighbors.nextId}
            onPress={() =>
              neighbors.nextId && router.replace(`/(app)/verse/${neighbors.nextId}`)
            }
            style={{ flexDirection: "row", alignItems: "center", gap: 4, opacity: neighbors.nextId ? 1 : 0.3 }}
          >
            <Text style={{ color: t.accent, fontSize: 15 }}>पुढील</Text>
            <Ionicons name="chevron-forward" size={20} color={t.accent} />
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

function Section({
  title,
  body,
  t,
  highlight,
}: {
  title: string;
  body: string | null;
  t: ReturnType<typeof useTheme>;
  highlight?: boolean;
}) {
  if (!body || !body.trim()) return null;
  return (
    <View
      style={{
        backgroundColor: highlight ? t.accentSoft : t.surface,
        borderColor: t.rule,
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
      }}
    >
      <Text
        style={{
          color: t.accent,
          fontSize: 13,
          fontWeight: "700",
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      <Text style={{ color: t.ink, fontSize: 16, lineHeight: 26 }}>{body}</Text>
    </View>
  );
}

function ToggleButton({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: "checkmark-circle" | "star";
  label: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: active ? t.accent : t.surface,
        borderColor: active ? t.accent : t.rule,
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 11,
        paddingHorizontal: 8,
      }}
    >
      <Ionicons name={icon} size={18} color={active ? "#fff" : t.inkMuted} />
      <Text
        style={{ color: active ? "#fff" : t.inkMuted, fontSize: 13, fontWeight: "600" }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AudioPlayer({ url }: { url: string }) {
  const t = useTheme();
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);

  function toggle() {
    if (status.playing) {
      player.pause();
    } else {
      if (status.didJustFinish || status.currentTime >= status.duration) {
        player.seekTo(0);
      }
      player.play();
    }
  }

  const progressPct =
    status.duration > 0 ? (status.currentTime / status.duration) * 100 : 0;

  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderColor: t.rule,
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Pressable
        onPress={toggle}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: t.accent,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={status.playing ? "pause" : "play"}
          size={22}
          color="#fff"
        />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.inkMuted, fontSize: 13, marginBottom: 6 }}>
          संस्कृत उच्चारण
        </Text>
        <View
          style={{
            height: 5,
            backgroundColor: t.surfaceAlt,
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <View style={{ width: `${progressPct}%`, height: "100%", backgroundColor: t.accent }} />
        </View>
      </View>
    </View>
  );
}
