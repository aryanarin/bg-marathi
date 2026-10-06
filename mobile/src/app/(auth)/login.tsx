import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";

import { AuthHeader, AuthShell, Field } from "@/components/auth-ui";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export default function LoginScreen() {
  const t = useTheme();
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError("कृपया ईमेल आणि पासवर्ड भरा.");
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError("ईमेल किंवा पासवर्ड चुकीचा आहे.");
      return;
    }
    router.replace("/(app)/(tabs)/dashboard");
  }

  return (
    <AuthShell>
      <AuthHeader subtitle="श्लोक वाचा, समजून घ्या, आणि मनन करा" />

      <Field
        label="ईमेल"
        value={email}
        onChangeText={setEmail}
        placeholder="तुमचा ईमेल"
        keyboardType="email-address"
      />
      <Field
        label="पासवर्ड"
        value={password}
        onChangeText={setPassword}
        placeholder="तुमचा पासवर्ड"
        secureTextEntry
      />

      {error ? (
        <Text style={{ color: t.danger, marginBottom: 12, fontSize: 14 }}>
          {error}
        </Text>
      ) : null}

      <Button title="प्रवेश करा" onPress={onSubmit} loading={loading} />

      <View style={{ alignItems: "center", marginTop: 16, gap: 10 }}>
        <Link href="/(auth)/forgot-password" asChild>
          <Pressable>
            <Text style={{ color: t.accent, fontSize: 14 }}>
              पासवर्ड विसरलात?
            </Text>
          </Pressable>
        </Link>
        <Link href="/(auth)/register" asChild>
          <Pressable>
            <Text style={{ color: t.inkMuted, fontSize: 14 }}>
              नवीन खाते? <Text style={{ color: t.accent }}>नोंदणी करा</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </AuthShell>
  );
}
