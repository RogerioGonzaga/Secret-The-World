import { getDestinations } from "@/lib/data/repository";
import { applyFilters, defaultFilters, paginate, sortDestinations, monthlyCostEur } from "@/lib/explore/filters";
import { parseFilters, serializeFilters } from "@/lib/explore/url-state";
import { convert } from "@/lib/integrations/exchange/convert";
import { referenceMonthlyCost } from "@/lib/calc/cost-of-living";
import { snapshot, unavailable } from "./fixtures";

const all = getDestinations();

describe("filtros do explorador", () => {
  it("filtra por continente", () => {
    const r = applyFilters(all, { ...defaultFilters, continent: "asia" }, snapshot);
    expect(r.total).toBeGreaterThan(0);
    expect(r.results.every((d) => d.country.continent === "asia")).toBe(true);
  });

  it("busca sem acento e por país", () => {
    expect(applyFilters(all, { ...defaultFilters, q: "toquio" }, snapshot).results.map((d) => d.slug)).toEqual(["toquio-japao"]);
    expect(applyFilters(all, { ...defaultFilters, q: "portugal" }, snapshot).total).toBe(2);
  });

  it("orçamento máximo exclui destinos mais caros", () => {
    const budget = 9000;
    const r = applyFilters(all, { ...defaultFilters, budgetMax: budget, budgetCurrency: "BRL" }, snapshot);
    for (const d of r.results) {
      expect(convert(referenceMonthlyCost(d.costs), d.currency.code, "BRL", snapshot)!).toBeLessThanOrEqual(budget);
    }
    expect(r.total).toBeLessThan(all.length);
  });

  it("sinaliza filtros que dependem de câmbio quando ele está indisponível", () => {
    const r = applyFilters(all, { ...defaultFilters, budgetMax: 5000 }, unavailable);
    expect(r.skipped).toHaveLength(1);
  });

  it("filtro de segurança exclui destinos sem dado e conta os excluídos", () => {
    const r = applyFilters(all, { ...defaultFilters, safetyMin: 80 }, snapshot);
    expect(r.results.every((d) => (d.quality.safety.score ?? 0) >= 80)).toBe(true);
  });

  it("ordena por custo crescente em EUR", () => {
    const sorted = sortDestinations(all, "custo", snapshot);
    const costs = sorted.map((d) => monthlyCostEur(d, snapshot)).filter((c): c is number => c !== null);
    expect([...costs].sort((a, b) => a - b)).toEqual(costs);
  });

  it("pagina com carregamento progressivo", () => {
    const p = paginate(all, 1, 9);
    expect(p.items).toHaveLength(9);
    expect(p.hasMore).toBe(true);
    expect(paginate(all, 99, 9).hasMore).toBe(false);
  });

  it("serializa e lê filtros da URL sem perda", () => {
    const f = { ...defaultFilters, q: "lis", continent: "europa" as const, budgetMax: 8000, climate: "ameno" as const, sort: "custo" as const, view: "mapa" as const };
    expect(parseFilters(new URLSearchParams(serializeFilters(f)))).toEqual(f);
    expect(serializeFilters(defaultFilters)).toBe("");
  });

  it("ignora parâmetros inválidos na URL", () => {
    const f = parseFilters(new URLSearchParams("continente=marte&orcamento=-1&ordem=xyz&moeda=<script>"));
    expect(f).toEqual(defaultFilters);
  });
});
