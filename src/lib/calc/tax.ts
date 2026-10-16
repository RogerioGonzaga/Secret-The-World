import type { TaxModel } from "@/lib/domain/types";

export interface NetEstimate {
  net: number;
  /** Percentual total deduzido do bruto. */
  effectiveRate: number;
  description: string;
}

/** Imposto anual por faixas marginais. */
export function progressiveTax(annualIncome: number, brackets: { upTo: number | null; rate: number }[]) {
  let tax = 0;
  let lower = 0;
  for (const b of brackets) {
    const upper = b.upTo ?? Infinity;
    if (annualIncome <= lower) break;
    const taxable = Math.min(annualIncome, upper) - lower;
    tax += taxable * b.rate;
    lower = upper;
  }
  return tax;
}

/**
 * Estima o salário líquido mensal a partir do bruto mensal.
 * Retorna null quando o país não tem modelo tributário cadastrado — nesse caso o bruto
 * NUNCA deve ser tratado como líquido.
 */
export function estimateNetMonthly(grossMonthly: number, model: TaxModel | null): NetEstimate | null {
  if (!model || grossMonthly < 0) return null;
  if (model.kind === "flat_estimate") {
    return { net: grossMonthly * (1 - model.deductionRate), effectiveRate: model.deductionRate, description: model.description };
  }
  const annual = grossMonthly * model.paymentsPerYear;
  const deductions = progressiveTax(annual, model.brackets) + annual * model.socialRate;
  const netAnnual = annual - deductions;
  return {
    net: netAnnual / 12,
    effectiveRate: annual > 0 ? deductions / annual : 0,
    description: model.description,
  };
}
