import { STORAGE_KEY } from "../_lib/theme";

/**
 * Applies the stored appearance before the first paint.
 *
 * Without this, every visitor who chose dark mode gets a white flash on each
 * navigation while React hydrates. It has to be inline and synchronous in
 * <head> for that reason — a component effect always runs too late.
 */
export function ThemeScript() {
  const script = `
(function () {
  try {
    var stored = JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)}) || "{}");
    var root = document.documentElement;
    var preset = stored.preset || "default";
    var mode = stored.mode || "system";
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = mode === "dark" || (mode === "system" && prefersDark);

    root.setAttribute("data-theme-preset", preset);
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
    root.setAttribute("data-font-sans", stored.sans || "geist");
    root.setAttribute("data-font-mono", stored.mono || "geist-mono");
    root.setAttribute("lang", stored.language || "en");
    if (stored.sidebarCollapsed) root.setAttribute("data-sidebar", "collapsed");
  } catch (e) {
    /* A blocked localStorage must not stop the page rendering. */
  }
})();
`.trim();

  return <script dangerouslySetInnerHTML={{ __html: script }} suppressHydrationWarning />;
}
