/** Theme presets, font choices and language, shared by the provider and the boot script. */

export const THEME_PRESETS = ["default", "brutalist", "soft-pop", "tangerine"] as const;
export type ThemePreset = (typeof THEME_PRESETS)[number];

export const PRESET_LABELS: Record<ThemePreset, string> = {
  default: "Default",
  brutalist: "Brutalist",
  "soft-pop": "Soft Pop",
  tangerine: "Tangerine",
};

/** Swatches for the preset picker: [background, surface, primary]. */
export const PRESET_SWATCHES: Record<ThemePreset, { light: string[]; dark: string[] }> = {
  default: { light: ["#ffffff", "#f5f5f5", "#171717"], dark: ["#0a0a0a", "#262626", "#e5e5e5"] },
  brutalist: { light: ["#ffffff", "#ffff02", "#ff3333"], dark: ["#000000", "#ffff34", "#ff6666"] },
  "soft-pop": { light: ["#f7f9f3", "#14b8a6", "#4f46e5"], dark: ["#000000", "#2dd4bf", "#818cf8"] },
  tangerine: { light: ["#ebebeb", "#d7e3ee", "#df5e3a"], dark: ["#1c2433", "#2a3657", "#df5e3a"] },
};

export type ColorMode = "light" | "dark" | "system";

export const SANS_FONTS = [
  "geist",
  "inter",
  "outfit",
  "dm-sans",
  "nunito-sans",
  "figtree",
  "raleway",
  "public-sans",
  "noto-sans",
  "roboto",
] as const;
export type SansFont = (typeof SANS_FONTS)[number];

export const MONO_FONTS = ["geist-mono", "jetbrains-mono"] as const;
export type MonoFont = (typeof MONO_FONTS)[number];

export const FONT_LABELS: Record<SansFont | MonoFont, string> = {
  geist: "Geist",
  inter: "Inter",
  outfit: "Outfit",
  "dm-sans": "DM Sans",
  "nunito-sans": "Nunito Sans",
  figtree: "Figtree",
  raleway: "Raleway",
  "public-sans": "Public Sans",
  "noto-sans": "Noto Sans",
  roboto: "Roboto",
  "geist-mono": "Geist Mono",
  "jetbrains-mono": "JetBrains Mono",
};

export const LANGUAGES = ["en", "km"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  km: "ភាសាខ្មែរ",
};

export interface Appearance {
  preset: ThemePreset;
  mode: ColorMode;
  sans: SansFont;
  mono: MonoFont;
  language: Language;
  sidebarCollapsed: boolean;
}

export const DEFAULT_APPEARANCE: Appearance = {
  preset: "default",
  mode: "system",
  sans: "geist",
  mono: "geist-mono",
  language: "en",
  sidebarCollapsed: false,
};

export const STORAGE_KEY = "rielvest.appearance";
