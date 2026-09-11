"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  type UTCTimestamp,
} from "lightweight-charts";
import { resolveThemeColors, resolveThemeFont, withAlpha } from "../_lib/css";
import { formatCompact, formatDate, formatNumber } from "../_lib/format";
import type { ChartInterval, PriceBar } from "../_lib/types";
import { useAppearance } from "./appearance-provider";

export function TradingPriceChart({
  bars,
  mode,
  interval,
  symbol,
}: {
  bars: PriceBar[];
  mode: "candles" | "line";
  interval: ChartInterval;
  symbol: string;
}) {
  // The chart paints to a canvas, so it cannot inherit CSS. Re-running the
  // effect on preset or mode changes is what re-colours it on a theme switch.
  const { preset, mode: colorMode } = useAppearance();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<PriceBar | null>(null);
  const latest = hovered ?? bars.at(-1) ?? null;
  const barByTime = useMemo(
    () => new Map(bars.map((bar) => [bar.timestamp, bar])),
    [bars],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || bars.length === 0) return;

    const { ink, faint, line, accent, negative } = resolveThemeColors({
      ink: { token: "--ink-soft", fallback: "#52605b" },
      faint: { token: "--ink-faint", fallback: "#78847f" },
      line: { token: "--line", fallback: "#dce3e0" },
      accent: { token: "--accent", fallback: "#14765f" },
      negative: { token: "--negative", fallback: "#b44949" },
    });
    const monoFont = resolveThemeFont("--font-mono", "monospace");
    const intraday = interval === "1m" || interval === "5m" || interval === "15m" || interval === "1h";

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 340,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: faint,
        fontFamily: monoFont,
        fontSize: 10,
      },
      grid: {
        // Softened against the preset border: some presets use pure black for
        // borders, which reads as content rather than structure behind candles.
        vertLines: { color: withAlpha(line, 0.22) },
        horzLines: { color: withAlpha(line, 0.22) },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: faint, labelBackgroundColor: ink },
        horzLine: { color: faint, labelBackgroundColor: ink },
      },
      rightPriceScale: {
        borderColor: withAlpha(line, 0.55),
        scaleMargins: { top: 0.08, bottom: 0.24 },
      },
      timeScale: {
        borderColor: withAlpha(line, 0.55),
        timeVisible: intraday,
        secondsVisible: false,
        rightOffset: 2,
        barSpacing: mode === "candles" ? 7 : 5,
      },
      localization: {
        locale: "en-KH",
        priceFormatter: (price: number) => `${formatNumber(price)} KHR`,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
    });

    const priceSeries = mode === "candles"
      ? chart.addSeries(CandlestickSeries, {
          upColor: accent,
          downColor: negative,
          borderVisible: false,
          wickUpColor: accent,
          wickDownColor: negative,
          priceLineColor: accent,
        })
      : chart.addSeries(LineSeries, {
          color: accent,
          lineWidth: 2,
          crosshairMarkerRadius: 4,
          priceLineColor: accent,
        });

    if (mode === "candles") {
      priceSeries.setData(bars.map((bar) => ({
        time: bar.timestamp as UTCTimestamp,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      })));
    } else {
      priceSeries.setData(bars.map((bar) => ({
        time: bar.timestamp as UTCTimestamp,
        value: bar.close,
      })));
    }

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    volumeSeries.setData(bars.map((bar) => ({
      time: bar.timestamp as UTCTimestamp,
      value: bar.volume,
      color: withAlpha(bar.close >= bar.open ? accent : negative, 0.4),
    })));

    chart.subscribeCrosshairMove((param) => {
      if (param.time === undefined) {
        setHovered(null);
        return;
      }
      setHovered(barByTime.get(Number(param.time)) ?? null);
    });
    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) chart.applyOptions({ width: Math.floor(entry.contentRect.width) });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
    // `preset` and `colorMode` are dependencies for their effect on the
    // resolved colours above, not because the drawing code reads them.
  }, [barByTime, bars, interval, mode, preset, colorMode]);

  if (!latest) {
    return (
      <div className="candle-empty">
        <strong>No chart bars are available</strong>
        <span>Try another interval or refresh the CSX feed.</span>
      </div>
    );
  }

  return (
    <div className="trading-chart-wrap">
      <div className="chart-legend" aria-live="polite">
        <strong>{symbol}</strong>
        <span>{formatDate(latest.time, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
        <span>O <b>{formatNumber(latest.open)}</b></span>
        <span>H <b>{formatNumber(latest.high)}</b></span>
        <span>L <b>{formatNumber(latest.low)}</b></span>
        <span>C <b>{formatNumber(latest.close)}</b></span>
        <span>Vol <b>{formatCompact(latest.volume)}</b></span>
      </div>
      <div className="trading-chart" ref={containerRef} aria-label={`${symbol} interactive ${mode} chart`} />
    </div>
  );
}
