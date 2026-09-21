import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export interface City {
  id: string;
  nameEn: string;
  nameAr: string;
  countryId: string | null;
}

const cityRowSchema = z.object({
  id: z.string(),
  name_en: z.string(),
  name_ar: z.string(),
  country_id: z.string().nullable(),
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
    .select("id, name_en, name_ar, country_id")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return z
    .array(cityRowSchema)
    .parse(data ?? [])
    .map((row) => ({
      id: row.id,
      nameEn: row.name_en,
      nameAr: row.name_ar,
      countryId: row.country_id,
    }));
}

export interface Country {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  currencyCode: string;
  currencySymbolEn: string;
  currencySymbolAr: string;
}

const countryRowSchema = z.object({
  id: z.string(),
  code: z.string(),
  name_en: z.string(),
  name_ar: z.string(),
  currency_code: z.string(),
  currency_symbol_en: z.string(),
  currency_symbol_ar: z.string(),
});

/** Active countries (Gulf + Egypt), ordered for display. */
export async function listCountries(): Promise<Country[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("countries")
    .select(
      "id, code, name_en, name_ar, currency_code, currency_symbol_en, currency_symbol_ar",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return z
    .array(countryRowSchema)
    .parse(data ?? [])
    .map((row) => ({
      id: row.id,
      code: row.code,
      nameEn: row.name_en,
      nameAr: row.name_ar,
      currencyCode: row.currency_code,
      currencySymbolEn: row.currency_symbol_en,
      currencySymbolAr: row.currency_symbol_ar,
    }));
}
