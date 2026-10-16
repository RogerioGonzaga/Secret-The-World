/**
 * Gera supabase/seed.sql a partir dos arquivos de seed em TypeScript.
 * Uso: npm run db:seed-sql
 * Os dados demonstrativos continuam marcados com source_id = 'livora-demo' e verified = false.
 */
import { writeFileSync } from "node:fs";
import { cities } from "../src/lib/data/seed/cities";
import { countries } from "../src/lib/data/seed/countries";
import { currencies } from "../src/lib/data/seed/currencies";
import { sources } from "../src/lib/data/seed/sources";
import { articles } from "../src/lib/data/seed/articles";
import { costItemLabels, indicatorMeta, professionLabels } from "../src/lib/domain/catalog";
import { validateDataset } from "../src/lib/data/validation";

validateDataset({ cities, countries, currencies });

const q = (v: unknown): string => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) return `array[${v.map(q).join(",")}]::text[]`;
  if (typeof v === "object") return `${q(JSON.stringify(v))}::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
};
const row = (table: string, obj: Record<string, unknown>) =>
  `insert into ${table} (${Object.keys(obj).map((k) => `"${k}"`).join(", ")}) values (${Object.values(obj).map(q).join(", ")});`;

const out: string[] = ["-- Gerado por scripts/generate-seed-sql.ts. Não edite à mão.", "begin;"];
for (const s of sources) out.push(row("data_sources", { id: s.id, name: s.name, publisher: s.publisher, url: s.url, kind: s.kind, methodology: s.methodology, limitations: s.limitations, license: s.license, update_frequency: s.updateFrequency }));
for (const c of currencies) out.push(row("currencies", { code: c.code, name: c.name, symbol: c.symbol, decimals: c.decimals }));
for (const [id, v] of Object.entries(costItemLabels)) out.push(row("cost_categories", { id, label: v.label, detail: v.detail }));
for (const [id, label] of Object.entries(professionLabels)) out.push(row("professions", { id, label }));
for (const [id, m] of Object.entries(indicatorMeta)) out.push(row("indicators", { id, label: m.label, methodology: m.methodology, limitations: m.limitations }));

for (const c of countries) {
  out.push(row("countries", { slug: c.slug, name: c.name, iso2: c.iso2, continent: c.continent, currency_code: c.currencyCode, languages: c.languages, remote_work: c.remoteWork, practical: c.practical }));
  out.push(row("immigration_info", { country_slug: c.slug, summary: c.immigration.summary, pathways: c.immigration.pathways, nationality_notes: c.immigration.nationalityNotes ?? {}, last_verified: c.immigration.lastVerified }));
  if (c.taxModel) out.push(row("tax_models", { country_slug: c.slug, model: c.taxModel, description: c.taxModel.description, source_id: c.taxModel.provenance.sourceId, reference_period: c.taxModel.provenance.referenceDate, verified: c.taxModel.provenance.verified }));
  for (const [kind, links] of [["immigration", c.immigration.links], ["jobs", c.jobPortals], ["housing", c.housingPortals]] as const)
    for (const l of links) out.push(row("external_links", { country_slug: c.slug, kind, label: l.label, url: l.url, link_type: l.type, affiliate: l.affiliate ?? false }));
}

for (const c of cities) {
  out.push(row("cities", { slug: c.slug, name: c.name, country_slug: c.countrySlug, lat: c.coordinates.lat, lng: c.coordinates.lng, timezone: c.timezone, size: c.size, settings: c.settings, climate_type: c.climate.type, climate_summary: c.climate.summary, summary: c.summary, pros: c.pros, cons: c.cons, tags: c.tags, image: c.image, work: c.work, housing: c.housing, published: true }));
  const p = c.population.provenance;
  out.push(row("city_population", { city_slug: c.slug, value: c.population.value, source_id: p.sourceId, collected_at: p.collectedAt, reference_period: p.referenceDate, notes: p.notes, verified: p.verified }));
  const cp = c.costs.provenance;
  for (const [cat, amount] of Object.entries(c.costs.items)) out.push(row("city_costs", { city_slug: c.slug, category_id: cat, amount, currency_code: c.costs.currency, source_id: cp.sourceId, collected_at: cp.collectedAt, reference_period: cp.referenceDate ?? "", verified: cp.verified }));
  const sp = c.salaries.provenance;
  const salaryRows: [string | null, number | null][] = [[null, c.salaries.median], ...Object.entries(c.salaries.byProfession)];
  for (const [prof, v] of salaryRows) if (v !== null) out.push(row("city_salaries", { city_slug: c.slug, profession_id: prof, gross_monthly: v, currency_code: c.salaries.currency, source_id: sp.sourceId, collected_at: sp.collectedAt, reference_period: sp.referenceDate ?? "", verified: sp.verified }));
  for (const [ind, v] of Object.entries(c.quality)) out.push(row("city_indicators", { city_slug: c.slug, indicator_id: ind, score: v.score, source_id: v.provenance.sourceId, collected_at: v.provenance.collectedAt, reference_period: v.provenance.referenceDate, verified: v.provenance.verified }));
}

for (const a of articles) out.push(row("articles", { slug: a.slug, title: a.title, excerpt: a.excerpt, category: a.category, body: a.body, author: a.author, reading_minutes: a.readingMinutes, related_destinations: a.relatedDestinations ?? [], published_at: a.publishedAt, updated_at: a.updatedAt }));
out.push("commit;");

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), out.join("\n") + "\n");
console.log(`supabase/seed.sql gerado com ${out.length - 3} instruções.`);
