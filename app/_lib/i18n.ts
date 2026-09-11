import type { Language } from "./theme";

/**
 * Interface copy in English and Khmer.
 *
 * Only the application's own chrome is translated. Market figures, company
 * names and disclosure titles are reproduced exactly as CSX and the Ministry of
 * Economy and Finance publish them — translating a filing title would put words
 * in an issuer's mouth, and RielVest's whole claim is that what it shows is
 * what the source said.
 */
export const dictionary = {
  en: {
    "nav.research": "Research",
    "nav.tools": "Tools",
    "nav.briefing": "Today's brief",
    "nav.market": "Market",
    "nav.stocks": "Stocks",
    "nav.watchlist": "Watchlist",
    "nav.insights": "Insights",
    "nav.later": "Later",
    "nav.toggleSidebar": "Toggle sidebar",
    "nav.primary": "Primary navigation",
    "nav.skip": "Skip to content",

    "top.search": "Search companies",
    "top.searchShort": "Search",
    "top.appearance": "Appearance",
    "top.language": "Language",
    "top.theme": "Theme",
    "top.mode": "Colour mode",
    "top.light": "Light",
    "top.dark": "Dark",
    "top.system": "System",
    "top.fontSans": "Interface font",
    "top.fontMono": "Figures font",
    "top.close": "Close",

    "account.guest": "Guest session",
    "account.mode": "Research mode",

    "footer.title": "Data transparency",
    "footer.body":
      "Market figures come from Cambodia's public financial datasets. RielVest labels calculated analysis separately and does not estimate missing values.",
    "footer.session": "Latest recorded session",
  },
  km: {
    "nav.research": "ការស្រាវជ្រាវ",
    "nav.tools": "ឧបករណ៍",
    "nav.briefing": "សេចក្ដីសង្ខេបថ្ងៃនេះ",
    "nav.market": "ទីផ្សារ",
    "nav.stocks": "ភាគហ៊ុន",
    "nav.watchlist": "បញ្ជីតាមដាន",
    "nav.insights": "ការវិភាគ",
    "nav.later": "ពេលក្រោយ",
    "nav.toggleSidebar": "បិទ/បើក របារចំហៀង",
    "nav.primary": "ការរុករកចម្បង",
    "nav.skip": "រំលងទៅមាតិកា",

    "top.search": "ស្វែងរកក្រុមហ៊ុន",
    "top.searchShort": "ស្វែងរក",
    "top.appearance": "រូបរាង",
    "top.language": "ភាសា",
    "top.theme": "ផ្ទាំងពណ៌",
    "top.mode": "របៀបពណ៌",
    "top.light": "ភ្លឺ",
    "top.dark": "ងងឹត",
    "top.system": "តាមប្រព័ន្ធ",
    "top.fontSans": "ពុម្ពអក្សរចំណុចប្រទាក់",
    "top.fontMono": "ពុម្ពអក្សរតួលេខ",
    "top.close": "បិទ",

    "account.guest": "វេនភ្ញៀវ",
    "account.mode": "របៀបស្រាវជ្រាវ",

    "footer.title": "តម្លាភាពទិន្នន័យ",
    "footer.body":
      "តួលេខទីផ្សារមកពីសំណុំទិន្នន័យហិរញ្ញវត្ថុសាធារណៈរបស់កម្ពុជា។ RielVest សម្គាល់ការវិភាគដែលគណនាដោយឡែក ហើយមិនប៉ាន់ស្មានតម្លៃដែលខ្វះឡើយ។",
    "footer.session": "វេនជួញដូរចុងក្រោយ",
  },
} satisfies Record<Language, Record<string, string>>;

export type TranslationKey = keyof (typeof dictionary)["en"];

export function translate(language: Language, key: TranslationKey): string {
  // Fall back to English rather than showing a raw key if a string is missing.
  return dictionary[language][key] ?? dictionary.en[key] ?? key;
}
