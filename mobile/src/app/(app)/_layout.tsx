import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/lib/auth";
import { Loading } from "@/components/ui";

export default function AppLayout() {
  const { initializing, session } = useAuth();

  if (initializing) return <Loading />;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chapter/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="verse/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="quiz/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="admin" />
    </Stack>
  );
}
