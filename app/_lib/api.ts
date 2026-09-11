import type {
  CompanyBundle,
  CompanyListItem,
  IndexPoint,
  MarketOverview,
  PriceChartSeries,
  StockQuickRead,
  StockAnalysis,
  PriceLevels,
  LevelsBoard,
  MarketBriefing,
  MarketDigest,
  TradePlan,
  ChartInterval,
  ChartRange,
} from "./types";

const API_BASE = (process.env.RIELVEST_API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  status: number | null;
}

/**
 * How long a response stays fresh, matched to how fast the underlying figure
 * actually moves.
 *
 * Getting this wrong is visible: a price header cached for five minutes will
 * disagree with a live strip that refreshes every thirty seconds, and the page
 * looks like it is showing the wrong price. Anything carrying a price is
 * therefore short-lived; descriptive and analytical data, which changes once a
 * session at most, is not.
 */
const REVALIDATE = {
  /** Prices and anything derived from the current session. */
  price: 30,
  /** Analysis and levels: recomputed per request but driven by daily bars. */
  analysis: 60,
  /** Company profiles, sectors and long-run history. */
  reference: 300,
} as const;

async function getJson<T>(path: string, revalidate: number = REVALIDATE.reference): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      next: { revalidate },
      signal: AbortSignal.timeout(4_000),
    });

    if (!response.ok) {
      return {
        data: null,
        error: response.status === 404 ? "This record was not found." : "The market data service is unavailable.",
        status: response.status,
      };
    }

    return { data: (await response.json()) as T, error: null, status: response.status };
  } catch {
    return {
      data: null,
      error: "The market data service could not be reached. Start the API or check RIELVEST_API_URL.",
      status: null,
    };
  }
}

export function getMarketOverview() {
  return getJson<MarketOverview>("/market/overview", REVALIDATE.price);
}

export async function getIndexSeries(days = 365) {
  const result = await getJson<{ series: IndexPoint[] }>(
    `/market/index?days=${days}`,
    REVALIDATE.price,
  );
  return { ...result, data: result.data?.series ?? null };
}

export async function getCompanies(filters?: { search?: string; board?: string }) {
  const query = new URLSearchParams();
  if (filters?.search) query.set("search", filters.search);
  if (filters?.board === "main" || filters?.board === "growth") query.set("board", filters.board);
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  // Carries the latest close for every row, so it ages with the session.
  const result = await getJson<{ companies: CompanyListItem[] }>(
    `/companies${suffix}`,
    REVALIDATE.price,
  );
  return { ...result, data: result.data?.companies ?? null };
}

export function getCompany(symbol: string) {
  // Bundles the profile with the price history, so it follows the price clock.
  return getJson<CompanyBundle>(`/companies/${encodeURIComponent(symbol)}`, REVALIDATE.price);
}

export function getPriceChart(symbol: string, interval: ChartInterval = "1d", range: ChartRange = "1y") {
  const query = new URLSearchParams({ interval, range });
  return getJson<PriceChartSeries>(
    `/companies/${encodeURIComponent(symbol)}/chart?${query.toString()}`,
    interval === "1m" ? 20 : REVALIDATE.analysis,
  );
}

export function getQuickRead(symbol: string) {
  return getJson<StockQuickRead>(`/companies/${encodeURIComponent(symbol)}/quick-read`, 20);

}

/** Support and resistance levels for the current session. */
export async function getPriceLevels(symbol: string) {
  const result = await getJson<{ levels: PriceLevels }>(
    `/companies/${encodeURIComponent(symbol)}/levels`,
    REVALIDATE.analysis,
  );
  return { ...result, data: result.data?.levels ?? null };
}

/** The prices that matter for one stock today. */
export async function getTradePlan(symbol: string) {
  const result = await getJson<{ plan: TradePlan }>(
    `/companies/${encodeURIComponent(symbol)}/plan`,
    REVALIDATE.analysis,
  );
  return { ...result, data: result.data?.plan ?? null };
}

/** The 30-second answer: what happened, any news, and which prices matter. */
export function getDigest() {
  return getJson<MarketDigest>("/market/digest", REVALIDATE.price);
}

/** The pre-session brief: what needs a decision before the bell. */
export function getBriefing() {
  return getJson<MarketBriefing>("/market/briefing", REVALIDATE.price);
}

/** The whole board at a glance: where each stock sits against its own levels. */
export async function getLevelsBoard() {
  return getJson<LevelsBoard>("/market/levels", REVALIDATE.analysis);
}

export async function getAnalysis(symbol: string) {
  const result = await getJson<{ analysis: StockAnalysis }>(
    `/companies/${encodeURIComponent(symbol)}/analysis`,
    REVALIDATE.analysis,
  );
  return { ...result, data: result.data?.analysis ?? null };
}
