import { z } from "zod";
import type { HistoryPoint } from "./types";

/**
 * Adaptador da Frankfurter API (https://frankfurter.dev): API aberta, sem chave,
 * que redistribui as taxas de referência do Banco Central Europeu.
 * A URL base pode ser trocada por uma instância própria (FRANKFURTER_BASE_URL).
 */

export const FRANKFURTER_CURRENCIES = [
  "AUD", "BGN", "BRL", "CAD", "CHF", "CNY", "CZK", "DKK", "EUR", "GBP", "HKD", "HUF", "IDR", "ILS", "INR",
  "ISK", "JPY", "KRW", "MXN", "MYR", "NOK", "NZD", "PHP", "PLN", "RON", "SEK", "SGD", "THB", "TRY", "USD", "ZAR",
] as const;

const baseUrl = () => (process.env.FRANKFURTER_BASE_URL ?? "https://api.frankfurter.dev/v1").replace(/\/$/, "");

const latestSchema = z.object({
  base: z.string().length(3),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rates: z.record(z.string().length(3), z.number().positive()),
});

const seriesSchema = z.object({
  base: z.string().length(3),
  rates: z.record(z.string(), z.record(z.string().length(3), z.number().positive())),
});

type FetchLike = (input: string, init?: RequestInit & { next?: { revalidate?: number } }) => Promise<Response>;

async function getJson(url: string, fetchImpl: FetchLike, revalidate: number) {
  const res = await fetchImpl(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(6000),
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`Frankfurter respondeu ${res.status}`);
  return res.json();
}

export async function fetchLatestEur(fetchImpl: FetchLike = fetch) {
  const json = await getJson(`${baseUrl()}/latest?base=EUR`, fetchImpl, 3600);
  const parsed = latestSchema.parse(json);
  const rates: Record<string, number> = { ...parsed.rates, EUR: 1 };
  return { referenceDate: parsed.date, rates };
}

export async function fetchHistory(
  base: string,
  symbol: string,
  start: string,
  end: string,
  fetchImpl: FetchLike = fetch,
): Promise<HistoryPoint[]> {
  const json = await getJson(`${baseUrl()}/${start}..${end}?base=${base}&symbols=${symbol}`, fetchImpl, 6 * 3600);
  const parsed = seriesSchema.parse(json);
  return Object.entries(parsed.rates)
    .map(([date, r]) => ({ date, rate: r[symbol] }))
    .filter((p): p is HistoryPoint => typeof p.rate === "number")
    .sort((a, b) => a.date.localeCompare(b.date));
}
