import { calculatePurchasingPower } from "@/lib/calc/purchasing-power";
import { computeBudget } from "@/lib/calc/cost-of-living";
import { getDestination } from "@/lib/data/repository";
import { snapshot, unavailable } from "./fixtures";

const lisboa = getDestination("lisboa-portugal")!;
const buenosAires = getDestination("buenos-aires-argentina")!;

describe("calculadora de poder de compra", () => {
  it("converte renda líquida em BRL para EUR e calcula a sobra", () => {
    const r = calculatePurchasingPower({ income: 18000, incomeCurrency: "BRL", incomeBasis: "net", household: "individual", profile: "intermediario" }, lisboa, snapshot);
    expect(r.status).toBe("ok");
    expect(r.incomeLocal).toBeCloseTo(3000);
    const expenses = computeBudget(lisboa.costs, "intermediario", "individual").total;
    expect(r.remaining).toBeCloseTo(3000 - expenses);
    expect(r.commitment).toBeCloseTo(expenses / 3000);
    expect(r.annualSavings).toBeCloseTo((3000 - expenses) * 12);
    expect(r.net.method).toBe("informed");
  });

  it("estima o líquido a partir do bruto quando há modelo tributário", () => {
    const r = calculatePurchasingPower({ income: 3000, incomeCurrency: "EUR", incomeBasis: "gross", household: "individual", profile: "economico" }, lisboa, snapshot);
    expect(r.net.method).toBe("estimated");
    expect(r.net.value).toBeCloseTo(3000 * (1 - 0.27));
  });

  it("não trata bruto como líquido quando faltam dados tributários", () => {
    const r = calculatePurchasingPower({ income: 2000000, incomeCurrency: "ARS", incomeBasis: "gross", household: "individual", profile: "intermediario" }, buenosAires, snapshot);
    expect(r.status).toBe("needs_net");
    expect(r.remaining).toBeNull();
    expect(r.net.value).toBeNull();
  });

  it("informa falta de cotação em vez de usar taxa inventada", () => {
    const r = calculatePurchasingPower({ income: 10000, incomeCurrency: "BRL", incomeBasis: "net", household: "individual", profile: "intermediario" }, lisboa, unavailable);
    expect(r.status).toBe("no_rate");
    expect(r.remaining).toBeNull();
  });

  it("gera cenários para os três perfis", () => {
    const r = calculatePurchasingPower({ income: 2500, incomeCurrency: "EUR", incomeBasis: "net", household: "familia", profile: "intermediario" }, lisboa, snapshot);
    expect(r.scenarios.map((s) => s.profile)).toEqual(["economico", "intermediario", "confortavel"]);
    expect(r.scenarios[0]!.remaining!).toBeGreaterThan(r.scenarios[2]!.remaining!);
  });

  it("rejeita renda inválida", () => {
    const r = calculatePurchasingPower({ income: 0, incomeCurrency: "EUR", incomeBasis: "net", household: "individual", profile: "intermediario" }, lisboa, snapshot);
    expect(r.status).toBe("invalid");
  });
});
