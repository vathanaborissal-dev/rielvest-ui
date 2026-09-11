"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ChartInterval,
  ChartRange,
  MarketStatus,
  PriceChartSeries,
  StockQuickRead,
} from "../_lib/types";
import { formatCompact, formatDate, formatKhr, formatNumber, formatPercent } from "../_lib/format";
import { TradingPriceChart } from "./trading-price-chart";

const API_BASE = (process.env.NEXT_PUBLIC_RIELVEST_API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");
const CSX_STREAM_URL = process.env.NEXT_PUBLIC_CSX_STREAM_URL
  ?? "wss://api.csx.com.kh/tradingview/raw_websockets?webSocketToken=AacCeEsStOk3n1";

const intervals: Array<{ value: ChartInterval; label: string }> = [
  { value: "1m", label: "1 min" },
  { value: "5m", label: "5 min" },
  { value: "15m", label: "15 min" },
  { value: "1h", label: "1 hour" },
  { value: "1d", label: "1 day" },
  { value: "1w", label: "1 week" },
  { value: "1mo", label: "1 month" },
];

const ranges: Array<{ value: ChartRange; label: string; recommendedInterval: ChartInterval }> = [
  { value: "1d", label: "1D", recommendedInterval: "1m" },
  { value: "5d", label: "5D", recommendedInterval: "5m" },
  { value: "1mo", label: "1M", recommendedInterval: "1h" },
  { value: "3mo", label: "3M", recommendedInterval: "1d" },
  { value: "6mo", label: "6M", recommendedInterval: "1d" },
  { value: "1y", label: "1Y", recommendedInterval: "1d" },
  { value: "5y", label: "5Y", recommendedInterval: "1w" },
  { value: "max", label: "MAX", recommendedInterval: "1mo" },
];

function bucketKey(timestamp: number, interval: ChartInterval): string | number {
  if (interval === "1m") return Math.floor(timestamp / 60);
  if (interval === "5m") return Math.floor(timestamp / 300);
  if (interval === "15m") return Math.floor(timestamp / 900);
  if (interval === "1h") return Math.floor(timestamp / 3600);

  const local = new Date((timestamp + 7 * 3600) * 1000);
  if (interval === "1d") return local.toISOString().slice(0, 10);
  if (interval === "1mo") return local.toISOString().slice(0, 7);
  const monday = new Date(local);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

export function StockPriceChart({
  symbol,
  initialSeries,
  initialError,
  initialQuickRead,
}: {
  symbol: string;
  initialSeries: PriceChartSeries | null;
  initialError: string | null;
  initialQuickRead: StockQuickRead | null;
}) {
  const [series, setSeries] = useState(initialSeries);
  const [interval, setIntervalValue] = useState<ChartInterval>(initialSeries?.interval ?? "1d");
  const [range, setRange] = useState<ChartRange>(initialSeries?.range ?? "1y");
  const [mode, setMode] = useState<"candles" | "line">("candles");
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);
  const [streamStatus, setStreamStatus] = useState<"connecting" | "connected" | "offline">("connecting");
  const [liveTrade, setLiveTrade] = useState<{ price: number; quantity: number; timestamp: number } | null>(null);
  const [quickRead, setQuickRead] = useState(initialQuickRead);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);

  const loadQuickRead = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/companies/${encodeURIComponent(symbol)}/quick-read`);
      if (response.ok) setQuickRead((await response.json()) as StockQuickRead);
    } catch {
      // Keep the last useful reading when a background refresh fails.
    }
  }, [symbol]);

  // CSX trades 09:00-11:30 on weekdays. Knowing that is what separates "no
  // trade yet" from "the market closed hours ago" — without it the live strip
  // reads as broken for twenty-one hours a day.
  const loadMarketStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/market/status`);
      if (response.ok) setMarketStatus((await response.json()) as MarketStatus);
    } catch {
      // Leave the previous status in place; it is only explanatory text.
    }
  }, []);

  const load = useCallback(async (nextInterval: ChartInterval, nextRange: ChartRange, quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const query = new URLSearchParams({ interval: nextInterval, range: nextRange });
      const response = await fetch(`${API_BASE}/companies/${encodeURIComponent(symbol)}/chart?${query}`);
      if (!response.ok) throw new Error("The CSX chart feed is temporarily unavailable.");
      setSeries((await response.json()) as PriceChartSeries);
      setError(null);
    } catch (reason) {
      if (!quiet) setError(reason instanceof Error ? reason.message : "Could not load chart data.");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    void loadMarketStatus();
    const timer = window.setInterval(() => {
      void load(interval, range, true);
      void loadQuickRead();
      void loadMarketStatus();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [interval, load, loadMarketStatus, loadQuickRead, range]);

  const streamWanted = marketStatus === null || marketStatus.phase === "open" || marketStatus.phase === "pre_open";

  useEffect(() => {
    // Holding a socket open overnight achieves nothing: the exchange sends no
    // trades outside the session.
    if (!streamWanted) {
      setStreamStatus("offline");
      return;
    }

    const socket = new WebSocket(CSX_STREAM_URL);
    socket.addEventListener("open", () => {
      setStreamStatus("connected");
      socket.send(JSON.stringify({ action: "SubAdd", subs: [`0~CSX~${symbol}~KHR`] }));
    });
    socket.addEventListener("close", () => setStreamStatus("offline"));
    socket.addEventListener("error", () => setStreamStatus("offline"));
    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(String(event.data)) as Record<string, unknown>;
        if (Number(message.TYPE) !== 0 || String(message.FSYM) !== symbol || String(message.TSYM) !== "KHR") return;
        const price = Number(message.P);
        const quantity = Number(message.Q ?? 0);
        const timestamp = Number(message.TS);
        if (![price, quantity, timestamp].every(Number.isFinite)) return;
        setLiveTrade({ price, quantity, timestamp });
        setSeries((current) => {
          if (!current) return current;
          const bars = [...current.bars];
          const last = bars.at(-1);
          if (last && bucketKey(last.timestamp, current.interval) === bucketKey(timestamp, current.interval)) {
            bars[bars.length - 1] = {
              ...last,
              high: Math.max(last.high, price),
              low: Math.min(last.low, price),
              close: price,
              volume: last.volume + quantity,
              value: last.value + price * quantity,
            };
          } else {
            bars.push({
              time: new Date(timestamp * 1000).toISOString(),
              timestamp,
              open: price,
              high: price,
              low: price,
              close: price,
              volume: quantity,
              value: price * quantity,
            });
          }
          return { ...current, bars, fetchedAt: new Date().toISOString() };
        });
      } catch {
        // Ignore non-trade or malformed messages from the shared stream.
      }
    });
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action: "SubRemove", subs: [`0~CSX~${symbol}~KHR`] }));
      }
      socket.close();
    };
  }, [streamWanted, symbol]);

  const lastClose = series?.bars.at(-1)?.close ?? null;

  // Order matters: until the session status is known, saying "connecting"
  // would be a guess, and it is the guess that reads as broken for most of the
  // day. The last recorded close is always true.
  const liveDescription = liveTrade
    ? `${formatDate(new Date(liveTrade.timestamp * 1000).toISOString(), { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · ${formatCompact(liveTrade.quantity)} shares in the latest execution`
    : marketStatus === null
      ? "Showing the last recorded close"
      : !marketStatus.isOpen
        ? `${marketStatus.label} · showing the last recorded close`
        : streamStatus === "connected"
          ? "Live stream connected · waiting for the next execution"
          : streamStatus === "connecting"
            ? "Connecting to the live stream"
            : "Live stream unavailable. The 30-second price-bar refresh remains active.";

  const chooseInterval = (nextInterval: ChartInterval) => {
    setIntervalValue(nextInterval);
    void load(nextInterval, range);
  };

  const chooseRange = (nextRange: ChartRange, recommendedInterval: ChartInterval) => {
    setRange(nextRange);
    setIntervalValue(recommendedInterval);
    void load(recommendedInterval, nextRange);
  };

  return (
    <>
      <div className="section-heading-row chart-heading">
        <div>
          <div className="live-title-row">
            <h2>Price history</h2>
            <span className="live-feed"><i /> CSX feed</span>
          </div>
          <p>
            {series?.bars.length ?? 0} {interval} bars · {range.toUpperCase()} range · OHLC in KHR
          </p>
        </div>
        <span>Updated {formatDate(series?.fetchedAt, { hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      <div
        className="live-quote-strip"
        data-status={marketStatus?.isOpen ? streamStatus : "closed"}
        aria-live="polite"
      >
        <div>
          <span>
            <i /> {marketStatus?.isOpen ? "Real-time trades" : "Last traded price"}
          </span>
          <strong>
            {liveTrade
              ? `${formatNumber(liveTrade.price)} KHR`
              : lastClose !== null
                ? `${formatNumber(lastClose)} KHR`
                : "No price recorded"}
          </strong>
        </div>
        <p>{liveDescription}</p>
      </div>

      {quickRead ? <TodayQuickRead reading={quickRead} /> : null}

      <div className="chart-toolbar" aria-label="Price chart controls">
        <div className="chart-control-stack">
          <span className="chart-control-label">Range</span>
          <div className="range-picker">
            {ranges.map((option) => (
              <button
                type="button"
                data-active={range === option.value}
                disabled={loading}
                key={option.value}
                onClick={() => chooseRange(option.value, option.recommendedInterval)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span className="chart-control-label">Interval</span>
          <div className="interval-picker">
            {intervals.map((option) => (
              <button
                type="button"
                data-active={interval === option.value}
                disabled={loading}
                key={option.value}
                onClick={() => chooseInterval(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-mode-picker">
          <button type="button" data-active={mode === "candles"} onClick={() => setMode("candles")}>Candles</button>
          <button type="button" data-active={mode === "line"} onClick={() => setMode("line")}>Line</button>
        </div>
      </div>

      {error && !series ? (
        <div className="candle-empty"><strong>Chart data is unavailable</strong><span>{error}</span></div>
      ) : loading ? (
        <div className="candle-empty"><strong>Loading {interval} bars</strong><span>Reading the CSX chart feed.</span></div>
      ) : (
        <TradingPriceChart bars={series?.bars ?? []} mode={mode} interval={interval} symbol={symbol} />
      )}

      <details className="chart-guide">
        <summary>New to stock charts? Read this first</summary>
        <div>
          <p><strong>Candles</strong> show four prices. The body connects the opening and closing price; the thin wick shows the highest and lowest trade in that interval.</p>
          <p><strong>Green</strong> means the interval closed at or above its opening price. <strong>Red</strong> means it closed lower.</p>
          <p><strong>Line mode</strong> shows only closing prices, which is cleaner for understanding the general direction.</p>
          <p><strong>Volume bars</strong> show how many shares traded. A price move with high volume generally carries more evidence than the same move on very little trading.</p>
        </div>
      </details>

      <div className="chart-provenance">
        <span>Source: {series?.source.name ?? "CSX Trade chart feed"}</span>
        {error ? <span className="chart-refresh-warning">Refresh delayed: {error}</span> : <span>Auto-refreshes every 30 seconds · <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">Charts by TradingView</a></span>}
      </div>
    </>
  );
}

function TodayQuickRead({ reading }: { reading: StockQuickRead }) {
  const volumeComparison = reading.activity.volumeVsAveragePct === null
    ? "Not available"
    : `${formatPercent(reading.activity.volumeVsAveragePct, false)} of 20-day avg`;

  return (
    <section className="today-quick-read" data-signal={reading.signal}>
      <div className="quick-read-heading">
        <div>
          <span className="quick-read-kicker">Today&apos;s quick read · {formatDate(reading.asOf)}</span>
          <h3>{reading.headline}</h3>
        </div>
        <strong>{reading.signalLabel}</strong>
      </div>

      {/* The last trade is already the page's hero figure and the session
          high/low are inside the range, so neither is repeated here. */}
      <div className="quick-read-metrics">
        <div><span>Today&apos;s average (VWAP)</span><strong>{formatKhr(reading.session.vwap)}</strong></div>
        <div><span>Session range</span><strong>{formatKhr(reading.session.low)} – {formatKhr(reading.session.high)}</strong></div>
        <div><span>Trading activity</span><strong>{volumeComparison}</strong></div>
      </div>

      {/* The headline above already carries the warning. The reasoning behind
          it, and the order checklist, are available but not in the way. */}
      <details className="quick-read-more">
        <summary>Why, and what to check before ordering</summary>
        <p>{reading.explanation}</p>
        <ul>
          {reading.checklist.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p className="quick-read-disclaimer">
          {reading.disclaimer} Last trade and VWAP are not the live bid or ask.
        </p>
      </details>
    </section>
  );
}
