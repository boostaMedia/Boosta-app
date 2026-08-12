import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export interface City {
  id: string;
  nameEn: string;
  nameAr: string;
}

const cityRowSchema = z.object({
  id: z.string(),
  name_en: z.string(),
  name_ar: z.string(),
});

/**
 * Active cities, ordered for display. Plain read-only lookup — no business
 * logic, so this skips the repository/service split used by the domain
 * features.
 */
export async function listCities(): Promise<City[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cities")
    .select("id, name_en, name_ar")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return z
    .array(cityRowSchema)
    .parse(data ?? [])
    .map((row) => ({ id: row.id, nameEn: row.name_en, nameAr: row.name_ar }));
}
