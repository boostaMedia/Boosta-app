import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";

type Category = {
  id: string;
  nameEn: string;
  icon: string | null;
};

export default function HomeScreen() {
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name_en, icon")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setCategories(
        data.map((c) => ({ id: c.id, nameEn: c.name_en, icon: c.icon })),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ThemedText type="title" style={styles.title}>
          Boosta
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Media & marketing services, on demand.
        </ThemedText>

        <View style={[styles.promo, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.promoTitle}>
            20% off your first booking
          </ThemedText>
          <ThemedText style={styles.promoSubtitle}>
            Use code BOOSTA20
          </ThemedText>
        </View>

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Categories
        </ThemedText>

        {loading ? (
          <ActivityIndicator color={theme.primary} style={styles.spinner} />
        ) : categories.length === 0 ? (
          <EmptyCard
            title="No categories yet"
            subtitle="Categories will show up here once they're added."
          />
        ) : (
          <View style={styles.categoryGrid}>
            {categories.map((c) => (
              <View
                key={c.id}
                style={[
                  styles.categoryChip,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <ThemedText style={styles.categoryLabel}>{c.nameEn}</ThemedText>
              </View>
            ))}
          </View>
        )}

        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Top rated near you
        </ThemedText>
        <EmptyCard
          title="New here — services are on their way"
          subtitle="Providers are joining Boosta. Check back soon for top-rated services."
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyCard({ title, subtitle }: { title: string; subtitle: string }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.emptyCard,
        { borderColor: theme.border, backgroundColor: theme.card },
      ]}
    >
      <ThemedText type="smallBold" style={styles.emptyTitle}>
        {title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.emptySubtitle}>
        {subtitle}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, gap: 8, paddingBottom: 40 },
  title: { fontSize: 28 },
  subtitle: { marginBottom: 16 },
  promo: { borderRadius: 20, padding: 20, marginBottom: 24 },
  promoTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  promoSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14 },
  sectionTitle: { fontSize: 15, marginBottom: 12, marginTop: 8 },
  spinner: { marginVertical: 20 },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  categoryLabel: { fontSize: 13, fontWeight: "600" },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: { textAlign: "center", marginBottom: 4 },
  emptySubtitle: { textAlign: "center", fontSize: 13 },
});
