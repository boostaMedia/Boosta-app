/**
 * Boosta service categories. Keys map to `customerHome.cat.<key>` translation
 * keys. Emoji are placeholder icons — swap for brand imagery later.
 */
export const CATEGORY_KEYS = [
  "content",
  "photoVideo",
  "aiVideo",
  "marketing",
  "adPublishing",
  "appsWeb",
  "consulting",
  "jobs",
  "management",
  "legal",
  "licensing",
  "accounting",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const CATEGORY_EMOJI: Record<CategoryKey, string> = {
  content: "✍️",
  photoVideo: "📸",
  aiVideo: "🤖",
  marketing: "📣",
  adPublishing: "📺",
  appsWeb: "💻",
  consulting: "🎓",
  jobs: "💼",
  management: "👥",
  legal: "⚖️",
  licensing: "📜",
  accounting: "📊",
};

export const CATEGORY_ITEMS = CATEGORY_KEYS.map((key) => ({
  key,
  emoji: CATEGORY_EMOJI[key],
}));
