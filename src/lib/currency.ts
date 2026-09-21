/**
 * Currency codes Boosta actually supports (Gulf + Egypt), mirrored from the
 * `countries` table seed. Kept as a small static map rather than a DB round
 * trip so any screen can format a price synchronously, and because ICU's
 * Arabic currency symbols aren't consistently available across runtimes.
 */
const CURRENCY_SYMBOLS: Record<string, { en: string; ar: string }> = {
  KWD: { en: "KWD", ar: "د.ك" },
  SAR: { en: "SAR", ar: "ر.س" },
  AED: { en: "AED", ar: "د.إ" },
  QAR: { en: "QAR", ar: "ر.ق" },
  BHD: { en: "BHD", ar: "د.ب" },
  OMR: { en: "OMR", ar: "ر.ع" },
  EGP: { en: "EGP", ar: "ج.م" },
  USD: { en: "USD", ar: "USD" },
};

/** Localized display symbol/code for a currency, e.g. "KWD" or "د.ك". */
export function currencySymbol(currencyCode: string, locale: string): string {
  const entry = CURRENCY_SYMBOLS[currencyCode];
  if (!entry) return currencyCode;
  return locale === "ar" ? entry.ar : entry.en;
}

/**
 * The number of fraction digits a currency conventionally uses (KWD/BHD/OMR
 * use 3; most others use 2), derived from Intl's ISO 4217 data rather than a
 * hardcoded list.
 */
function fractionDigits(currencyCode: string): number {
  try {
    return (
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
      }).resolvedOptions().maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

/** Format a bare amount (no currency symbol) with the currency's usual decimal places. */
export function formatAmount(amount: number, currencyCode: string): string {
  return amount.toFixed(fractionDigits(currencyCode));
}
