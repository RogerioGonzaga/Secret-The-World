import { getDestinations, getArticles } from "@/lib/data/repository";
import { validateDataset, DatasetError } from "@/lib/data/validation";
import { cities } from "@/lib/data/seed/cities";
import { countries } from "@/lib/data/seed/countries";
import { currencies } from "@/lib/data/seed/currencies";
import { sourceById } from "@/lib/data/seed/sources";

describe("integridade do conjunto de dados", () => {
  it("todas as cidades resolvem país e moeda", () => {
    for (const d of getDestinations()) {
      expect(d.country).toBeDefined();
      expect(d.currency.code).toBe(d.country.currencyCode);
    }
  });

  it("toda proveniência aponta para uma fonte registrada", () => {
    for (const d of getDestinations()) {
      expect(sourceById.has(d.costs.provenance.sourceId)).toBe(true);
      expect(sourceById.has(d.population.provenance.sourceId)).toBe(true);
    }
  });

  it("dados demonstrativos são marcados como não verificados", () => {
    for (const d of getDestinations()) {
      if (d.costs.provenance.sourceId === "livora-demo") expect(d.costs.provenance.verified).toBe(false);
    }
  });

  it("detecta slugs duplicados", () => {
    expect(() => validateDataset({ cities: [...cities, cities[0]!], countries, currencies })).toThrow(DatasetError);
  });

  it("artigos têm slug único", () => {
    const slugs = getArticles().map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
