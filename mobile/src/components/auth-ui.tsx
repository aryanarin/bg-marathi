import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme } from "@/lib/theme";

/** Shared field + brand header for the auth screens. */

export function AuthHeader({ subtitle }: { subtitle: string }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center", marginBottom: 28 }}>
      <Image
        source={require("../../assets/icon.png")}
        style={{ width: 72, height: 72, borderRadius: 36, marginBottom: 12 }}
      />
      <Text
        style={{ color: t.ink, fontSize: 24, fontWeight: "700" }}
      >
        श्रीमद्भगवद्गीता
      </Text>
      <Text
        style={{ color: t.inkMuted, fontSize: 14, marginTop: 4, textAlign: "center" }}
      >
        {subtitle}
      </Text>
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = "none",
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "words";
}) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{ color: t.inkMuted, fontSize: 13, marginBottom: 6, fontWeight: "600" }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.inkSubtle}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        style={{
          backgroundColor: t.surface,
          borderColor: t.rule,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 16,
          color: t.ink,
        }}
      />
    </View>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: t.canvas }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
