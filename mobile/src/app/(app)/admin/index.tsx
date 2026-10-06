import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export default function AdminHome() {
  const t = useTheme();
  const router = useRouter();
  const { signOut, profile } = useAuth();

  const items: {
    label: string;
    desc: string;
    href: Href;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { label: "श्लोक संपादन", desc: "संस्कृत, भाषांतर, भावार्थ दुरुस्त करा", href: "/(app)/admin/verses", icon: "create-outline" },
    { label: "वर्ग", desc: "ऑनलाइन वर्ग व्यवस्थापन", href: "/(app)/admin/classes", icon: "videocam-outline" },
    { label: "प्रश्नमंजुषा", desc: "प्रश्नमंजुषा प्रकाशित करा", href: "/(app)/admin/quizzes", icon: "help-circle-outline" },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.canvas }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      <Text style={{ color: t.inkMuted, fontSize: 14 }}>{profile?.email}</Text>

      {items.map((it) => (
        <Pressable key={it.label} onPress={() => router.push(it.href)}>
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Ionicons name={it.icon} size={26} color={t.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.ink, fontSize: 16, fontWeight: "600" }}>
                {it.label}
              </Text>
              <Text style={{ color: t.inkMuted, fontSize: 13, marginTop: 2 }}>
                {it.desc}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={t.inkSubtle} />
          </Card>
        </Pressable>
      ))}

      <Button
        title="बाहेर पडा"
        variant="ghost"
        onPress={signOut}
        style={{ marginTop: 12 }}
      />
    </ScrollView>
  );
}
