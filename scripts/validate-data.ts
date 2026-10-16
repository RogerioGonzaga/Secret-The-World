/** Valida o conjunto de dados de seed. Uso: npm run data:validate */
import { cities } from "../src/lib/data/seed/cities";
import { countries } from "../src/lib/data/seed/countries";
import { currencies } from "../src/lib/data/seed/currencies";
import { validateDataset } from "../src/lib/data/validation";

try {
  validateDataset({ cities, countries, currencies });
  const demo = cities.filter((c) => c.costs.provenance.sourceId === "livora-demo").length;
  console.log(`OK: ${cities.length} cidades, ${countries.length} países, ${currencies.length} moedas.`);
  if (demo) console.warn(`Atenção: ${demo} cidade(s) ainda usam custos demonstrativos e ficarão ocultas no modo de produção.`);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
