"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { translate, type TranslationKey } from "../_lib/i18n";
import {
  DEFAULT_APPEARANCE,
  STORAGE_KEY,
  type Appearance,
  type ColorMode,
  type Language,
  type MonoFont,
  type SansFont,
  type ThemePreset,
} from "../_lib/theme";

interface AppearanceContextValue extends Appearance {
  /** True once the stored preference has been read, so UI can avoid flicker. */
  ready: boolean;
  setPreset: (preset: ThemePreset) => void;
  setMode: (mode: ColorMode) => void;
  setSans: (font: SansFont) => void;
  setMono: (font: MonoFont) => void;
  setLanguage: (language: Language) => void;
  toggleSidebar: () => void;
  t: (key: TranslationKey) => string;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function readStored(): Appearance {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_APPEARANCE, ...(JSON.parse(raw) as Partial<Appearance>) } : DEFAULT_APPEARANCE;
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  // Start from the defaults so the server and the first client render agree;
  // the inline boot script has already painted the real theme, and the effect
  // below reconciles React's state with it.
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setAppearance(readStored());
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Reflect state onto <html> so the CSS, and anything reading the DOM, agree.
  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = appearance.mode === "dark" || (appearance.mode === "system" && prefersDark);

    root.setAttribute("data-theme-preset", appearance.preset);
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
    root.setAttribute("data-font-sans", appearance.sans);
    root.setAttribute("data-font-mono", appearance.mono);
    root.setAttribute("lang", appearance.language);
    if (appearance.sidebarCollapsed) root.setAttribute("data-sidebar", "collapsed");
    else root.removeAttribute("data-sidebar");

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
    } catch {
      /* Private browsing can refuse storage; the session still works. */
    }
  }, [appearance, ready]);

  // Follow the operating system while the mode is "system".
  useEffect(() => {
    if (appearance.mode !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.classList.toggle("dark", query.matches);
      document.documentElement.style.colorScheme = query.matches ? "dark" : "light";
    };
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [appearance.mode]);

  const update = useCallback(
    (patch: Partial<Appearance>) => setAppearance((current) => ({ ...current, ...patch })),
    [],
  );

  const value = useMemo<AppearanceContextValue>(
    () => ({
      ...appearance,
      ready,
      setPreset: (preset) => update({ preset }),
      setMode: (mode) => update({ mode }),
      setSans: (sans) => update({ sans }),
      setMono: (mono) => update({ mono }),
      setLanguage: (language) => update({ language }),
      toggleSidebar: () =>
        setAppearance((current) => ({ ...current, sidebarCollapsed: !current.sidebarCollapsed })),
      t: (key) => translate(appearance.language, key),
    }),
    [appearance, ready, update],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error("useAppearance must be used inside AppearanceProvider");
  return context;
}
