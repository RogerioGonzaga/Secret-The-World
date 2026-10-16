import type { Currency } from "@/lib/domain/types";

export const currencies: Currency[] = [
  { code: "BRL", name: "Real brasileiro", symbol: "R$", decimals: 2 },
  { code: "USD", name: "Dólar americano", symbol: "US$", decimals: 2 },
  { code: "EUR", name: "Euro", symbol: "€", decimals: 2 },
  { code: "GBP", name: "Libra esterlina", symbol: "£", decimals: 2 },
  { code: "CAD", name: "Dólar canadense", symbol: "C$", decimals: 2 },
  { code: "MXN", name: "Peso mexicano", symbol: "MX$", decimals: 0 },
  { code: "THB", name: "Baht tailandês", symbol: "฿", decimals: 0 },
  { code: "JPY", name: "Iene japonês", symbol: "¥", decimals: 0 },
  { code: "SGD", name: "Dólar de Singapura", symbol: "S$", decimals: 2 },
  { code: "AUD", name: "Dólar australiano", symbol: "A$", decimals: 2 },
  { code: "AED", name: "Dirham dos Emirados", symbol: "AED", decimals: 0 },
  { code: "CZK", name: "Coroa tcheca", symbol: "Kč", decimals: 0 },
  { code: "ZAR", name: "Rand sul-africano", symbol: "R", decimals: 0 },
  { code: "ARS", name: "Peso argentino", symbol: "AR$", decimals: 0 },
  { code: "COP", name: "Peso colombiano", symbol: "COL$", decimals: 0 },
];

export const currencyByCode = new Map(currencies.map((c) => [c.code, c]));

/** Moedas que o usuário pode escolher para informar renda/orçamento. */
export const userCurrencies = ["BRL", "USD", "EUR", "GBP", "CAD", "AUD", "MXN"] as const;
