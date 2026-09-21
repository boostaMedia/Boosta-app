import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

export default function BookingsScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <ThemedText type="title" style={styles.title}>
        Bookings
      </ThemedText>
      <View
        style={[
          styles.empty,
          { borderColor: theme.border, backgroundColor: theme.card },
        ]}
      >
        <ThemedText type="smallBold" style={styles.emptyTitle}>
          No bookings yet
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.emptySubtitle}>
          Once you book a service, it&apos;ll show up here.
        </ThemedText>
      </View>
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
  empty: {
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: { textAlign: "center", marginBottom: 4 },
  emptySubtitle: { textAlign: "center", fontSize: 13 },
});
