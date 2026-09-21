/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

// Mirrors the Boosta brand tokens in the web app's globals.css so the
// mobile app and website read as the same product.
export const Colors = {
  light: {
    text: "#181E2A",
    textSecondary: "#5B6472",
    background: "#F5F7FA",
    backgroundElement: "#EEF1F4",
    backgroundSelected: "#E4E8ED",
    card: "#FFFFFF",
    border: "#E4E8ED",
    primary: "#2E6BB0",
    primaryForeground: "#FFFFFF",
    brandCyan: "#17A3D8",
    brandTeal: "#6FD3DE",
    accent: "#EAF2FB",
    success: "#1FAE7A",
    warning: "#F5A623",
    destructive: "#E5484D",
  },
  dark: {
    text: "#F3F5F7",
    textSecondary: "#AEB6C2",
    background: "#0C1017",
    backgroundElement: "#1D2534",
    backgroundSelected: "#232B3D",
    card: "#151B27",
    border: "#2A3140",
    primary: "#3C7DC2",
    primaryForeground: "#FFFFFF",
    brandCyan: "#2FB4DE",
    brandTeal: "#6FD3DE",
    accent: "#1D2534",
    success: "#2BC48D",
    warning: "#F7B84B",
    destructive: "#F2555A",
  },
} as const;

/** The signature Boosta arrow gradient, used with expo-linear-gradient. */
export const BRAND_GRADIENT = ["#3C7DC2", "#17A3D8", "#6FD3DE"] as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
