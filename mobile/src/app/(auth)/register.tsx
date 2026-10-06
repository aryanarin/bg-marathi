import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";

import { AuthHeader, AuthShell, Field } from "@/components/auth-ui";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export default function RegisterScreen() {
  const t = useTheme();
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setMessage(null);
    if (!fullName.trim() || !email.trim() || !password) {
      setError("कृपया सर्व माहिती भरा.");
      return;
    }
    if (password.length < 8) {
      setError("पासवर्ड किमान ८ अक्षरांचा हवा.");
      return;
    }
    setLoading(true);
    const { error, needsConfirmation } = await signUp(fullName, email, password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    if (needsConfirmation) {
      setMessage(
        "नोंदणी झाली! तुमच्या ईमेलवर पाठवलेल्या दुव्यावर क्लिक करून खाते सक्रिय करा, मग प्रवेश करा.",
      );
      return;
    }
    router.replace("/(app)/(tabs)/dashboard");
  }

  return (
    <AuthShell>
      <AuthHeader subtitle="नवीन खाते तयार करा" />

      <Field
        label="पूर्ण नाव"
        value={fullName}
        onChangeText={setFullName}
        placeholder="तुमचे नाव"
        autoCapitalize="words"
      />
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
        placeholder="किमान ८ अक्षरे"
        secureTextEntry
      />

      {error ? (
        <Text style={{ color: t.danger, marginBottom: 12, fontSize: 14 }}>
          {error}
        </Text>
      ) : null}
      {message ? (
        <Text style={{ color: t.success, marginBottom: 12, fontSize: 14 }}>
          {message}
        </Text>
      ) : null}

      <Button title="नोंदणी करा" onPress={onSubmit} loading={loading} />

      <View style={{ alignItems: "center", marginTop: 16 }}>
        <Link href="/(auth)/login" asChild>
          <Pressable>
            <Text style={{ color: t.inkMuted, fontSize: 14 }}>
              आधीच खाते आहे? <Text style={{ color: t.accent }}>प्रवेश करा</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </AuthShell>
  );
}
