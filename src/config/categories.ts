import {
  Briefcase,
  Calculator,
  Camera,
  FileCheck,
  GraduationCap,
  Laptop,
  type LucideIcon,
  Megaphone,
  Monitor,
  PenTool,
  Scale,
  Shapes,
  Sparkles,
  Users,
} from "lucide-react";

/**
 * Boosta service categories. Keys map to `customerHome.cat.<key>` translation
 * keys. Icons are brand-aligned line icons (swap for custom brand artwork by
 * replacing the icon here — a single source of truth).
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

export const CATEGORY_ICONS: Record<CategoryKey, LucideIcon> = {
  content: PenTool,
  photoVideo: Camera,
  aiVideo: Sparkles,
  marketing: Megaphone,
  adPublishing: Monitor,
  appsWeb: Laptop,
  consulting: GraduationCap,
  jobs: Briefcase,
  management: Users,
  legal: Scale,
  licensing: FileCheck,
  accounting: Calculator,
};

export const CATEGORY_ITEMS = CATEGORY_KEYS.map((key) => ({
  key,
  Icon: CATEGORY_ICONS[key],
}));

/**
 * Maps the `icon` slug stored on each `categories` row in the database
 * (kebab-case, e.g. `"pen-tool"`) to its brand line icon. Keeping this beside
 * the static config means DB-driven and config-driven screens resolve icons
 * from a single source of truth.
 */
export const CATEGORY_ICON_BY_SLUG: Record<string, LucideIcon> = {
  "pen-tool": PenTool,
  camera: Camera,
  sparkles: Sparkles,
  megaphone: Megaphone,
  monitor: Monitor,
  laptop: Laptop,
  "graduation-cap": GraduationCap,
  briefcase: Briefcase,
  users: Users,
  scale: Scale,
  "file-check": FileCheck,
  calculator: Calculator,
};

/** Resolve a DB `icon` value to a Lucide component, with a neutral fallback. */
export function resolveCategoryIcon(
  icon: string | null | undefined,
): LucideIcon {
  return (icon ? CATEGORY_ICON_BY_SLUG[icon] : undefined) ?? Shapes;
}
