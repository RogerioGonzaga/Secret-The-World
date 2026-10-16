import { z } from "zod";
import type { City, Country, Currency } from "@/lib/domain/types";
import { COST_ITEMS, INDICATORS } from "@/lib/domain/types";
import { sourceById } from "./seed/sources";

/** Esquemas de validação usados no carregamento dos dados (e no script `npm run data:validate`). */

const provenanceSchema = z.object({
  sourceId: z.string().refine((id) => sourceById.has(id), { message: "Fonte não registrada" }),
  collectedAt: z.string().nullable(),
  referenceDate: z.string().nullable(),
  verified: z.boolean(),
  currency: z.string().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
  nextUpdate: z.string().nullable().optional(),
});

const positive = z.number().finite().nonnegative();

const citySchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug deve ser kebab-case sem acentos"),
  name: z.string().min(1),
  countrySlug: z.string().min(1),
  coordinates: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
  timezone: z.string().includes("/"),
  population: z.object({ value: positive.nullable(), provenance: provenanceSchema }),
  costs: z.object({
    currency: z.string().length(3),
    items: z.object(Object.fromEntries(COST_ITEMS.map((k) => [k, positive])) as Record<(typeof COST_ITEMS)[number], typeof positive>),
    provenance: provenanceSchema,
  }),
  salaries: z.object({
    currency: z.string().length(3),
    basis: z.literal("gross_monthly"),
    median: positive.nullable(),
    byProfession: z.record(z.string(), positive),
    provenance: provenanceSchema,
  }),
  quality: z.object(
    Object.fromEntries(
      INDICATORS.map((k) => [k, z.object({ score: z.number().min(0).max(100).nullable(), provenance: provenanceSchema })]),
    ),
  ),
  climate: z.object({
    type: z.enum(["quente", "ameno", "frio"]),
    summary: z.string(),
    monthlyHighC: z.object({ value: z.array(z.number()).length(12).nullable(), provenance: provenanceSchema }),
  }),
});

export class DatasetError extends Error {}

export function validateDataset(data: { cities: City[]; countries: Country[]; currencies: Currency[] }) {
  const countrySlugs = new Set(data.countries.map((c) => c.slug));
  const currencyCodes = new Set(data.currencies.map((c) => c.code));
  const seen = new Set<string>();
  const errors: string[] = [];

  for (const country of data.countries) {
    if (!currencyCodes.has(country.currencyCode)) errors.push(`${country.slug}: moeda ${country.currencyCode} não cadastrada`);
  }

  for (const city of data.cities) {
    if (seen.has(city.slug)) errors.push(`${city.slug}: slug duplicado`);
    seen.add(city.slug);
    if (!countrySlugs.has(city.countrySlug)) errors.push(`${city.slug}: país ${city.countrySlug} inexistente`);
    const result = citySchema.safeParse(city);
    if (!result.success) {
      for (const issue of result.error.issues) errors.push(`${city.slug}.${issue.path.join(".")}: ${issue.message}`);
    }
    const country = data.countries.find((c) => c.slug === city.countrySlug);
    if (country && city.costs.currency !== country.currencyCode) {
      errors.push(`${city.slug}: custos em ${city.costs.currency}, mas a moeda do país é ${country.currencyCode}`);
    }
    // Aluguel familiar deve ser maior que o individual: protege contra trocas de colunas no seed.
    if (city.costs.items.rent3Center < city.costs.items.rent1Center) errors.push(`${city.slug}: aluguel de 3 quartos menor que o de 1 quarto`);
  }

  if (errors.length) throw new DatasetError(`Dados inválidos:\n- ${errors.join("\n- ")}`);
}
