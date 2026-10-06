import { Stack } from "expo-router";

export default function AppLayout() {
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
