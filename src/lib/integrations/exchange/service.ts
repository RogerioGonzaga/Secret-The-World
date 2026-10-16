import { showDemoData } from "@/lib/config";
import { fetchLatestEur } from "./frankfurter";
import type { ExchangeSnapshot, RateKind } from "./types";

/**
 * Serviço de câmbio (somente servidor). Ordem de preferência:
 * 1. Taxas atuais da Frankfurter/BCE (cache de 1 hora via fetch do Next.js).
 * 2. Última resposta válida mantida em memória, exibida com sua data ("cached").
 * 3. Em modo demonstrativo: taxas fixas DEMONSTRATIVAS, sinalizadas na interface.
 * 4. Caso contrário: "unavailable" — a interface explica que o dado não está conectado.
 */

/** Paridade fixa oficial do dirham dos Emirados com o dólar (Banco Central dos EAU). */
const AED_PER_USD = 3.6725;

/**
 * Taxas demonstrativas (unidades por 1 EUR). NÃO são cotações: valores arredondados
 * para permitir testar a interface sem conexão. Nunca usadas no modo de produção.
 */
export const DEMO_RATES: Record<string, number> = {
  EUR: 1, USD: 1.1, BRL: 6, GBP: 0.85, CAD: 1.5, MXN: 20, THB: 38, JPY: 160, SGD: 1.47, AUD: 1.65,
  AED: 4.04, CZK: 25, ZAR: 20, ARS: 1100, COP: 4500,
};

let lastGood: ExchangeSnapshot | null = null;

function withDerived(rates: Record<string, number>, kinds: Record<string, RateKind>) {
  if (rates.USD && !rates.AED) {
    rates.AED = rates.USD * AED_PER_USD;
    kinds.AED = "derived";
  }
}

function demoSnapshot(message: string): ExchangeSnapshot {
  return {
    status: "demo",
    base: "EUR",
    referenceDate: null,
    fetchedAt: null,
    rates: { ...DEMO_RATES },
    rateKinds: Object.fromEntries(Object.keys(DEMO_RATES).map((k) => [k, "demo" as const])),
    sourceId: "livora-demo",
    message,
  };
}

export async function getExchangeSnapshot(fetchImpl?: Parameters<typeof fetchLatestEur>[0]): Promise<ExchangeSnapshot> {
  try {
    const { referenceDate, rates } = await fetchLatestEur(fetchImpl);
    const rateKinds: Record<string, RateKind> = Object.fromEntries(Object.keys(rates).map((k) => [k, "live" as const]));
    withDerived(rates, rateKinds);
    // Moedas fora da cobertura do BCE (ARS, COP) só recebem taxa demonstrativa no modo demo.
    if (showDemoData) {
      for (const [code, value] of Object.entries(DEMO_RATES)) {
        if (!(code in rates)) {
          rates[code] = value;
          rateKinds[code] = "demo";
        }
      }
    }
    const snapshot: ExchangeSnapshot = {
      status: "live",
      base: "EUR",
      referenceDate,
      fetchedAt: new Date().toISOString(),
      rates,
      rateKinds,
      sourceId: "frankfurter-ecb",
    };
    lastGood = snapshot;
    return snapshot;
  } catch (error) {
    if (lastGood) {
      return { ...lastGood, status: "cached", message: "Não foi possível atualizar agora; exibindo a última cotação obtida." };
    }
    const reason = error instanceof Error ? error.message : "erro desconhecido";
    if (showDemoData) {
      return demoSnapshot(`Serviço de câmbio indisponível (${reason}). Usando taxas demonstrativas.`);
    }
    return {
      status: "unavailable",
      base: "EUR",
      referenceDate: null,
      fetchedAt: null,
      rates: {},
      rateKinds: {},
      sourceId: "frankfurter-ecb",
      message: "O serviço de câmbio não está disponível no momento.",
    };
  }
}

/** Apenas para testes. */
export function __resetExchangeCache() {
  lastGood = null;
}
