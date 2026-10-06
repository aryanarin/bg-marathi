import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";

import { AuthHeader, AuthShell, Field } from "@/components/auth-ui";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export default function ForgotPasswordScreen() {
  const t = useTheme();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setMessage(null);
    if (!email.trim()) {
      setError("कृपया तुमचा ईमेल भरा.");
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    setMessage(
      "पासवर्ड बदलण्याचा दुवा तुमच्या ईमेलवर पाठवला आहे. तो उघडून नवीन पासवर्ड ठरवा.",
    );
  }

  return (
    <AuthShell>
      <AuthHeader subtitle="पासवर्ड पुन्हा सेट करा" />

      <Field
        label="ईमेल"
        value={email}
        onChangeText={setEmail}
        placeholder="तुमचा ईमेल"
        keyboardType="email-address"
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

      <Button title="दुवा पाठवा" onPress={onSubmit} loading={loading} />

      <View style={{ alignItems: "center", marginTop: 16 }}>
        <Link href="/(auth)/login" asChild>
          <Pressable>
            <Text style={{ color: t.accent, fontSize: 14 }}>
              प्रवेश करा
            </Text>
          </Pressable>
        </Link>
      </View>
    </AuthShell>
  );
}
