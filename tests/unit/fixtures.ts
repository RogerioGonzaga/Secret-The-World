import type { ExchangeSnapshot } from "@/lib/integrations/exchange/types";

export const snapshot: ExchangeSnapshot = {
  status: "live",
  base: "EUR",
  referenceDate: "2026-10-15",
  fetchedAt: "2026-10-15T15:00:00Z",
  rates: { EUR: 1, BRL: 6, USD: 1.2, THB: 40, CAD: 1.5, GBP: 0.8, JPY: 160, SGD: 1.5, AUD: 1.6, MXN: 20, CZK: 25, ZAR: 20, AED: 4.4 },
  rateKinds: { EUR: "live", BRL: "live", USD: "live", THB: "live", CAD: "live", GBP: "live", JPY: "live", SGD: "live", AUD: "live", MXN: "live", CZK: "live", ZAR: "live", AED: "derived" },
  sourceId: "frankfurter-ecb",
};

export const unavailable: ExchangeSnapshot = { ...snapshot, status: "unavailable", rates: {}, rateKinds: {} };
