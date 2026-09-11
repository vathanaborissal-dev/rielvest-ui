import type { Language } from "./theme";

/**
 * What the command palette can find.
 *
 * The list is deliberately small and hand-built rather than crawled: on a
 * twelve-stock exchange the useful search space is a few dozen destinations,
 * and a curated index means a Khmer speaker can find "ភាគហ៊ុន" and an English
 * speaker "stocks" without either query needing a translation layer.
 */

export type CommandKind = "page" | "symbol" | "action" | "setting";

export interface CommandItem {
  id: string;
  kind: CommandKind;
  /** Shown as the row title. */
  label: string;
  /** Secondary line: a company's full name, or what an action does. */
  hint?: string;
  /** Extra terms that should match, including Khmer and common misspellings. */
  keywords?: string[];
  href?: string;
  /** Rendered on the right, e.g. a keyboard shortcut. */
  badge?: string;
}

export const PAGE_COMMANDS = (t: (key: never) => string, language: Language): CommandItem[] => {
  void t;
  const km = language === "km";
  return [
    {
      id: "page-briefing",
      kind: "page",
      label: km ? "សេចក្ដីសង្ខេបថ្ងៃនេះ" : "Today's brief",
      hint: km ? "អ្វីដែលត្រូវសម្រេចចិត្តមុនបើកទីផ្សារ" : "What needs a decision before the bell",
      keywords: ["brief", "briefing", "today", "morning", "សេចក្ដីសង្ខេប", "ថ្ងៃនេះ"],
      href: "/briefing",
      badge: "G then B",
    },
    {
      id: "page-market",
      kind: "page",
      label: km ? "ទីផ្សារ" : "Market",
      hint: km ? "ទិដ្ឋភាពរួមនៃវេនជួញដូរចុងក្រោយ" : "Overview of the latest CSX session",
      keywords: ["market", "index", "csx", "overview", "ទីផ្សារ", "សន្ទស្សន៍"],
      href: "/",
      badge: "G then M",
    },
    {
      id: "page-stocks",
      kind: "page",
      label: km ? "ភាគហ៊ុន" : "Stocks",
      hint: km ? "ក្រុមហ៊ុនចុះបញ្ជីទាំងអស់" : "Every listed company",
      keywords: ["stocks", "companies", "explorer", "list", "ភាគហ៊ុន", "ក្រុមហ៊ុន"],
      href: "/stocks",
      badge: "G then S",
    },
  ];
};

/** Company aliases so a search finds a stock by any name people use for it. */
export const SYMBOL_ALIASES: Record<string, string[]> = {
  ABC: ["acleda", "bank", "អេស៊ីលីដា", "ធនាគារ"],
  PWSA: ["water", "phnom penh water", "ppwsa", "ទឹក", "រ.ទ.ស.ភ"],
  PPAP: ["port", "phnom penh port", "autonomous", "កំពង់ផែ"],
  PAS: ["sihanoukville", "port", "deep sea", "ក្រុង​ព្រះសីហនុ"],
  PPSP: ["sez", "special economic zone", "តំបន់សេដ្ឋកិច្ចពិសេស"],
  GTI: ["grand twins", "garment", "apparel", "សម្លៀកបំពាក់"],
  PEPC: ["pestech", "power", "electricity", "អគ្គិសនី"],
  CGSM: ["camgsm", "cellcard", "telecom", "mobile", "ទូរស័ព្ទ"],
  MJQE: ["mengly", "quach", "education", "school", "អប់រំ"],
  DBDE: ["dbd", "engineering", "វិស្វកម្ម"],
  JSL: ["js land", "property", "real estate", "អចលនទ្រព្យ"],
  PCG: ["picasso", "city garden", "property", "អចលនទ្រព្យ"],
};

/**
 * Scores a candidate against a query.
 *
 * Ranking rules, in order: an exact ticker beats everything (typing "PAS"
 * should not first offer "Phnom Penh"), then a label that starts with the
 * query, then any substring. Returning 0 means no match.
 */
export function scoreCommand(item: CommandItem, query: string): number {
  const needle = query.trim().toLowerCase();
  if (!needle) return 1;

  const label = item.label.toLowerCase();
  const hint = (item.hint ?? "").toLowerCase();
  const keywords = (item.keywords ?? []).map((word) => word.toLowerCase());

  if (item.kind === "symbol" && label === needle) return 1000;
  if (label === needle) return 900;
  if (label.startsWith(needle)) return 800 - label.length;
  if (keywords.some((word) => word === needle)) return 700;
  if (keywords.some((word) => word.startsWith(needle))) return 600;
  if (label.includes(needle)) return 500 - label.indexOf(needle);
  if (keywords.some((word) => word.includes(needle))) return 400;
  if (hint.includes(needle)) return 300;

  // Subsequence match, so "ppap" still finds "Phnom Penh Autonomous Port".
  let cursor = 0;
  for (const character of needle) {
    cursor = label.indexOf(character, cursor);
    if (cursor === -1) return 0;
    cursor += 1;
  }
  return 100;
}
