import { computeLivoraIndex } from "@/lib/calc/livora-index";
import { referenceMonthlyCost } from "@/lib/calc/cost-of-living";
import { estimateNetMonthly } from "@/lib/calc/tax";
import type { ClimateType, ContinentId, Destination } from "@/lib/domain/types";
import { convert } from "@/lib/integrations/exchange/convert";
import type { ExchangeSnapshot } from "@/lib/integrations/exchange/types";
import { normalizeSearch } from "@/lib/utils";

export type CostLevel = "baixo" | "medio" | "alto";
export type WorkFilter = "cobre" | "folga";
export type SortKey = "relevancia" | "custo" | "salario" | "qualidade" | "compatibilidade" | "nome";
export type ViewMode = "grade" | "mapa";

export interface ExploreFilters {
  q: string;
  continent: ContinentId | null;
  budgetMax: number | null;
  budgetCurrency: string;
  currency: string | null;
  language: string | null;
  climate: ClimateType | null;
  safetyMin: number | null;
  cost: CostLevel | null;
  work: WorkFilter | null;
  sort: SortKey;
  view: ViewMode;
  page: number;
}

export const defaultFilters: ExploreFilters = {
  q: "",
  continent: null,
  budgetMax: null,
  budgetCurrency: "BRL",
  currency: null,
  language: null,
  climate: null,
  safetyMin: null,
  cost: null,
  work: null,
  sort: "relevancia",
  view: "grade",
  page: 1,
};

export const PAGE_SIZE = 9;

/** Faixas de custo em EUR (perfil intermediário, 1 pessoa). Critério exibido na interface. */
export const COST_LEVEL_EUR: Record<CostLevel, { label: string; min: number; max: number }> = {
  baixo: { label: "Baixo", min: 0, max: 1300 },
  medio: { label: "Médio", min: 1300, max: 2300 },
  alto: { label: "Alto", min: 2300, max: Infinity },
};

export const SORT_LABELS: Record<SortKey, string> = {
  relevancia: "Relevância",
  custo: "Menor custo de vida",
  salario: "Maior salário mediano",
  qualidade: "Maior Índice LIVORA",
  compatibilidade: "Compatibilidade com meu perfil",
  nome: "Nome (A–Z)",
};

export const SORT_CRITERIA: Record<SortKey, string> = {
  relevancia: "Destinos em alta primeiro; depois ordem alfabética.",
  custo: "Custo mensal estimado para 1 pessoa no perfil intermediário, convertido para EUR pela taxa de referência.",
  salario: "Salário bruto mensal mediano convertido para EUR. Não considera impostos.",
  qualidade: "Índice LIVORA: média ponderada dos indicadores disponíveis. Veja a metodologia.",
  compatibilidade: "Pontuação a partir das respostas do questionário Meu destino ideal.",
  nome: "Ordem alfabética.",
};

export function monthlyCostEur(dest: Destination, snapshot: ExchangeSnapshot | null) {
  return convert(referenceMonthlyCost(dest.costs), dest.currency.code, "EUR", snapshot);
}

export function costLevel(dest: Destination, snapshot: ExchangeSnapshot | null): CostLevel | null {
  const eur = monthlyCostEur(dest, snapshot);
  if (eur === null) return null;
  return (Object.keys(COST_LEVEL_EUR) as CostLevel[]).find((k) => eur >= COST_LEVEL_EUR[k].min && eur < COST_LEVEL_EUR[k].max) ?? null;
}

/** Salário líquido mediano / custo de referência, na mesma moeda (não depende de câmbio). */
export function salaryCoverage(dest: Destination): number | null {
  if (dest.salaries.median === null) return null;
  const net = estimateNetMonthly(dest.salaries.median, dest.country.taxModel);
  if (!net) return null;
  return net.net / referenceMonthlyCost(dest.costs);
}

export function matchesQuery(dest: Destination, q: string) {
  const query = normalizeSearch(q);
  if (!query) return true;
  const haystack = normalizeSearch([dest.name, dest.country.name, dest.country.continent, dest.currency.code, dest.currency.name, ...dest.country.languages].join(" "));
  return query.split(/\s+/).every((term) => haystack.includes(term));
}

export interface FilterOutcome {
  results: Destination[];
  total: number;
  /** Filtros que não puderam ser aplicados por falta de dados (ex.: sem câmbio). */
  skipped: string[];
  /** Destinos excluídos por não terem o dado exigido pelo filtro. */
  missingData: number;
}

export function applyFilters(
  all: Destination[],
  f: ExploreFilters,
  snapshot: ExchangeSnapshot | null,
  compatibility?: Map<string, number>,
): FilterOutcome {
  const skipped: string[] = [];
  let missingData = 0;

  let list = all.filter((d) => matchesQuery(d, f.q));
  if (f.continent) list = list.filter((d) => d.country.continent === f.continent);
  if (f.currency) list = list.filter((d) => d.currency.code === f.currency);
  if (f.language) list = list.filter((d) => d.country.languages.some((l) => l.startsWith(f.language!)));
  if (f.climate) list = list.filter((d) => d.climate.type === f.climate);

  if (f.safetyMin !== null) {
    list = list.filter((d) => {
      const s = d.quality.safety.score;
      if (s === null) missingData++;
      return s !== null && s >= f.safetyMin!;
    });
  }

  if (f.budgetMax !== null) {
    if (!snapshot || snapshot.status === "unavailable") {
      skipped.push("Orçamento mensal (câmbio indisponível)");
    } else {
      list = list.filter((d) => {
        const cost = convert(referenceMonthlyCost(d.costs), d.currency.code, f.budgetCurrency, snapshot);
        if (cost === null) missingData++;
        return cost !== null && cost <= f.budgetMax!;
      });
    }
  }

  if (f.cost) {
    if (!snapshot || snapshot.status === "unavailable") {
      skipped.push("Custo de vida (câmbio indisponível)");
    } else {
      list = list.filter((d) => {
        const level = costLevel(d, snapshot);
        if (level === null) missingData++;
        return level === f.cost;
      });
    }
  }

  if (f.work) {
    const threshold = f.work === "folga" ? 1.3 : 1;
    list = list.filter((d) => {
      const c = salaryCoverage(d);
      if (c === null) missingData++;
      return c !== null && c >= threshold;
    });
  }

  const sorted = sortDestinations(list, f.sort, snapshot, compatibility);
  return { results: sorted, total: sorted.length, skipped, missingData };
}

/** Itens sem o dado de ordenação vão para o fim, em ordem alfabética. */
export function sortDestinations(
  list: Destination[],
  sort: SortKey,
  snapshot: ExchangeSnapshot | null,
  compatibility?: Map<string, number>,
): Destination[] {
  const byName = (a: Destination, b: Destination) => a.name.localeCompare(b.name, "pt-BR");
  const byMetric = (metric: (d: Destination) => number | null, dir: 1 | -1) => (a: Destination, b: Destination) => {
    const ma = metric(a);
    const mb = metric(b);
    if (ma === null && mb === null) return byName(a, b);
    if (ma === null) return 1;
    if (mb === null) return -1;
    return (ma - mb) * dir || byName(a, b);
  };

  const copy = [...list];
  switch (sort) {
    case "custo":
      return copy.sort(byMetric((d) => monthlyCostEur(d, snapshot), 1));
    case "salario":
      return copy.sort(byMetric((d) => (d.salaries.median === null ? null : convert(d.salaries.median, d.currency.code, "EUR", snapshot)), -1));
    case "qualidade":
      return copy.sort(byMetric((d) => computeLivoraIndex(d).value, -1));
    case "compatibilidade":
      return compatibility ? copy.sort(byMetric((d) => compatibility.get(d.slug) ?? null, -1)) : copy.sort(byName);
    case "nome":
      return copy.sort(byName);
    default:
      return copy.sort((a, b) => Number(b.tags.includes("tendencia")) - Number(a.tags.includes("tendencia")) || byName(a, b));
  }
}

export function paginate<T>(list: T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(Math.max(1, page), pages);
  return { items: list.slice(0, current * size), page: current, pages, hasMore: current < pages };
}
