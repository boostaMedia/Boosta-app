import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";

type Step = "request" | "verify";

export default function LoginScreen() {
  const theme = useTheme();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (otpError) {
      setError("Could not send the code. Please try again.");
      return;
    }
    setStep("verify");
  }

  async function verifyCode() {
    setError(null);
    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: "email",
    });
    setLoading(false);
    if (verifyError) {
      setError("That code is invalid or expired. Please try again.");
      return;
    }
    // AuthGate in the root layout picks up the new session and redirects.
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <Image
            source={require("@/assets/images/boosta-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="title" style={styles.title}>
            Sign in to Boosta
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            {step === "request"
              ? "Enter your email and we'll send you a one-time code."
              : `We sent a 6-digit code to ${email}.`}
          </ThemedText>

          {step === "request" ? (
            <>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                style={[
                  styles.input,
                  {
                    borderColor: theme.border,
                    color: theme.text,
                    backgroundColor: theme.card,
                  },
                ]}
              />
              {error && (
                <ThemedText themeColor="destructive" style={styles.error}>
                  {error}
                </ThemedText>
              )}
              <Pressable
                onPress={sendCode}
                disabled={loading || email.trim().length === 0}
                style={[
                  styles.button,
                  {
                    backgroundColor: theme.primary,
                    opacity: loading || !email ? 0.6 : 1,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={theme.primaryForeground} />
                ) : (
                  <ThemedText
                    style={{
                      color: theme.primaryForeground,
                      fontWeight: "700",
                    }}
                  >
                    Send code
                  </ThemedText>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <TextInput
                value={token}
                onChangeText={(t) => setToken(t.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                maxLength={6}
                style={[
                  styles.input,
                  {
                    borderColor: theme.border,
                    color: theme.text,
                    backgroundColor: theme.card,
                  },
                ]}
              />
              {error && (
                <ThemedText themeColor="destructive" style={styles.error}>
                  {error}
                </ThemedText>
              )}
              <Pressable
                onPress={verifyCode}
                disabled={loading || token.length !== 6}
                style={[
                  styles.button,
                  {
                    backgroundColor: theme.primary,
                    opacity: loading || token.length !== 6 ? 0.6 : 1,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={theme.primaryForeground} />
                ) : (
                  <ThemedText
                    style={{
                      color: theme.primaryForeground,
                      fontWeight: "700",
                    }}
                  >
                    Verify and continue
                  </ThemedText>
                )}
              </Pressable>
              <Pressable
                onPress={() => {
                  setStep("request");
                  setToken("");
                  setError(null);
                }}
                style={styles.linkButton}
              >
                <ThemedText themeColor="textSecondary" style={styles.linkText}>
                  Use a different email
                </ThemedText>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  logo: {
    width: 64,
    height: 64,
    alignSelf: "center",
    marginBottom: 8,
    borderRadius: 16,
  },
  title: { fontSize: 24, textAlign: "center", marginBottom: 4 },
  subtitle: { textAlign: "center", marginBottom: 20, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  error: { fontSize: 13, marginTop: -4 },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  linkButton: { alignItems: "center", paddingVertical: 12 },
  linkText: { fontSize: 13, textDecorationLine: "underline" },
});
