/**
 * Small reusable UI primitives, themed. Keeps screen code declarative.
 */
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
} from "react-native";

import { useTheme } from "@/lib/theme";

export function Screen({
  children,
  padded = true,
}: {
  children: React.ReactNode;
  padded?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.canvas,
        padding: padded ? 16 : 0,
      }}
    >
      {children}
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.surface,
          borderColor: t.rule,
          borderWidth: 1,
          borderRadius: 12,
          padding: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
} & Omit<PressableProps, "onPress" | "style">) {
  const t = useTheme();
  const bg =
    variant === "primary"
      ? t.accent
      : variant === "secondary"
        ? t.accentSoft
        : "transparent";
  const fg =
    variant === "primary"
      ? "#ffffff"
      : variant === "secondary"
        ? t.accent
        : t.inkMuted;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          borderRadius: 10,
          paddingVertical: 13,
          paddingHorizontal: 18,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: t.rule,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={{ color: fg, fontSize: 16, fontWeight: "600" }}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Loading() {
  const t = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: t.canvas,
      }}
    >
      <ActivityIndicator size="large" color={t.accent} />
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center", justifyContent: "center", padding: 32 }}>
      <Text
        style={{ color: t.inkSubtle, fontSize: 15, textAlign: "center" }}
      >
        {message}
      </Text>
    </View>
  );
}

export function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "accent";
}) {
  const t = useTheme();
  const colors =
    tone === "success"
      ? { bg: t.success, fg: "#ffffff" }
      : tone === "accent"
        ? { bg: t.accentSoft, fg: t.accent }
        : { bg: t.surfaceAlt, fg: t.inkMuted };
  return (
    <View
      style={{
        backgroundColor: colors.bg,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 3,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: colors.fg, fontSize: 12, fontWeight: "600" }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({});
export { styles };
