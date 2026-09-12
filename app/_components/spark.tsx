/**
 * Inline visuals that replace sentences.
 *
 * Both of these carry information a reader would otherwise have to assemble
 * from prose — "price is under resistance, a break has to hold", "it has been
 * drifting down for a month". A shape is read in a glance and a sentence is
 * not, and on a page nobody reads carefully the shape is what survives.
 *
 * Server-rendered SVG: no chart library, no client JavaScript, no layout shift.
 */

/** A 30-session close line. Colour follows direction, never a fixed accent. */
export function Sparkline({
  values,
  width = 62,
  height = 20,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  const points = values.filter((value) => Number.isFinite(value));
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min;
  const pad = 1.5;

  // A flat series would divide by zero; draw it down the middle instead.
  const y = (value: number) =>
    span === 0 ? height / 2 : pad + (1 - (value - min) / span) * (height - pad * 2);
  const x = (index: number) => (index / (points.length - 1)) * width;

  const path = points.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(" ");
  const rising = points.at(-1)! >= points[0]!;

  return (
    <svg
      className="spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      data-rising={rising}
      role="img"
      aria-label={`${points.length}-session trend, ${rising ? "up" : "down"} overall`}
      focusable="false"
    >
      <polyline points={path} fill="none" strokeWidth="1.25" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(points.at(-1)!)} r="1.9" />
    </svg>
  );
}

export interface RangeMark {
  price: number;
  label: string;
  kind: "support" | "resistance" | "last" | "buy" | "sell";
}

/**
 * Where the price sits inside what today actually permits.
 *
 * Scaled to the daily band rather than to the levels themselves, because the
 * band is the only bounded, exchange-defined extent — nothing can trade outside
 * it before tomorrow. A level that falls off the end is therefore genuinely out
 * of reach today, which the bar shows by simply not having anywhere to put it.
 */
export function RangeBar({
  low,
  high,
  marks,
  caption,
}: {
  low: number;
  high: number;
  marks: RangeMark[];
  caption?: string;
}) {
  const span = high - low;
  if (!Number.isFinite(span) || span <= 0) return null;

  const position = (price: number) => ((price - low) / span) * 100;
  const inside = marks.filter((mark) => mark.price >= low && mark.price <= high);

  return (
    <div className="range-bar" title={caption}>
      <div className="range-track">
        {inside.map((mark) => (
          <span
            key={`${mark.kind}-${mark.price}`}
            className="range-mark"
            data-kind={mark.kind}
            style={{ left: `${position(mark.price).toFixed(2)}%` }}
            title={`${mark.label} ${Math.round(mark.price).toLocaleString("en-US")}`}
            aria-label={`${mark.label} ${Math.round(mark.price).toLocaleString("en-US")}`}
          />
        ))}
      </div>
      <div className="range-ends">
        <span>{Math.round(low).toLocaleString("en-US")}</span>
        <span>{Math.round(high).toLocaleString("en-US")}</span>
      </div>
    </div>
  );
}
