export type Assessment =
  | "positive"
  | "improving"
  | "neutral"
  | "caution"
  | "risk"
  | "deteriorating"
  | "insufficient_data";

export interface QuoteView {
  symbol: string;
  name: string;
  sector: string | null;
  board: "main" | "growth";
  tradeDate: string;
  close: number;
  open: number | null;
  high: number | null;
  low: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  value: number | null;
  pe: number | null;
  pb: number | null;
  roe: number | null;
  marketCap: number | null;
  marketCapPeriod: string | null;
}

export interface IndexPoint {
  tradeDate: string;
  value: number;
  change: number | null;
  changePercent: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
}

export interface MarketOverview {
  tradeDate: string | null;
  quotes: QuoteView[];
  index: (IndexPoint & { indexTime: string | null }) | null;
  breadth: {
    advancing: number;
    declining: number;
    unchanged: number;
    notTrading: number;
    total: number;
  };
  totalVolume: number;
  totalValue: number;
  totalMarketCap: number | null;
  totalMarketCapPeriod: string | null;
  usdPerKhr: number | null;
  listedCount: number;
  quotedCount: number;
  gainers: QuoteView[];
  losers: QuoteView[];
  active: QuoteView[];
  medianPe: number | null;
  medianPb: number | null;
  commentary: {
    headline: string;
    sentiment: Assessment;
    points: Array<{
      statement: string;
      assessment: Assessment;
      kind: "data" | "interpretation" | "gap";
    }>;
    asOf: string | null;
    method: string;
  };
}

export interface CompanyListItem {
  id: string;
  symbol: string;
  name: string;
  legalName: string | null;
  sector: string | null;
  industry: string | null;
  board: "main" | "growth";
  listingDate: string | null;
  yearsListed: number | null;
  description: string | null;
  hasQuote: boolean;
  tradeDate: string | null;
  close: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  value: number | null;
  pe: number | null;
  pb: number | null;
  roe: number | null;
  marketCap: number | null;
  marketCapPeriod: string | null;
  ratiosAsOf?: string | null;
}

export interface CompanyProfile {
  id: string;
  symbol: string;
  isin: string | null;
  name: string;
  legalName: string | null;
  sector: string | null;
  industry: string | null;
  board: "main" | "growth";
  listingDate: string | null;
  yearsListed: number | null;
  website: string | null;
  description: string | null;
  status: string;
  reference: {
    source: string | null;
    sourceName: string | null;
    publisher: string | null;
    url: string | null;
    note: string | null;
  };
}

export interface Dividend {
  fiscalYear: number;
  type: string;
  amountPerShare: number;
  exDate: string | null;
  recordDate: string | null;
  paymentDate: string | null;
  source: { code: string; url: string | null };
}

export interface CompanyBundle {
  company: CompanyProfile;
  quotes: Array<{
    tradeDate: string;
    close: number;
    open: number | null;
    high: number | null;
    low: number | null;
    change: number | null;
    volume: number | null;
    value: number | null;
    pe: number | null;
    pb: number | null;
  }>;
  periods: Array<{
    label: string;
    periodStart: string;
    periodEnd: string;
    marketCap: number | null;
    tradingVolume: number | null;
    tradingValue: number | null;
    dailyAvgVolume: number | null;
    dailyAvgValue: number | null;
    source: { code: string; datasetId: string | null; url: string | null };
  }>;
  dividends: Dividend[];
}

export type ChartInterval = '1m' | '5m' | '15m' | '1h' | '1d' | '1w' | '1mo';
export type ChartRange = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y' | 'max';

export interface PriceBar {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  value: number;
}

export interface PriceChartSeries {
  symbol: string;
  interval: ChartInterval;
  range: ChartRange;
  bars: PriceBar[];
  source: { code: string; name: string; url: string };
  fetchedAt: string;
}

export interface StockQuickRead {
  symbol: string;
  asOf: string | null;
  signal: "wait" | "balanced" | "strength" | "caution" | "unavailable";
  signalLabel: string;
  headline: string;
  explanation: string;
  session: {
    last: number | null;
    open: number | null;
    low: number | null;
    high: number | null;
    vwap: number | null;
    volume: number | null;
    value: number | null;
    rangePositionPct: number | null;
    vsVwapPct: number | null;
  };
  trend: {
    ma20: number | null;
    ma50: number | null;
    recentLow20: number | null;
    recentHigh20: number | null;
    label: "uptrend" | "downtrend" | "mixed" | "insufficient_data";
  };
  activity: {
    averageVolume20: number | null;
    averageValue20: number | null;
    volumeVsAveragePct: number | null;
    liquidityLabel: "active" | "moderate" | "thin" | "unknown";
  };
  priceReferences: Array<{
    key: "session_low" | "vwap" | "session_high";
    label: string;
    price: number;
    note: string;
  }>;
  checklist: string[];
  disclaimer: string;
  source: { code: string; name: string; url: string };
  fetchedAt: string;
}

export interface AnalysisMetric {
  key: string;
  label: string;
  value: number | null;
  unit: string;
  provenance: "reported" | "calculated" | "unavailable";
  method?: string;
  explanation?: string;
  assessment: Assessment;
  source?: { code: string; label: string; url?: string | null; asOf?: string | null };
}

export interface AnalysisFinding {
  statement: string;
  assessment: Assessment;
  basis: string[];
}

export interface StockAnalysis {
  symbol: string;
  name: string;
  asOf: string | null;
  score: number | null;
  assessment: Assessment;
  coverage: number;
  categories: Array<{
    key: string;
    label: string;
    question: string;
    score: number | null;
    assessment: Assessment;
    metrics: AnalysisMetric[];
    findings: AnalysisFinding[];
    dataGaps: string[];
  }>;
  risks: AnalysisFinding[];
  opportunities: AnalysisFinding[];
  narrative: string[];
  dataGaps: string[];
  methodology: string;
}

/** Whether CSX is trading, so the interface can explain a silent live feed. */
export interface MarketStatus {
  phase: "pre_open" | "open" | "closed" | "weekend";
  isOpen: boolean;
  label: string;
  localTime: string;
  nextOpen: string | null;
  timezone: string;
  sessionHours: string;
}

export interface PriceLevel {
  label: string;
  price: number;
  /** Distance from the last close, in percent. Negative means below. */
  distancePercent: number;
  kind: "support" | "resistance" | "pivot" | "reference";
  /**
   * `pivot` levels are recomputed from yesterday's range and always sit within
   * a fraction of a percent of the close. `structural` levels are prices the
   * market has actually reacted to.
   */
  origin: "pivot" | "structural";
  method: string;
}

export interface LevelSignal {
  label: string;
  value: number | null;
  unit: string;
  reading: string;
  assessment: Assessment;
  method: string;
}

export interface PriceLevels {
  symbol: string;
  asOf: string | null;
  close: number | null;
  closePositionPercent: number | null;
  levels: PriceLevel[];
  nearestSupport: PriceLevel | null;
  nearestResistance: PriceLevel | null;
  nearestStructuralSupport: PriceLevel | null;
  nearestStructuralResistance: PriceLevel | null;
  pivots: { s1: number; pivot: number; r1: number; basedOn: string } | null;
  signals: LevelSignal[];
  summary: string[];
  averageTrueRange: number | null;
  averageTrueRangePercent: number | null;
  sessionsAvailable: number;
  method: string;
  caution: string;
}

export interface LevelsBoardRow {
  symbol: string;
  name: string;
  sector: string | null;
  board: "main" | "growth";
  tradeDate: string | null;
  close: number | null;
  changePercent: number | null;
  supportLabel: string | null;
  support: number | null;
  supportDistancePercent: number | null;
  resistanceLabel: string | null;
  resistance: number | null;
  resistanceDistancePercent: number | null;
  pivots: { s1: number; pivot: number; r1: number } | null;
  rsi: number | null;
  volumeRatio: number | null;
  rangePositionPercent: number | null;
  atrPercent: number | null;
  read: string;
  flags: { label: string; assessment: Assessment }[];
}

export interface LevelsBoard {
  asOf: string | null;
  rows: LevelsBoardRow[];
  method: string;
  caution: string;
}

// --- Pre-session brief -----------------------------------------------------

export type SignalKind =
  | "big_move"
  | "limit_move"
  | "dividend_upcoming"
  | "dividend_declared"
  | "disclosure"
  | "earnings_report"
  | "breakout"
  | "breakdown"
  | "at_resistance"
  | "at_support"
  | "volume_surge"
  | "overbought"
  | "oversold"
  | "range_high"
  | "range_low"
  | "illiquid"
  | "gap";

export interface Evidence {
  label: string;
  value: string;
  provenance: "reported" | "calculated";
}

export interface KeyPrice {
  label: string;
  price: number;
  distancePercent: number;
  meaning: string;
}

export interface TradeConstraints {
  basePrice: number;
  limitUp: number;
  limitDown: number;
  tickSize: number;
  typicalDailyValue: number | null;
  comfortableShares: number | null;
  liquidityNote: string;
  settlementDate: string;
  keyPrices: KeyPrice[];
}

export interface BriefingSignal {
  priority: number;
  score: number;
  kind: SignalKind;
  symbol: string;
  name: string;
  assessment: Assessment;
  headline: string;
  detail: string;
  evidence: Evidence[];
  constraints: TradeConstraints | null;
  sourceUrl?: string | null;
}

export interface MarketPulse {
  indexValue: number | null;
  indexChangePercent: number | null;
  advancing: number;
  declining: number;
  unchanged: number;
  turnover: number;
  turnoverRatio: number | null;
  concentrationPercent: number | null;
  concentrationSymbol: string | null;
  medianPe: number | null;
  breadthNote: string;
}

export interface MarketBriefing {
  asOf: string | null;
  generatedAt: string;
  status: { phase: string; label: string; acceptsOrders: boolean; nextOpen: string | null };
  headline: string[];
  pulse: MarketPulse;
  focus: BriefingSignal[];
  signals: BriefingSignal[];
  quiet: string[];
  method: string;
  caution: string;
}

// --- Today's price plan ----------------------------------------------------

export interface PlanZone {
  label: string;
  from: number;
  to?: number;
  distancePercent: number;
  meaning: string;
  basis: string;
  tone: "support" | "resistance" | "invalidation" | "neutral";
  /** False when today's ±10% band cannot reach this zone at all. */
  reachableToday?: boolean;
}

export interface TradePlan {
  symbol: string;
  asOf: string | null;
  lastPrice: number | null;
  spark?: number[];
  tickets?: { buy: OrderTicket | null; sell: OrderTicket | null };
  dailyRange: { khr: number; percent: number } | null;
  zones: PlanZone[];
  rules: {
    limitDown: number;
    limitUp: number;
    tickSize: number;
    settlementDate: string;
    workableShares: number | null;
    workableValue: number | null;
    liquidityNote: string;
  } | null;
  summary: string[];
  caveats: string[];
  caution: string;
}

// --- The 30-second digest --------------------------------------------------

export interface DigestFreshness {
  sessionDate: string | null;
  today: string;
  isCurrentSession: boolean;
  eyebrow: string;
  kicker: string;
  staleNote: string | null;
}

export interface OrderTicket {
  distanceKhr?: number;
  typicalRangeKhr?: number;
  referenceBasis?: string;
  side: "buy" | "sell";
  label: string;
  targetPrice: number;
  limitPrice: number | null;
  tickSize: number;
  bandFloor: number;
  bandCeiling: number;
  reachableToday: boolean;
  unreachableNote: string | null;
  tickAdjustment: number;
  shares: number | null;
  valueKhr: number | null;
  settlesOn: string | null;
}

export interface DigestSession {
  phase: string;
  label: string;
  acceptsOrders: boolean;
  nextEvent: { label: string; at: string; minutesAway: number } | null;
  guidance: string[];
}

export interface DigestCandidate {
  symbol: string;
  spark?: number[];
  name: string;
  price: number;
  changePercent: number | null;
  levelLabel: string;
  levelPrice: number;
  levelSide: "support" | "resistance";
  distancePercent: number;
  otherLabel: string | null;
  otherPrice: number | null;
  reasons: string[];
  cautions: string[];
  limitDown: number;
  limitUp: number;
  tickSize: number;
  workableShares: number | null;
  workableValueKhr: number | null;
  turnoverKhr: number;
  tickets: { buy: OrderTicket | null; sell: OrderTicket | null };
  score: number;
  scoreParts: { label: string; points: number }[];
}

export interface DigestUniverse {
  assessed: number;
  tradeable: number;
  floorKhr: number;
  referencePositionKhr: number;
  maxShareOfTurnover: number;
  excluded: string[];
}

export interface MarketPulse {
  indexLevel: number | null;
  indexChangePercent: number | null;
  advancing: number;
  declining: number;
  unchanged: number;
  turnoverKhr: number | null;
  turnoverVsNormal: number | null;
  stretched: string[];
  oversold: string[];
  lines: string[];
}

export interface DigestMover {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  turnoverKhr: number;
  volumeRatio: number | null;
  note: string | null;
}

export interface DigestNewsItem {
  sinceLastSession: boolean;
  symbol: string | null;
  name: string | null;
  title: string;
  date: string;
  url: string | null;
  tradeable: boolean;
}

export interface DigestBoardRow {
  symbol: string;
  spark?: number[];
  name: string;
  price: number;
  changePercent: number | null;
  turnoverKhr: number;
  rsi: number | null;
  levelLabel: string | null;
  levelPrice: number | null;
  levelSide: "support" | "resistance" | null;
  distancePercent: number | null;
  state: string;
  hasNews: boolean;
}

export interface MarketDigest {
  asOf: string | null;
  generatedAt: string;
  marketOpen: boolean;
  statusLabel: string;
  headline: { market: string; news: string | null; source: "model" | "engine" };
  freshness: DigestFreshness;
  session: DigestSession;
  pulse: MarketPulse;
  movers: DigestMover[];
  news: DigestNewsItem[];
  candidates: DigestCandidate[];
  board: DigestBoardRow[];
  universe: DigestUniverse;
  criteria: string;
  emptyReason: string | null;
  caution: string;
}

export interface ReviewNews { title: string; date: string; url: string | null }
export interface DecisionReview {
  symbol: string;
  asOf: string | null;
  stance: 'research' | 'wait' | 'insufficient_data';
  headline: string;
  coverage: number;
  factors: { label: string; assessment: Assessment; score: number | null }[];
  strengths: string[];
  cautions: string[];
  nextCheck: string;
  gaps: string[];
  news: ReviewNews[];
  summary: { lines: string[]; source: 'model' | 'engine'; model: string | null };
}

/** Live, borrowed context — fetched on request and never stored by RielVest. */
export interface LiveQuote {
  key: string;
  label: string;
  note: string | null;
  isProxy: boolean;
  price: number | null;
  previousClose: number | null;
  changePercent: number | null;
  currency: string | null;
  asOf: string | null;
  available: boolean;
  unavailableReason: string | null;
}

export interface LiveHeadline {
  title: string;
  url: string;
  publishedAt: string | null;
  source: string | null;
}

export interface MarketContext {
  fetchedAt: string;
  region: LiveQuote[];
  benchmarks: LiveQuote[];
  headlines: LiveHeadline[];
  headlinesUnavailableReason: string | null;
  summary: string | null;
  sources: Array<{ label: string; url: string; note: string }>;
  storage: string;
}
