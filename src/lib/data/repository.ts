import { showDemoData } from "@/lib/config";
import type { Article, City, Country, Currency, Destination } from "@/lib/domain/types";
import { articles } from "./seed/articles";
import { cities } from "./seed/cities";
import { countries, countryBySlug } from "./seed/countries";
import { currencies, currencyByCode } from "./seed/currencies";
import { validateDataset } from "./validation";

/**
 * Camada de acesso a dados. A interface usa apenas estas funções, para que a origem
 * (arquivos de seed hoje, PostgreSQL/Supabase depois) possa ser trocada sem mudar componentes.
 */

let cache: Destination[] | null = null;

const isDemo = (p: { sourceId: string }) => p.sourceId === "livora-demo";

/**
 * No modo de produção nenhum número demonstrativo chega à interface:
 * - cidades cujo custo de vida ainda é demonstrativo ficam fora do catálogo;
 * - indicadores, salários, temperaturas e modelos tributários demonstrativos viram "indisponível".
 */
function sanitizeForProduction(city: City, country: Country): { city: City; country: Country } | null {
  if (showDemoData) return { city, country };
  if (isDemo(city.costs.provenance)) return null;
  const quality = Object.fromEntries(
    Object.entries(city.quality).map(([k, v]) => [k, isDemo(v.provenance) ? { ...v, score: null } : v]),
  ) as City["quality"];
  return {
    city: {
      ...city,
      quality,
      salaries: isDemo(city.salaries.provenance) ? { ...city.salaries, median: null, byProfession: {} } : city.salaries,
      climate: isDemo(city.climate.monthlyHighC.provenance) ? { ...city.climate, monthlyHighC: { ...city.climate.monthlyHighC, value: null } } : city.climate,
    },
    country: country.taxModel && isDemo(country.taxModel.provenance) ? { ...country, taxModel: null } : country,
  };
}

function resolveDestinations(): Destination[] {
  if (cache) return cache;
  validateDataset({ cities, countries, currencies });
  cache = cities.flatMap((raw) => {
    const resolved = sanitizeForProduction(raw, countryBySlug.get(raw.countrySlug)!);
    if (!resolved) return [];
    const currency = currencyByCode.get(resolved.country.currencyCode)!;
    return [{ ...resolved.city, country: resolved.country, currency }];
  });
  return cache;
}

export function getDestinations(): Destination[] {
  return resolveDestinations();
}

export function getDestination(slug: string): Destination | undefined {
  return resolveDestinations().find((d) => d.slug === slug);
}

export function getCountries(): Country[] {
  return countries;
}

export function getCurrencies(): Currency[] {
  return currencies;
}

export function getCurrency(code: string): Currency | undefined {
  return currencyByCode.get(code);
}

export function getArticles(): Article[] {
  return [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

/** Destinos semelhantes: mesmo continente ou mesmo clima, ordenados por proximidade de custo. */
export function getSimilarDestinations(dest: Destination, limit = 3): Destination[] {
  return resolveDestinations()
    .filter((d) => d.slug !== dest.slug)
    .map((d) => {
      let score = 0;
      if (d.country.continent === dest.country.continent) score += 2;
      if (d.climate.type === dest.climate.type) score += 1;
      for (const s of d.settings) if (dest.settings.includes(s)) score += 0.5;
      for (const t of d.tags) if (dest.tags.includes(t)) score += 0.5;
      return { d, score };
    })
    .sort((a, b) => b.score - a.score || a.d.name.localeCompare(b.d.name))
    .slice(0, limit)
    .map((x) => x.d);
}
