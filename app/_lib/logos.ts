/**
 * Issuer logos.
 *
 * Neither CSX nor the open-data portal publishes these — the exchange's own
 * company list serves an "asset not found" placeholder. ACLEDA Securities, a
 * licensed CSX member, hosts a logo per issuer on its trading CDN, and all
 * twelve are mirrored locally so the interface has no runtime dependency on a
 * third party for something as visible as a company's mark.
 *
 * Source: https://uatacstrading.acledasecurities.com.kh/cdn/issuers/<SYMBOL>.png
 * Re-fetch with `npm run logos:sync` if a new company lists.
 */
const LISTED_WITH_LOGOS = [
  "ABC",
  "CGSM",
  "DBDE",
  "GTI",
  "JSL",
  "MJQE",
  "PAS",
  "PCG",
  "PEPC",
  "PPAP",
  "PPSP",
  "PWSA",
] as const;

const AVAILABLE = new Set<string>(LISTED_WITH_LOGOS);

export function logoFor(symbol: string): string | null {
  const ticker = symbol.toUpperCase();
  return AVAILABLE.has(ticker) ? `/logos/${ticker}.png` : null;
}

export function hasLogo(symbol: string): boolean {
  return logoFor(symbol) !== null;
}
