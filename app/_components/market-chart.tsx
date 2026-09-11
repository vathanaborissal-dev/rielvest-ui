import { formatDate, formatNumber } from "../_lib/format";

interface Point {
  tradeDate: string;
  value: number;
}

export interface CandlePoint {
  tradeDate: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
}

function buildChart(points: Point[], width: number, height: number, padding: number) {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const coords = points.map((point, index) => ({
    x: padding + (index / Math.max(points.length - 1, 1)) * innerWidth,
    y: padding + (1 - (point.value - min) / range) * innerHeight,
  }));
  const line = coords.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const area = `${line} L${coords.at(-1)?.x ?? padding},${height - padding} L${padding},${height - padding} Z`;
  return { min, max, line, area };
}

export function MarketChart({ points, label = "CSX index" }: { points: Point[]; label?: string }) {
  if (points.length < 2) {
    return (
      <div className="chart-empty">
        <strong>Price history is not available</strong>
        <span>The chart appears after at least two recorded sessions.</span>
      </div>
    );
  }

  const width = 900;
  const height = 300;
  const chart = buildChart(points, width, height, 18);
  const first = points[0]!;
  const last = points.at(-1)!;

  return (
    <figure className="market-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${label} from ${formatDate(first.tradeDate)} to ${formatDate(last.tradeDate)}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chart-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.19" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line className="chart-grid" x1="18" x2="882" y1="18" y2="18" />
        <line className="chart-grid" x1="18" x2="882" y1="150" y2="150" />
        <line className="chart-grid" x1="18" x2="882" y1="282" y2="282" />
        <path d={chart.area} fill="url(#chart-area)" />
        <path className="chart-line" d={chart.line} />
      </svg>
      <figcaption>
        <span>{formatDate(first.tradeDate, { month: "short", year: "numeric" })}</span>
        <span>Range {formatNumber(chart.min, 2)} to {formatNumber(chart.max, 2)}</span>
        <span>{formatDate(last.tradeDate, { month: "short", year: "numeric" })}</span>
      </figcaption>
    </figure>
  );
}

export function MiniChart({ points, label }: { points: Point[]; label: string }) {
  if (points.length < 2) return <div className="mini-chart-empty">History unavailable</div>;
  const width = 600;
  const height = 160;
  const chart = buildChart(points, width, height, 8);
  return (
    <svg
      className="mini-chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      <path d={chart.area} fill="var(--chart-fill)" />
      <path className="chart-line" d={chart.line} />
    </svg>
  );
}

function formatChartTime(value: string, interval?: string) {
  const intraday = interval === "1m" || interval === "5m" || interval === "15m" || interval === "1h";
  return formatDate(
    value,
    intraday
      ? { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "short", year: "numeric" },
  );
}

export function CandlestickChart({
  points,
  label,
  interval,
}: {
  points: CandlePoint[];
  label: string;
  interval?: string;
}) {
  const candles = points.filter(
    (point): point is CandlePoint & { open: number; high: number; low: number } =>
      point.open !== null && point.high !== null && point.low !== null,
  );

  if (candles.length < 2) {
    return (
      <div className="candle-empty">
        <strong>Daily candles are collecting</strong>
        <span>Two complete trading sessions are needed to draw the chart.</span>
      </div>
    );
  }

  const width = 720;
  const height = 250;
  const paddingX = 18;
  const paddingY = 16;
  const low = Math.min(...candles.map((point) => point.low));
  const high = Math.max(...candles.map((point) => point.high));
  const range = high - low || 1;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;
  const slotWidth = innerWidth / candles.length;
  const bodyWidth = Math.max(2, Math.min(13, slotWidth * 0.56));
  const y = (value: number) => paddingY + (1 - (value - low) / range) * innerHeight;
  const first = candles[0]!;
  const last = candles.at(-1)!;

  return (
    <figure className="candlestick-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label}, candlesticks from ${formatChartTime(first.tradeDate, interval)} to ${formatChartTime(last.tradeDate, interval)}`}
      >
        <line className="chart-grid" x1={paddingX} x2={width - paddingX} y1={paddingY} y2={paddingY} />
        <line className="chart-grid" x1={paddingX} x2={width - paddingX} y1={height / 2} y2={height / 2} />
        <line className="chart-grid" x1={paddingX} x2={width - paddingX} y1={height - paddingY} y2={height - paddingY} />
        {candles.map((point, index) => {
          const center = paddingX + slotWidth * (index + 0.5);
          const openY = y(point.open);
          const closeY = y(point.close);
          const rising = point.close >= point.open;
          const bodyTop = Math.min(openY, closeY);
          const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
          return (
            <g className={rising ? "candle candle-up" : "candle candle-down"} key={point.tradeDate}>
              <title>{`${formatDate(point.tradeDate)}: open ${formatNumber(point.open)}, high ${formatNumber(point.high)}, low ${formatNumber(point.low)}, close ${formatNumber(point.close)} KHR`}</title>
              <line className="candle-wick" x1={center} x2={center} y1={y(point.high)} y2={y(point.low)} />
              <rect
                className="candle-body"
                x={center - bodyWidth / 2}
                y={bodyTop}
                width={bodyWidth}
                height={bodyHeight}
                rx={0.7}
              />
            </g>
          );
        })}
      </svg>
      <figcaption>
        <span>{formatChartTime(first.tradeDate, interval)}</span>
        <span>{interval ?? "Daily"} OHLC, KHR</span>
        <span>{formatChartTime(last.tradeDate, interval)}</span>
      </figcaption>
    </figure>
  );
}

export function StockLineChart({
  points,
  label,
  interval,
}: {
  points: CandlePoint[];
  label: string;
  interval?: string;
}) {
  if (points.length < 2) {
    return (
      <div className="candle-empty">
        <strong>Line history is unavailable</strong>
        <span>The feed needs at least two price bars.</span>
      </div>
    );
  }

  const width = 720;
  const height = 250;
  const chart = buildChart(
    points.map((point) => ({ tradeDate: point.tradeDate, value: point.close })),
    width,
    height,
    16,
  );
  const first = points[0]!;
  const last = points.at(-1)!;

  return (
    <figure className="candlestick-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label}, closing-price line from ${formatChartTime(first.tradeDate, interval)} to ${formatChartTime(last.tradeDate, interval)}`}
      >
        <defs>
          <linearGradient id="stock-line-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line className="chart-grid" x1="16" x2="704" y1="16" y2="16" />
        <line className="chart-grid" x1="16" x2="704" y1="125" y2="125" />
        <line className="chart-grid" x1="16" x2="704" y1="234" y2="234" />
        <path d={chart.area} fill="url(#stock-line-area)" />
        <path className="chart-line" d={chart.line} />
      </svg>
      <figcaption>
        <span>{formatChartTime(first.tradeDate, interval)}</span>
        <span>Close range {formatNumber(chart.min)} to {formatNumber(chart.max)} KHR</span>
        <span>{formatChartTime(last.tradeDate, interval)}</span>
      </figcaption>
    </figure>
  );
}
