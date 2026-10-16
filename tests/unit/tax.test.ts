import { estimateNetMonthly, progressiveTax } from "@/lib/calc/tax";
import { DEMO } from "@/lib/data/seed/sources";

describe("impostos", () => {
  it("aplica alíquota efetiva no modelo simplificado", () => {
    const r = estimateNetMonthly(2000, { kind: "flat_estimate", deductionRate: 0.25, description: "", provenance: DEMO });
    expect(r!.net).toBe(1500);
  });

  it("calcula faixas progressivas de forma marginal", () => {
    const brackets = [{ upTo: 10000, rate: 0 }, { upTo: 30000, rate: 0.2 }, { upTo: null, rate: 0.4 }];
    expect(progressiveTax(5000, brackets)).toBe(0);
    expect(progressiveTax(30000, brackets)).toBe(4000);
    expect(progressiveTax(40000, brackets)).toBe(8000);
  });

  it("modelo progressivo considera contribuições e número de salários", () => {
    const r = estimateNetMonthly(1000, {
      kind: "progressive",
      brackets: [{ upTo: null, rate: 0.1 }],
      socialRate: 0.1,
      paymentsPerYear: 14,
      description: "",
      provenance: DEMO,
    });
    // 14.000 anuais - 20% = 11.200 / 12 meses
    expect(r!.net).toBeCloseTo(933.33, 1);
    expect(r!.effectiveRate).toBeCloseTo(0.2);
  });

  it("retorna null sem modelo tributário (bruto nunca vira líquido)", () => {
    expect(estimateNetMonthly(1000, null)).toBeNull();
  });
});
