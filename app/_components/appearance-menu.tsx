"use client";

import { useEffect, useRef, useState } from "react";
import { useAppearance } from "./appearance-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CloseIcon, MonitorIcon, MoonIcon, SlidersIcon, SunIcon } from "./icons";
import {
  FONT_LABELS,
  LANGUAGES,
  LANGUAGE_LABELS,
  MONO_FONTS,
  PRESET_LABELS,
  PRESET_SWATCHES,
  SANS_FONTS,
  THEME_PRESETS,
  type ColorMode,
} from "../_lib/theme";

const MODES: { value: ColorMode; icon: typeof SunIcon; key: "top.light" | "top.dark" | "top.system" }[] = [
  { value: "light", icon: SunIcon, key: "top.light" },
  { value: "dark", icon: MoonIcon, key: "top.dark" },
  { value: "system", icon: MonitorIcon, key: "top.system" },
];

export function AppearanceMenu() {
  const appearance = useAppearance();
  const { t } = appearance;
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click or Escape, and return focus to the trigger.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (
        !panelRef.current?.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const isDark =
    appearance.mode === "dark" ||
    (appearance.mode === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className="appearance-menu">
      <button
        ref={triggerRef}
        type="button"
        className="top-action"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("top.appearance")}
        onClick={() => setOpen((value) => !value)}
      >
        <SlidersIcon />
      </button>

      {open ? (
        <div
          ref={panelRef}
          className="appearance-panel"
          role="dialog"
          aria-label={t("top.appearance")}
        >
          <header>
            <strong>{t("top.appearance")}</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("top.close")}>
              <CloseIcon />
            </button>
          </header>

          <section>
            <p className="appearance-label">{t("top.mode")}</p>
            <div className="segmented">
              {MODES.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.value}
                    type="button"
                    data-active={appearance.mode === mode.value}
                    onClick={() => appearance.setMode(mode.value)}
                  >
                    <Icon />
                    <span>{t(mode.key)}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <p className="appearance-label">{t("top.theme")}</p>
            <div className="preset-grid">
              {THEME_PRESETS.map((preset) => {
                const swatches = PRESET_SWATCHES[preset][isDark ? "dark" : "light"];
                return (
                  <button
                    key={preset}
                    type="button"
                    className="preset-option"
                    data-active={appearance.preset === preset}
                    onClick={() => appearance.setPreset(preset)}
                  >
                    <span className="preset-swatches" aria-hidden="true">
                      {swatches.map((colour, index) => (
                        <i key={index} style={{ background: colour }} />
                      ))}
                    </span>
                    <span>{PRESET_LABELS[preset]}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <p className="appearance-label">{t("top.fontSans")}</p>
            <Select
              value={appearance.sans}
              onValueChange={(value) => appearance.setSans(value as typeof appearance.sans)}
            >
              <SelectTrigger className="w-full" aria-label={t("top.fontSans")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SANS_FONTS.map((font) => (
                  // Each option previews its own typeface, which is the only
                  // way to choose a font without applying it first.
                  <SelectItem key={font} value={font} style={{ fontFamily: `var(--font-${font})` }}>
                    {FONT_LABELS[font]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <section>
            <p className="appearance-label">{t("top.fontMono")}</p>
            <Select
              value={appearance.mono}
              onValueChange={(value) => appearance.setMono(value as typeof appearance.mono)}
            >
              <SelectTrigger className="w-full" aria-label={t("top.fontMono")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONO_FONTS.map((font) => (
                  <SelectItem key={font} value={font} style={{ fontFamily: `var(--font-${font})` }}>
                    {FONT_LABELS[font]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <section>
            <p className="appearance-label">{t("top.language")}</p>
            <div className="segmented">
              {LANGUAGES.map((language) => (
                <button
                  key={language}
                  type="button"
                  data-active={appearance.language === language}
                  onClick={() => appearance.setLanguage(language)}
                  lang={language}
                >
                  <span>{LANGUAGE_LABELS[language]}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
