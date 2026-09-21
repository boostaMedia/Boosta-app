import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export default function AccountScreen() {
  const theme = useTheme();
  const { session } = useAuth();

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <ThemedText type="title" style={styles.title}>
        Account
      </ThemedText>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.avatarText}>
            {(session?.user.email ?? "?").charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.identity}>
          <ThemedText type="smallBold">
            {session?.user.email ?? "Boosta user"}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.role}>
            Signed in
          </ThemedText>
        </View>
      </View>

      <Pressable
        onPress={() => supabase.auth.signOut()}
        style={[styles.signOut, { borderColor: theme.destructive }]}
      >
        <ThemedText themeColor="destructive" style={styles.signOutText}>
          Sign out
        </ThemedText>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  title: {
    fontSize: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  identity: { flex: 1 },
  role: { fontSize: 12, marginTop: 2 },
  signOut: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: { fontWeight: "700", fontSize: 14 },
});
