import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";

type Category = {
  id: string;
  nameEn: string;
  descriptionEn: string | null;
};

export default function CategoriesScreen() {
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name_en, description_en")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setCategories(
            data.map((c) => ({
              id: c.id,
              nameEn: c.name_en,
              descriptionEn: c.description_en,
            })),
          );
        }
        setLoading(false);
      });
  }, []);

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <ThemedText type="title" style={styles.title}>
        Categories
      </ThemedText>
      {loading ? (
        <ActivityIndicator color={theme.primary} style={styles.spinner} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View
              style={[
                styles.row,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <ThemedText type="smallBold">{item.nameEn}</ThemedText>
              {item.descriptionEn && (
                <ThemedText
                  themeColor="textSecondary"
                  style={styles.rowSubtitle}
                >
                  {item.descriptionEn}
                </ThemedText>
              )}
            </View>
          )}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              No categories yet.
            </ThemedText>
          }
        />
      )}
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
  spinner: { marginTop: 24 },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  row: { borderRadius: 16, borderWidth: 1, padding: 16 },
  rowSubtitle: { marginTop: 4, fontSize: 13 },
  empty: { textAlign: "center", marginTop: 24 },
});
