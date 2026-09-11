"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { useAppearance } from "./appearance-provider";
import { AppearanceMenu } from "./appearance-menu";
import { CommandPalette } from "./command-palette";
import { BriefIcon, MarketIcon, PanelIcon, SearchIcon, StocksIcon, WatchIcon, InsightIcon } from "./icons";
import type { TranslationKey } from "../_lib/i18n";

type ActiveRoute = "briefing" | "market" | "stocks" | "watchlist" | "insights";
type IconComponent = typeof BriefIcon;

const primaryRoutes: Array<{
  labelKey: TranslationKey;
  href: string;
  key: ActiveRoute;
  icon: IconComponent;
}> = [
  { labelKey: "nav.briefing", href: "/briefing", key: "briefing", icon: BriefIcon },
  { labelKey: "nav.market", href: "/", key: "market", icon: MarketIcon },
  { labelKey: "nav.stocks", href: "/stocks", key: "stocks", icon: StocksIcon },
];

const plannedRoutes: Array<{ labelKey: TranslationKey; key: ActiveRoute; icon: IconComponent }> = [
  { labelKey: "nav.watchlist", key: "watchlist", icon: WatchIcon },
  { labelKey: "nav.insights", key: "insights", icon: InsightIcon },
];

const subscribePlatform = () => () => {};
const platformShortcut = () => /Mac|iPhone|iPad/.test(navigator.platform ?? navigator.userAgent) ? "⌘ K" : "Ctrl K";
const serverShortcut = () => "Ctrl K";

export function AppShell({ children, active }: { children: ReactNode; active: ActiveRoute }) {
  const { t, sidebarCollapsed, toggleSidebar, setMode, mode } = useAppearance();
  const shortcutHint = useSyncExternalStore(subscribePlatform, platformShortcut, serverShortcut);

  // Shell-level shortcuts. The palette owns Cmd+K itself.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleSidebar();
      }
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        const isDark =
          mode === "dark" ||
          (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
        setMode(isDark ? "light" : "dark");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, setMode, toggleSidebar]);

  return (
    <div className="app-frame" data-collapsed={sidebarCollapsed}>
      <a className="skip-link" href="#main-content">
        {t("nav.skip")}
      </a>

      <aside className="sidebar" aria-label={t("nav.primary")}>
        <div className="sidebar-head">
          <Link className="brand" href="/" aria-label="RielVest">
            <span className="brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="brand-word">RielVest</span>
          </Link>
        </div>

        <nav className="nav-list">
          <p className="nav-group-label">{t("nav.research")}</p>
          {primaryRoutes.map((route) => {
            const label = t(route.labelKey);
            const Icon = route.icon;
            return (
              <Link
                className="nav-item"
                data-active={active === route.key}
                href={route.href}
                key={route.key}
                title={label}
              >
                <span className="nav-icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="nav-text">{label}</span>
              </Link>
            );
          })}

          <p className="nav-group-label nav-group-spaced">{t("nav.tools")}</p>
          {plannedRoutes.map((route) => {
            const label = t(route.labelKey);
            const Icon = route.icon;
            return (
              <span
                className="nav-item nav-item-planned"
                key={route.key}
                aria-disabled="true"
                title={`${label} — ${t("nav.later")}`}
              >
                <span className="nav-icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="nav-text">{label}</span>
                <span className="nav-badge">{t("nav.later")}</span>
              </span>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <div className="account-mark" aria-hidden="true">
            RV
          </div>
          <div className="nav-text account-detail">
            <strong>{t("account.guest")}</strong>
            <span>{t("account.mode")}</span>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="top-nav">
          <button
            type="button"
            className="top-action"
            onClick={toggleSidebar}
            aria-label={t("nav.toggleSidebar")}
            aria-pressed={sidebarCollapsed}
            title={`${t("nav.toggleSidebar")} (⌘B)`}
          >
            <PanelIcon />
          </button>

          <SearchTrigger hint={shortcutHint} label={t("top.search")} />

          <div className="top-actions">
            <AppearanceMenu />
          </div>
        </header>

        <main className="content" id="main-content">
          {children}
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}

/**
 * Opens the palette rather than being a field of its own.
 *
 * Two search boxes that behave differently is a worse experience than one that
 * always does the same thing, so this dispatches the same shortcut the keyboard
 * does instead of holding separate state.
 */
function SearchTrigger({ hint, label }: { hint: string; label: string }) {
  return (
    <button
      type="button"
      className="top-search"
      aria-label={label}
      onClick={() =>
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
        )
      }
    >
      <SearchIcon />
      <span>{label}</span>
      <kbd>{hint}</kbd>
    </button>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  meta?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <p className="page-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {meta ? <div className="page-meta">{meta}</div> : null}
    </header>
  );
}
