import { currencyByCode } from "@/lib/data/seed/currencies";
import type { DataKind } from "@/lib/domain/types";

const LOCALE = "pt-BR";

export function formatMoney(value: number | null | undefined, code: string, opts: { compact?: boolean } = {}) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const decimals = currencyByCode.get(code)?.decimals ?? 2;
  const abs = Math.abs(value);
  const fractionDigits = opts.compact || abs >= 1000 ? 0 : decimals;
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: code,
    notation: opts.compact && abs >= 100000 ? "compact" : "standard",
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: digits }).format(value);
}

export function formatPercent(fraction: number | null | undefined, digits = 0) {
  if (fraction === null || fraction === undefined || !Number.isFinite(fraction)) return "—";
  return new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits: digits }).format(fraction);
}

export function formatDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", timeZoneName: "short" } : {}),
    timeZone: withTime ? undefined : "UTC",
  }).format(d);
}

export function formatPopulation(value: number | null) {
  if (value === null) return "Dados indisponíveis";
  if (value >= 1_000_000) return `${formatNumber(value / 1_000_000, 1)} milhões`;
  return `${formatNumber(Math.round(value / 1000))} mil`;
}

export const dataKindLabels: Record<DataKind, string> = {
  official: "Dado oficial",
  third_party: "Dado de terceiros",
  estimate: "Estimativa",
  user: "Informado por você",
  demo: "Dado demonstrativo",
};

/** Hora local atual em um fuso IANA, ex.: "14:32". */
export function localTime(timezone: string, date = new Date()) {
  return new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit", timeZone: timezone }).format(date);
}

export function utcOffset(timezone: string, date = new Date()) {
  const part = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "shortOffset" })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName")?.value;
  return part?.replace("GMT", "UTC") ?? "";
}
