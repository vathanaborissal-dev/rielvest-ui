"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppearance } from "./appearance-provider";
import { SearchIcon } from "./icons";
import { StockAvatar } from "./stock-avatar";
import { formatNumber } from "../_lib/format";
import { PAGE_COMMANDS, SYMBOL_ALIASES, scoreCommand, type CommandItem } from "../_lib/search-index";
import {
  FONT_LABELS,
  LANGUAGE_LABELS,
  PRESET_LABELS,
  SANS_FONTS,
  THEME_PRESETS,
} from "../_lib/theme";
import type { CompanyListItem } from "../_lib/types";

const API_BASE = (process.env.NEXT_PUBLIC_RIELVEST_API_URL ?? "http://localhost:4000/api").replace(
  /\/$/,
  "",
);

interface RunnableCommand extends CommandItem {
  run: () => void;
  /** Formatted price, shown on the right of a symbol row. */
  trailing?: string;
  /** Percentage move, used for colour. */
  change?: number | null;
}

const GROUP_ORDER: CommandItem["kind"][] = ["symbol", "page", "action", "setting"];

const GROUP_LABEL: Record<CommandItem["kind"], { en: string; km: string }> = {
  symbol: { en: "Companies", km: "ក្រុមហ៊ុន" },
  page: { en: "Go to", km: "ទៅកាន់" },
  action: { en: "Actions", km: "សកម្មភាព" },
  setting: { en: "Appearance", km: "រូបរាង" },
};

export function CommandPalette() {
  const router = useRouter();
  const appearance = useAppearance();
  const { language, t } = appearance;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Cmd+K / Ctrl+K anywhere, and "/" when not already typing in a field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable === true;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setQuery("");
        setActive(0);
        setOpen((value) => !value);
        return;
      }
      if (event.key === "/" && !typing && !open) {
        event.preventDefault();
        setQuery("");
        setActive(0);
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // The company list is small enough to hold entirely, so search stays instant
  // and keeps working if the API goes away mid-session.
  useEffect(() => {
    if (!open || companies.length > 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`${API_BASE}/companies`);
        if (!response.ok) return;
        const body = (await response.json()) as { companies: CompanyListItem[] };
        if (!cancelled) setCompanies(body.companies ?? []);
      } catch {
        // Navigation and settings still work without prices.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, companies.length]);

  useEffect(() => {
    if (open) {
      // Focus after paint so the dialog is in the accessibility tree first.
      const frame = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  const commands = useMemo<RunnableCommand[]>(() => {
    const go = (href: string) => () => {
      router.push(href);
      close();
    };

    const pages: RunnableCommand[] = PAGE_COMMANDS(t as never, language).map((item) => ({
      ...item,
      run: go(item.href!),
    }));

    const symbols: RunnableCommand[] = companies.map((company) => ({
      id: `symbol-${company.symbol}`,
      kind: "symbol",
      label: company.symbol,
      hint: company.name,
      keywords: [
        company.name,
        company.sector ?? "",
        ...(SYMBOL_ALIASES[company.symbol] ?? []),
      ].filter(Boolean),
      href: `/stocks/${company.symbol}`,
      trailing: company.close !== null ? `${formatNumber(company.close)} KHR` : undefined,
      change: company.changePercent,
      run: go(`/stocks/${company.symbol}`),
    }));

    const settings: RunnableCommand[] = [
      ...THEME_PRESETS.map<RunnableCommand>((preset) => ({
        id: `preset-${preset}`,
        kind: "setting",
        label: `${language === "km" ? "ផ្ទាំងពណ៌" : "Theme"}: ${PRESET_LABELS[preset]}`,
        keywords: ["theme", "preset", preset, "ផ្ទាំងពណ៌"],
        badge: appearance.preset === preset ? "✓" : undefined,
        run: () => {
          appearance.setPreset(preset);
          close();
        },
      })),
      {
        id: "mode-toggle",
        kind: "setting",
        label: language === "km" ? "ប្ដូរពន្លឺ/ងងឹត" : "Toggle light / dark",
        keywords: ["dark", "light", "mode", "theme", "ងងឹត", "ភ្លឺ"],
        badge: "⇧⌘L",
        run: () => {
          const isDark =
            appearance.mode === "dark" ||
            (appearance.mode === "system" &&
              window.matchMedia("(prefers-color-scheme: dark)").matches);
          appearance.setMode(isDark ? "light" : "dark");
          close();
        },
      },
      {
        id: "language-toggle",
        kind: "setting",
        label: `${language === "km" ? "ភាសា" : "Language"}: ${LANGUAGE_LABELS[language === "en" ? "km" : "en"]}`,
        keywords: ["language", "khmer", "english", "ភាសា", "ខ្មែរ", "អង់គ្លេស"],
        run: () => {
          appearance.setLanguage(language === "en" ? "km" : "en");
          close();
        },
      },
      ...SANS_FONTS.map<RunnableCommand>((font) => ({
        id: `font-${font}`,
        kind: "setting",
        label: `${language === "km" ? "ពុម្ពអក្សរ" : "Font"}: ${FONT_LABELS[font]}`,
        keywords: ["font", "typeface", FONT_LABELS[font], "ពុម្ពអក្សរ"],
        badge: appearance.sans === font ? "✓" : undefined,
        run: () => {
          appearance.setSans(font);
          close();
        },
      })),
    ];

    const actions: RunnableCommand[] = [
      {
        id: "action-sidebar",
        kind: "action",
        label: language === "km" ? "បិទ/បើក របារចំហៀង" : "Toggle sidebar",
        keywords: ["sidebar", "collapse", "menu", "របារ"],
        badge: "⌘B",
        run: () => {
          appearance.toggleSidebar();
          close();
        },
      },
    ];

    return [...symbols, ...pages, ...actions, ...settings];
  }, [appearance, close, companies, language, router, t]);

  const results = useMemo(() => {
    const scored = commands
      .map((command) => ({ command, score: scoreCommand(command, query) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    // With an empty query, show a useful starting set rather than everything.
    return query.trim() ? scored.slice(0, 24) : scored.filter((entry) => entry.command.kind !== "setting").slice(0, 12);
  }, [commands, query]);

  const grouped = useMemo(() => {
    const groups = new Map<CommandItem["kind"], RunnableCommand[]>();
    for (const entry of results) {
      const list = groups.get(entry.command.kind) ?? [];
      list.push(entry.command);
      groups.set(entry.command.kind, list);
    }
    return GROUP_ORDER.filter((kind) => groups.has(kind)).map((kind) => ({
      kind,
      items: groups.get(kind)!,
    }));
  }, [results]);

  // A flat list mirrors what the arrow keys walk through.
  const flat = useMemo(() => grouped.flatMap((group) => group.items), [grouped]);

  // Clamp during render so keyboard selection always matches the visible list.
  if (active >= flat.length && active !== 0) setActive(0);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % Math.max(flat.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + flat.length) % Math.max(flat.length, 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      flat[active]?.run();
    }
  };

  return (
    <div className="palette-backdrop" role="presentation" onMouseDown={close}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label={t("top.search")}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="palette-input">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            placeholder={
              language === "km"
                ? "ស្វែងរកភាគហ៊ុន ទំព័រ ឬការកំណត់…"
                : "Search stocks, pages or settings…"
            }
            aria-label={t("top.search")}
            aria-controls="palette-results"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd>esc</kbd>
        </div>

        <div className="palette-results" id="palette-results" ref={listRef} role="listbox">
          {flat.length === 0 ? (
            <p className="palette-empty">
              {language === "km"
                ? `រកមិនឃើញលទ្ធផលសម្រាប់ “${query}”`
                : `Nothing matches “${query}”`}
            </p>
          ) : (
            grouped.map((group) => (
              <section key={group.kind}>
                <p className="palette-group">{GROUP_LABEL[group.kind][language]}</p>
                {group.items.map((command) => {
                  const index = flat.indexOf(command);
                  return (
                    <button
                      key={command.id}
                      type="button"
                      className="palette-row"
                      data-index={index}
                      data-active={index === active}
                      role="option"
                      aria-selected={index === active}
                      onMouseMove={() => setActive(index)}
                      onClick={command.run}
                    >
                      {command.kind === "symbol" ? (
                        <StockAvatar symbol={command.label} size={26} />
                      ) : null}
                      <span className="palette-row-main">
                        <strong>{command.label}</strong>
                        {command.hint ? <span>{command.hint}</span> : null}
                      </span>
                      {command.trailing ? (
                        <span
                          className="palette-row-price"
                          data-direction={
                            command.change == null ? "flat" : command.change > 0 ? "up" : command.change < 0 ? "down" : "flat"
                          }
                        >
                          {command.trailing}
                        </span>
                      ) : null}
                      {command.badge ? <kbd>{command.badge}</kbd> : null}
                    </button>
                  );
                })}
              </section>
            ))
          )}
        </div>

        <footer className="palette-foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> {language === "km" ? "ផ្លាស់ទី" : "navigate"}
          </span>
          <span>
            <kbd>↵</kbd> {language === "km" ? "បើក" : "open"}
          </span>
          <span>
            <kbd>⌘</kbd>
            <kbd>K</kbd> {language === "km" ? "បិទ/បើក" : "toggle"}
          </span>
        </footer>
      </div>
    </div>
  );
}
