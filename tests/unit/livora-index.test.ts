import { computeLivoraIndex, INDEX_WEIGHTS } from "@/lib/calc/livora-index";
import { getDestination } from "@/lib/data/repository";
import type { Destination } from "@/lib/domain/types";

const lisboa = getDestination("lisboa-portugal")!;

function withScores(dest: Destination, score: number | null): Destination {
  const quality = Object.fromEntries(Object.entries(dest.quality).map(([k, v]) => [k, { ...v, score }])) as Destination["quality"];
  return { ...dest, quality };
}

describe("Índice Partiu Morar", () => {
  it("pesos somam 1", () => {
    expect(Object.values(INDEX_WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it("componentes somam o valor final", () => {
    const idx = computeLivoraIndex(lisboa);
    const sum = idx.components.reduce((s, c) => s + (c.contribution ?? 0), 0);
    expect(idx.value).toBe(Math.round(sum));
    expect(idx.isDemo).toBe(true);
  });

  it("renormaliza pesos quando falta um componente", () => {
    const chiangMai = getDestination("chiang-mai-tailandia")!; // qualidade do ar indisponível
    const idx = computeLivoraIndex(chiangMai);
    expect(idx.components.find((c) => c.id === "air")!.contribution).toBeNull();
    expect(idx.coverage).toBeCloseTo(1 - INDEX_WEIGHTS.air);
    expect(idx.value).not.toBeNull();
  });

  it("não calcula com cobertura insuficiente", () => {
    const idx = computeLivoraIndex(withScores(lisboa, null));
    expect(idx.value).toBeNull();
  });

  it("índice com todos os indicadores em 100 depende só da acessibilidade", () => {
    const idx = computeLivoraIndex(withScores(lisboa, 100));
    expect(idx.value).toBeGreaterThanOrEqual(85);
  });
});
