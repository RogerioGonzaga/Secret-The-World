import { computeBudget, referenceMonthlyCost } from "@/lib/calc/cost-of-living";
import { getDestination } from "@/lib/data/repository";

const lisboa = getDestination("lisboa-portugal")!;

describe("computeBudget", () => {
  it("soma todas as categorias do perfil intermediário individual", () => {
    const b = computeBudget(lisboa.costs, "intermediario", "individual");
    const i = lisboa.costs.items;
    const expected = (i.rent1Center + i.rent1Outside) / 2 + i.groceries + i.restaurants + i.transport + i.utilities + i.internet + i.health + i.leisure + i.misc;
    expect(b.total).toBeCloseTo(expected);
    expect(b.lines).toHaveLength(9);
    expect(b.currency).toBe("EUR");
  });

  it("usa aluguel de 1 quarto fora do centro no perfil econômico e no centro no confortável", () => {
    expect(computeBudget(lisboa.costs, "economico", "individual").lines[0]!.amount).toBe(lisboa.costs.items.rent1Outside);
    expect(computeBudget(lisboa.costs, "confortavel", "individual").lines[0]!.amount).toBe(lisboa.costs.items.rent1Center);
  });

  it("usa aluguel de 3 quartos para família e nunca mistura com o individual", () => {
    const fam = computeBudget(lisboa.costs, "economico", "familia");
    expect(fam.lines[0]!.amount).toBe(lisboa.costs.items.rent3Outside);
    expect(fam.total).toBeGreaterThan(computeBudget(lisboa.costs, "economico", "individual").total);
  });

  it("ordena os perfis de gasto de forma crescente", () => {
    const [e, m, c] = (["economico", "intermediario", "confortavel"] as const).map((p) => computeBudget(lisboa.costs, p, "individual").total);
    expect(e).toBeLessThan(m!);
    expect(m).toBeLessThan(c!);
  });

  it("referenceMonthlyCost equivale ao intermediário individual", () => {
    expect(referenceMonthlyCost(lisboa.costs)).toBe(computeBudget(lisboa.costs, "intermediario", "individual").total);
  });
});
