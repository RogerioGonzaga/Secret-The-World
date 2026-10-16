import type { ExchangeSnapshot, RateKind } from "./types";

/** Converte um valor entre duas moedas usando taxas cruzadas via EUR. Retorna null se faltar taxa. */
export function convert(amount: number, from: string, to: string, snapshot: ExchangeSnapshot | null): number | null {
  if (from === to) return amount;
  if (!snapshot || snapshot.status === "unavailable") return null;
  const rFrom = snapshot.rates[from];
  const rTo = snapshot.rates[to];
  if (!rFrom || !rTo) return null;
  return (amount / rFrom) * rTo;
}

/** Taxa de 1 unidade de `from` em `to`. */
export function rate(from: string, to: string, snapshot: ExchangeSnapshot | null): number | null {
  return convert(1, from, to, snapshot);
}

/** Pior natureza entre as taxas envolvidas (demo > derived > live). */
export function conversionKind(from: string, to: string, snapshot: ExchangeSnapshot | null): RateKind | null {
  if (from === to) return "live";
  if (!snapshot) return null;
  const kinds = [snapshot.rateKinds[from], snapshot.rateKinds[to]];
  if (kinds.some((k) => k === undefined)) return null;
  if (kinds.includes("demo")) return "demo";
  if (kinds.includes("derived")) return "derived";
  return "live";
}
