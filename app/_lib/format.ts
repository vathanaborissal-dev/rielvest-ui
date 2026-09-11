import type { AnalysisMetric } from "./types";

export function cleanCopy(value: string): string {
  return value
    .replace(/\s*\u2014\s*/g, ", ")
    .replace(/\s*\u2013\s*/g, "-");
}

export function formatDate(value: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!value) return "Not available";
  const instant = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value);
  if (Number.isNaN(instant.getTime())) return "Not available";
  return new Intl.DateTimeFormat(
    "en-KH",
    options
      ? { timeZone: "Asia/Phnom_Penh", ...options }
      : { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Phnom_Penh" },
  ).format(instant);
}

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Not available";
  return new Intl.NumberFormat("en-KH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Not available";
  return new Intl.NumberFormat("en-KH", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatKhr(value: number | null | undefined, compact = false): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Not available";
  return compact ? `${formatCompact(value)} KHR` : `${formatNumber(value)} KHR`;
}

export function formatPercent(value: number | null | undefined, showSign = true): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Not available";
  const sign = showSign && value > 0 ? "+" : "";
  return `${sign}${formatNumber(value, 2)}%`;
}

export function movementClass(value: number | null | undefined): "positive" | "negative" | "flat" {
  if (value === null || value === undefined || value === 0) return "flat";
  return value > 0 ? "positive" : "negative";
}

export function formatMetric(metric: AnalysisMetric): string {
  if (metric.value === null) return "Not available";
  switch (metric.unit) {
    case "khr":
      return formatKhr(metric.value, true);
    case "percent":
      return formatPercent(metric.value, false);
    case "x":
    case "ratio":
      return `${formatNumber(metric.value, 2)}x`;
    case "shares":
    case "count":
      return formatCompact(metric.value);
    case "days":
      return `${formatNumber(metric.value)} days`;
    default:
      return formatNumber(metric.value, 2);
  }
}
