import { computeBudget, type Household, type SpendingProfile } from "@/lib/calc/cost-of-living";
import { computeLivoraIndex } from "@/lib/calc/livora-index";
import { estimateNetMonthly } from "@/lib/calc/tax";
import { indicatorMeta } from "@/lib/domain/catalog";
import type { Destination, IndicatorId, ProfessionId } from "@/lib/domain/types";
import { convert } from "@/lib/integrations/exchange/convert";
import type { ExchangeSnapshot } from "@/lib/integrations/exchange/types";

export const MAX_COMPARE = 3;
export const MIN_COMPARE = 2;

export interface CompareOptions {
  profile: SpendingProfile;
  household: Household;
  displayCurrency: string;
  profession: ProfessionId | null;
}

export type Better = "higher" | "lower" | "none";

export interface CompareRow {
  id: string;
  group: "custos" | "trabalho" | "qualidade" | "geral";
  label: string;
  better: Better;
  /** Valor numérico já na moeda de exibição (quando monetário); null = sem dado. */
  values: (number | null)[];
  /** Texto para cada cidade quando o valor não é numérico. */
  text?: string[];
  format: "money" | "score" | "percent" | "text";
  note?: string;
}

export interface CompareResult {
  rows: CompareRow[];
  /** Destaques por cidade, sem declarar vencedor geral. */
  highlights: { slug: string; strengths: string[]; weaknesses: string[] }[];
  warnings: string[];
}

export function compareDestinations(dests: Destination[], opts: CompareOptions, snapshot: ExchangeSnapshot | null): CompareResult {
  const warnings: string[] = [];
  const rows: CompareRow[] = [];

  const budgets = dests.map((d) => computeBudget(d.costs, opts.profile, opts.household));
  const rents = budgets.map((b) => b.lines.find((l) => l.id === "rent")!.amount);
  const gross = dests.map((d) => (opts.profession ? (d.salaries.byProfession[opts.profession] ?? null) : d.salaries.median));
  const net = dests.map((d, i) => (gross[i] == null ? null : (estimateNetMonthly(gross[i]!, d.country.taxModel)?.net ?? null)));

  const money = (id: string, group: CompareRow["group"], label: string, better: Better, local: (number | null)[], note?: string): CompareRow => ({
    id,
    group,
    label,
    better,
    format: "money",
    values: local.map((v, i) => (v === null ? null : convert(v, dests[i]!.currency.code, opts.displayCurrency, snapshot))),
    note,
  });

  rows.push(money("cost", "custos", "Custo de vida mensal", "lower", budgets.map((b) => b.total)));
  rows.push(money("rent", "custos", "Aluguel", "lower", rents, budgets[0]?.lines[0]?.note));
  rows.push(money("salary", "trabalho", opts.profession ? "Salário bruto da profissão" : "Salário bruto mediano", "higher", gross));
  rows.push(money("net", "trabalho", "Salário líquido estimado", "higher", net, "Estimado com o modelo tributário de cada país; vazio quando não há dados tributários."));
  rows.push(
    money(
      "savings",
      "trabalho",
      "Sobra mensal estimada",
      "higher",
      net.map((n, i) => (n === null ? null : n - budgets[i]!.total)),
      "Salário líquido estimado menos o custo de vida do perfil selecionado.",
    ),
  );
  rows.push({
    id: "power",
    group: "trabalho",
    label: "Poder de compra (líquido ÷ custo)",
    better: "higher",
    format: "percent",
    values: net.map((n, i) => (n === null ? null : n / budgets[i]!.total)),
    note: "Acima de 100% significa que o salário líquido cobre o custo de vida.",
  });

  for (const id of ["safety", "health", "climate", "mobility", "internet"] as IndicatorId[]) {
    rows.push({ id, group: "qualidade", label: indicatorMeta[id].label, better: "higher", format: "score", values: dests.map((d) => d.quality[id].score) });
  }
  rows.push({ id: "index", group: "qualidade", label: "Índice Partiu Morar", better: "higher", format: "score", values: dests.map((d) => computeLivoraIndex(d).value) });

  const text = (id: string, label: string, fn: (d: Destination) => string): CompareRow => ({
    id,
    group: "geral",
    label,
    better: "none",
    format: "text",
    values: dests.map(() => null),
    text: dests.map(fn),
  });
  rows.push(text("currency", "Moeda", (d) => `${d.currency.name} (${d.currency.code})`));
  rows.push(text("language", "Idioma", (d) => d.country.languages.join(", ")));
  rows.push(text("climateType", "Clima", (d) => d.climate.summary));
  rows.push(text("transport", "Transporte", (d) => d.housing.centerVsOutside));
  rows.push(text("demand", "Áreas com demanda", (d) => d.work.demandAreas.join(", ")));

  // Mesma metodologia para todos; sinaliza períodos de referência diferentes.
  const periods = new Set(dests.map((d) => `${d.costs.provenance.referenceDate}|${d.salaries.provenance.referenceDate}`));
  if (periods.size > 1) warnings.push("Os destinos têm dados de períodos de referência diferentes; compare com cautela.");
  if (dests.some((d) => d.costs.provenance.sourceId === "livora-demo")) warnings.push("Custos, salários e indicadores desta comparação são demonstrativos.");
  const needsFx = dests.some((d) => d.currency.code !== opts.displayCurrency);
  if (needsFx && (!snapshot || snapshot.status === "unavailable")) {
    warnings.push("Sem câmbio disponível: valores em moedas diferentes não puderam ser convertidos.");
  }
  if (needsFx && snapshot?.status === "demo") warnings.push("A conversão de moedas usa taxas demonstrativas.");

  const highlights = dests.map((d, i) => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    for (const row of rows) {
      if (row.better === "none") continue;
      const mine = row.values[i];
      const valid = row.values.filter((v): v is number => v !== null);
      if (mine === null || mine === undefined || valid.length < 2) continue;
      const best = row.better === "higher" ? Math.max(...valid) : Math.min(...valid);
      const worst = row.better === "higher" ? Math.min(...valid) : Math.max(...valid);
      if (best === worst) continue;
      if (mine === best) strengths.push(row.label);
      else if (mine === worst) weaknesses.push(row.label);
    }
    return { slug: d.slug, strengths, weaknesses };
  });

  return { rows, highlights, warnings };
}

export function parseCompareSlugs(value: string | undefined | null, valid: Set<string>): string[] {
  if (!value) return [];
  const unique = [...new Set(value.split(",").map((s) => s.trim()).filter((s) => valid.has(s)))];
  return unique.slice(0, MAX_COMPARE);
}
