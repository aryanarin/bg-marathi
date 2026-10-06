import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { Button, Loading } from "@/components/ui";
import { adminGetVerse, adminUpdateVerse } from "@/lib/admin-data";
import { verseLabel } from "@/lib/format";
import { useTheme } from "@/lib/theme";
import type { Verse } from "@/lib/types";

export default function VerseEdit() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [verse, setVerse] = useState<Verse | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [sanskrit, setSanskrit] = useState("");
  const [wordToWord, setWordToWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [purport, setPurport] = useState("");
  const [easy, setEasy] = useState("");
  const [example, setExample] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  useEffect(() => {
    if (!id) return;
    adminGetVerse(id).then((v) => {
      setVerse(v);
      if (v) {
        setSanskrit(v.sanskrit_text ?? "");
        setWordToWord(v.word_to_word ?? "");
        setTranslation(v.translation ?? "");
        setPurport(v.purport ?? "");
        setEasy(v.easy_explanation ?? "");
        setExample(v.example ?? "");
        setAudioUrl(v.audio_url ?? "");
      }
      setLoading(false);
    });
  }, [id]);

  async function onSave() {
    if (!verse) return;
    setSaving(true);
    setMessage(null);
    const { error } = await adminUpdateVerse(verse.id, {
      sanskrit_text: sanskrit,
      word_to_word: wordToWord || null,
      translation: translation || null,
      purport: purport || null,
      easy_explanation: easy || null,
      example: example || null,
      audio_url: audioUrl || null,
    });
    setSaving(false);
    if (error) {
      setMessage(`त्रुटी: ${error}`);
    } else {
      setMessage("जतन झाले!");
      setTimeout(() => router.back(), 600);
    }
  }

  if (loading || !verse) return <Loading />;

  return (
    <>
      <Stack.Screen options={{ title: `श्लोक ${verseLabel(verse)}` }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: t.canvas }}
      >
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
          <EditField label="संस्कृत पाठ" value={sanskrit} onChange={setSanskrit} t={t} multiline />
          <EditField label="शब्दार्थ" value={wordToWord} onChange={setWordToWord} t={t} multiline />
          <EditField label="भाषांतर" value={translation} onChange={setTranslation} t={t} multiline />
          <EditField label="भावार्थ" value={purport} onChange={setPurport} t={t} multiline tall />
          <EditField label="सोपे स्पष्टीकरण" value={easy} onChange={setEasy} t={t} multiline />
          <EditField label="उदाहरण" value={example} onChange={setExample} t={t} multiline />
          <EditField label="ऑडिओ URL" value={audioUrl} onChange={setAudioUrl} t={t} />

          {message ? (
            <Text
              style={{
                color: message.startsWith("त्रुटी") ? t.danger : t.success,
                fontSize: 14,
              }}
            >
              {message}
            </Text>
          ) : null}

          <Button title="जतन करा" onPress={onSave} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function EditField({
  label,
  value,
  onChange,
  t,
  multiline,
  tall,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  t: ReturnType<typeof useTheme>;
  multiline?: boolean;
  tall?: boolean;
}) {
  return (
    <View>
      <Text style={{ color: t.inkMuted, fontSize: 13, fontWeight: "600", marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        style={{
          backgroundColor: t.surface,
          borderColor: t.rule,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 15,
          color: t.ink,
          minHeight: multiline ? (tall ? 160 : 70) : 44,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}
