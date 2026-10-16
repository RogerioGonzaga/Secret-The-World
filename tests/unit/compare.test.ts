import { compareDestinations, parseCompareSlugs } from "@/lib/compare/compare";
import { getDestination, getDestinations } from "@/lib/data/repository";
import { snapshot } from "./fixtures";

const a = getDestination("lisboa-portugal")!;
const b = getDestination("berlim-alemanha")!;
const c = getDestination("bangkok-tailandia")!;

describe("comparador", () => {
  it("converte valores monetários para a mesma moeda", () => {
    const r = compareDestinations([a, c], { profile: "intermediario", household: "individual", displayCurrency: "EUR", profession: null }, snapshot);
    const cost = r.rows.find((row) => row.id === "cost")!;
    expect(cost.values.every((v) => v !== null)).toBe(true);
    expect(cost.values[1]).toBeLessThan(cost.values[0]!);
  });

  it("aponta forças e fraquezas sem vencedor universal", () => {
    const r = compareDestinations([a, b, c], { profile: "intermediario", household: "individual", displayCurrency: "BRL", profession: "software" }, snapshot);
    expect(r.highlights).toHaveLength(3);
    const total = r.highlights.flatMap((h) => h.strengths);
    expect(total.length).toBeGreaterThan(0);
    expect(r.highlights.every((h) => h.strengths.length < r.rows.length)).toBe(true);
  });

  it("sinaliza dados demonstrativos", () => {
    const r = compareDestinations([a, b], { profile: "economico", household: "familia", displayCurrency: "EUR", profession: null }, snapshot);
    expect(r.warnings.some((w) => w.includes("demonstrativos"))).toBe(true);
  });

  it("aceita no máximo 3 cidades válidas e sem duplicatas na URL", () => {
    const valid = new Set(getDestinations().map((d) => d.slug));
    expect(parseCompareSlugs("lisboa-portugal,lisboa-portugal,xpto,porto-portugal,madrid-espanha,berlim-alemanha", valid)).toEqual([
      "lisboa-portugal",
      "porto-portugal",
      "madrid-espanha",
    ]);
  });
});
