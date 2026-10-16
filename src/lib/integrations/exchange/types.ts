export type SnapshotStatus = "live" | "cached" | "demo" | "unavailable";
export type RateKind = "live" | "derived" | "demo";

/** Fotografia das taxas de câmbio, sempre relativa a 1 EUR. */
export interface ExchangeSnapshot {
  status: SnapshotStatus;
  base: "EUR";
  /** Data de referência publicada pela fonte (ex.: dia útil do BCE). */
  referenceDate: string | null;
  /** Momento em que o Partiu Morar buscou os dados. */
  fetchedAt: string | null;
  /** Unidades de cada moeda por 1 EUR. */
  rates: Record<string, number>;
  /** Origem de cada taxa, para sinalizar conversões demonstrativas ou derivadas. */
  rateKinds: Record<string, RateKind>;
  sourceId: string;
  message?: string;
}

export interface HistoryPoint {
  date: string;
  rate: number;
}
