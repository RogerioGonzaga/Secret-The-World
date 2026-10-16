import { defaultAnswers, rankDestinations, scoreDestination } from "@/lib/calc/compatibility";
import { getDestination, getDestinations } from "@/lib/data/repository";
import { snapshot, unavailable } from "./fixtures";

describe("questionário de destino ideal", () => {
  it("valoriza o idioma falado", () => {
    const lisboa = scoreDestination(getDestination("lisboa-portugal")!, defaultAnswers, snapshot);
    const toquio = scoreDestination(getDestination("toquio-japao")!, defaultAnswers, snapshot);
    expect(lisboa.criteria.find((c) => c.id === "language")!.fraction).toBe(1);
    expect(toquio.criteria.find((c) => c.id === "language")!.fraction).toBe(0);
  });

  it("orçamento baixo penaliza destinos caros", () => {
    const answers = { ...defaultAnswers, budget: 6000, budgetCurrency: "BRL" };
    const ranked = rankDestinations(getDestinations(), answers, snapshot);
    const budget = (slug: string) => ranked.find((r) => r.dest.slug === slug)!.result.criteria.find((c) => c.id === "budget")!.fraction!;
    expect(budget("chiang-mai-tailandia")).toBeGreaterThan(budget("londres-reino-unido"));
  });

  it("lista critérios sem dados como desconhecidos, sem contar no total", () => {
    const answers = { ...defaultAnswers, budget: 5000 };
    const r = scoreDestination(getDestination("lisboa-portugal")!, answers, unavailable);
    expect(r.unknowns.length).toBeGreaterThan(0);
    expect(r.criteria.find((c) => c.id === "budget")!.fraction).toBeNull();
  });

  it("explica a recomendação e mostra observação por nacionalidade", () => {
    const answers = { ...defaultAnswers, nationality: "BR", climate: "ameno" as const };
    const r = scoreDestination(getDestination("lisboa-portugal")!, answers, snapshot);
    expect(r.reasons.length).toBeGreaterThan(0);
    expect(r.nationalityNote).toMatch(/CPLP/);
  });

  it("pontuação fica entre 0 e 100", () => {
    for (const { result } of rankDestinations(getDestinations(), { ...defaultAnswers, remote: true, household: "familia", profession: "software", career: 3 }, snapshot)) {
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    }
  });
});
