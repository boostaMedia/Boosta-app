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
