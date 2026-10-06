import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";

import { Loading } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export default function AdminLayout() {
  const t = useTheme();
  const router = useRouter();
  const { initializing, isAdmin } = useAuth();

  useEffect(() => {
    if (!initializing && !isAdmin) {
      router.replace("/(app)/(tabs)/dashboard");
    }
  }, [initializing, isAdmin, router]);

  if (initializing || !isAdmin) return <Loading />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: t.canvas },
        headerTintColor: t.ink,
      }}
    >
      <Stack.Screen name="index" options={{ title: "प्रशासन" }} />
      <Stack.Screen name="verses" options={{ title: "श्लोक संपादन" }} />
      <Stack.Screen name="verse-edit/[id]" options={{ title: "श्लोक संपादित करा" }} />
      <Stack.Screen name="classes" options={{ title: "वर्ग" }} />
      <Stack.Screen name="quizzes" options={{ title: "प्रश्नमंजुषा" }} />
    </Stack>
  );
}
