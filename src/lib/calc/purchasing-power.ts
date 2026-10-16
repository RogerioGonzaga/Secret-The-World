import type { Destination } from "@/lib/domain/types";
import { convert, conversionKind } from "@/lib/integrations/exchange/convert";
import type { ExchangeSnapshot, RateKind } from "@/lib/integrations/exchange/types";
import { computeBudget, SPENDING_PROFILES, type Budget, type Household, type SpendingProfile } from "./cost-of-living";
import { estimateNetMonthly } from "./tax";

export type IncomeBasis = "gross" | "net";

export interface PurchasingPowerInput {
  income: number;
  incomeCurrency: string;
  incomeBasis: IncomeBasis;
  household: Household;
  profile: SpendingProfile;
}

export interface Scenario {
  profile: SpendingProfile;
  expenses: number;
  remaining: number | null;
  commitment: number | null;
}

export interface PurchasingPowerResult {
  status: "ok" | "needs_net" | "no_rate" | "invalid";
  localCurrency: string;
  /** Renda informada convertida para a moeda local (mesma base informada: bruta ou líquida). */
  incomeLocal: number | null;
  net: { value: number | null; method: "informed" | "estimated" | "unavailable"; effectiveRate?: number };
  budget: Budget;
  remaining: number | null;
  /** Fração da renda líquida comprometida com despesas (0–1+). */
  commitment: number | null;
  annualSavings: number | null;
  scenarios: Scenario[];
  rateKind: RateKind | null;
  assumptions: string[];
  warnings: string[];
}

export function calculatePurchasingPower(
  input: PurchasingPowerInput,
  dest: Destination,
  snapshot: ExchangeSnapshot | null,
): PurchasingPowerResult {
  const localCurrency = dest.currency.code;
  const budget = computeBudget(dest.costs, input.profile, input.household);
  const assumptions = [...budget.assumptions];
  const warnings: string[] = [];

  const base: PurchasingPowerResult = {
    status: "ok",
    localCurrency,
    incomeLocal: null,
    net: { value: null, method: "unavailable" },
    budget,
    remaining: null,
    commitment: null,
    annualSavings: null,
    scenarios: SPENDING_PROFILES.map((p) => ({
      profile: p,
      expenses: computeBudget(dest.costs, p, input.household).total,
      remaining: null,
      commitment: null,
    })),
    rateKind: null,
    assumptions,
    warnings,
  };

  if (!Number.isFinite(input.income) || input.income <= 0) {
    return { ...base, status: "invalid", warnings: ["Informe uma renda mensal maior que zero."] };
  }

  const incomeLocal = convert(input.income, input.incomeCurrency, localCurrency, snapshot);
  const rateKind = conversionKind(input.incomeCurrency, localCurrency, snapshot);
  if (incomeLocal === null) {
    return {
      ...base,
      status: "no_rate",
      warnings: [`Não há cotação disponível entre ${input.incomeCurrency} e ${localCurrency}. Informe a renda diretamente em ${localCurrency}.`],
    };
  }
  if (input.incomeCurrency !== localCurrency) {
    assumptions.push(
      rateKind === "demo"
        ? "Conversão feita com taxa DEMONSTRATIVA, não com cotação real."
        : "Conversão pela taxa de referência, sem spread bancário ou tarifas.",
    );
  }
  if (rateKind === "demo") warnings.push("A taxa de câmbio usada é demonstrativa.");

  let net: PurchasingPowerResult["net"];
  if (input.incomeBasis === "net") {
    net = { value: incomeLocal, method: "informed" };
  } else {
    const estimate = estimateNetMonthly(incomeLocal, dest.country.taxModel);
    if (!estimate) {
      return {
        ...base,
        status: "needs_net",
        incomeLocal,
        rateKind,
        warnings: [
          ...warnings,
          `Ainda não temos dados tributários de ${dest.country.name}. O valor bruto não será tratado como líquido: informe sua renda líquida para calcular o que sobra.`,
        ],
      };
    }
    net = { value: estimate.net, method: "estimated", effectiveRate: estimate.effectiveRate };
    assumptions.push(
      `Líquido estimado com dedução de ${(estimate.effectiveRate * 100).toFixed(0)}% (${estimate.description}). Supõe residência fiscal e contratação local no destino.`,
    );
    if (dest.country.taxModel?.provenance.sourceId === "livora-demo") warnings.push("A alíquota usada para estimar o líquido é demonstrativa.");
  }

  if (input.household === "familia") assumptions.push("Para família, a renda deve ser a soma das rendas do domicílio.");

  const netValue = net.value!;
  const remaining = netValue - budget.total;
  const scenarios = base.scenarios.map((s) => ({
    ...s,
    remaining: netValue - s.expenses,
    commitment: netValue > 0 ? s.expenses / netValue : null,
  }));
  if (remaining < 0) warnings.push("Pelas estimativas, as despesas superam a renda neste perfil.");

  return {
    ...base,
    status: "ok",
    incomeLocal,
    net,
    remaining,
    commitment: netValue > 0 ? budget.total / netValue : null,
    annualSavings: remaining * 12,
    scenarios,
    rateKind,
    assumptions,
    warnings,
  };
}
