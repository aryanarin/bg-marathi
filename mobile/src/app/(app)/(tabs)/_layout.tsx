import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/lib/theme";

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.canvas },
        headerTitleStyle: { color: t.ink },
        headerTintColor: t.ink,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.inkSubtle,
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor: t.rule,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "मुख्यपृष्ठ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chapters"
        options={{
          title: "अध्याय",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "प्रगती",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quizzes"
        options={{
          title: "प्रश्नमंजुषा",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="help-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: "वर्ग",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="videocam-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
