import type { ClimateType, ContinentId } from "@/lib/domain/types";
import { continents } from "@/lib/domain/catalog";
import { defaultFilters, type CostLevel, type ExploreFilters, type SortKey, type ViewMode, type WorkFilter } from "./filters";

/** Converte filtros em parâmetros de URL compartilháveis (omitindo os valores padrão). */

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

function get(params: Params, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | null {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

function num(value: string | undefined, min: number, max: number): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

const CURRENCY_RE = /^[A-Z]{3}$/;

export function parseFilters(params: Params): ExploreFilters {
  const budgetCurrency = get(params, "moedaOrcamento");
  const currency = get(params, "moeda");
  return {
    q: (get(params, "q") ?? "").slice(0, 80),
    continent: oneOf<ContinentId>(get(params, "continente"), Object.keys(continents) as ContinentId[]),
    budgetMax: num(get(params, "orcamento"), 1, 1e9),
    budgetCurrency: budgetCurrency && CURRENCY_RE.test(budgetCurrency) ? budgetCurrency : defaultFilters.budgetCurrency,
    currency: currency && CURRENCY_RE.test(currency) ? currency : null,
    language: (get(params, "idioma") ?? "").slice(0, 30) || null,
    climate: oneOf<ClimateType>(get(params, "clima"), ["quente", "ameno", "frio"]),
    safetyMin: num(get(params, "seguranca"), 0, 100),
    cost: oneOf<CostLevel>(get(params, "custo"), ["baixo", "medio", "alto"]),
    work: oneOf<WorkFilter>(get(params, "trabalho"), ["cobre", "folga"]),
    sort: oneOf<SortKey>(get(params, "ordem"), ["relevancia", "custo", "salario", "qualidade", "compatibilidade", "nome"]) ?? "relevancia",
    view: oneOf<ViewMode>(get(params, "visao"), ["grade", "mapa"]) ?? "grade",
    page: num(get(params, "pagina"), 1, 1000) ?? 1,
  };
}

export function serializeFilters(f: ExploreFilters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.continent) p.set("continente", f.continent);
  if (f.budgetMax !== null) {
    p.set("orcamento", String(f.budgetMax));
    if (f.budgetCurrency !== defaultFilters.budgetCurrency) p.set("moedaOrcamento", f.budgetCurrency);
  }
  if (f.currency) p.set("moeda", f.currency);
  if (f.language) p.set("idioma", f.language);
  if (f.climate) p.set("clima", f.climate);
  if (f.safetyMin !== null) p.set("seguranca", String(f.safetyMin));
  if (f.cost) p.set("custo", f.cost);
  if (f.work) p.set("trabalho", f.work);
  if (f.sort !== "relevancia") p.set("ordem", f.sort);
  if (f.view !== "grade") p.set("visao", f.view);
  if (f.page > 1) p.set("pagina", String(f.page));
  return p.toString();
}

export function activeFilterCount(f: ExploreFilters) {
  return [f.continent, f.budgetMax, f.currency, f.language, f.climate, f.safetyMin, f.cost, f.work].filter((v) => v !== null).length;
}
