import type { CitySize, ClimateType, Destination, ProfessionId, Setting } from "@/lib/domain/types";
import { professionLabels } from "@/lib/domain/catalog";
import { convert } from "@/lib/integrations/exchange/convert";
import type { ExchangeSnapshot } from "@/lib/integrations/exchange/types";
import { clamp } from "@/lib/utils";
import { computeBudget, type Household } from "./cost-of-living";
import { estimateNetMonthly } from "./tax";

/**
 * Compatibilidade entre as respostas do questionário e cada destino.
 * Não é um modelo científico: é uma soma ponderada transparente de critérios simples.
 * Cada critério informa seu peso, quanto pontuou e por quê. Critérios sem dados
 * entram em "informações desconhecidas" e não contam no total.
 */

export type Importance = 0 | 1 | 2 | 3;
export type Preference<T> = T | "indiferente";

export interface QuizAnswers {
  budget: number | null;
  budgetCurrency: string;
  income: number | null;
  incomeCurrency: string;
  profession: ProfessionId | null;
  climate: Preference<ClimateType>;
  languages: string[];
  size: Preference<CitySize>;
  safety: Importance;
  career: Importance;
  settings: Setting[];
  remote: boolean;
  household: Household;
  /** Opcional, ISO alpha-2. Usado apenas para destacar observações migratórias. Fica só no navegador. */
  nationality: string | null;
}

export const defaultAnswers: QuizAnswers = {
  budget: null,
  budgetCurrency: "BRL",
  income: null,
  incomeCurrency: "BRL",
  profession: null,
  climate: "indiferente",
  languages: ["Português"],
  size: "indiferente",
  safety: 2,
  career: 1,
  settings: [],
  remote: false,
  household: "individual",
  nationality: null,
};

export interface CriterionResult {
  id: string;
  label: string;
  weight: number;
  /** 0–1, ou null se desconhecido. */
  fraction: number | null;
  explanation: string;
}

export interface CompatibilityResult {
  slug: string;
  /** 0–100 sobre os critérios com dados. */
  score: number;
  criteria: CriterionResult[];
  reasons: string[];
  attention: string[];
  unknowns: string[];
  nationalityNote?: string;
}

/** Países onde o inglês é amplamente usado no trabalho, mesmo sem ser língua oficial. */
const ENGLISH_FRIENDLY = new Set(["paises-baixos", "emirados-arabes-unidos", "singapura"]);

function interpolate(x: number, points: [number, number][]) {
  if (x <= points[0]![0]) return points[0]![1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i]!;
    const [x0, y0] = points[i - 1]!;
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return points[points.length - 1]![1];
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

export function scoreDestination(
  dest: Destination,
  answers: QuizAnswers,
  snapshot: ExchangeSnapshot | null,
): CompatibilityResult {
  const criteria: CriterionResult[] = [];
  const cost = computeBudget(dest.costs, "intermediario", answers.household).total;

  // 1. Orçamento (ou renda, para quem trabalha remotamente e mantém a renda).
  const money = answers.budget ?? (answers.remote ? answers.income : null);
  const moneyCurrency = answers.budget !== null ? answers.budgetCurrency : answers.incomeCurrency;
  if (money !== null && money > 0) {
    const local = convert(money, moneyCurrency, dest.currency.code, snapshot);
    if (local === null) {
      criteria.push({ id: "budget", label: "Orçamento", weight: 30, fraction: null, explanation: `Sem cotação entre ${moneyCurrency} e ${dest.currency.code}.` });
    } else {
      const ratio = local / cost;
      const fraction = interpolate(ratio, [[0.7, 0], [0.85, 0.35], [1, 0.75], [1.15, 1]]);
      criteria.push({
        id: "budget",
        label: "Orçamento",
        weight: 30,
        fraction,
        explanation:
          ratio >= 1
            ? `Seu orçamento cobre cerca de ${pct(ratio)} do custo intermediário estimado.`
            : `Seu orçamento cobre apenas cerca de ${pct(ratio)} do custo intermediário estimado.`,
      });
    }
  }

  // 2. Carreira: salário local da profissão vs. custo de vida.
  if (answers.career > 0 && answers.profession) {
    const weight = 6 * answers.career;
    const gross = dest.salaries.byProfession[answers.profession];
    const label = `Carreira (${professionLabels[answers.profession]})`;
    const net = gross !== undefined ? estimateNetMonthly(gross, dest.country.taxModel) : null;
    if (!net) {
      criteria.push({ id: "career", label, weight, fraction: null, explanation: gross === undefined ? "Sem dado salarial para a profissão." : "Sem dados tributários para estimar o salário líquido." });
    } else {
      const ratio = net.net / cost;
      criteria.push({
        id: "career",
        label,
        weight,
        fraction: interpolate(ratio, [[0.8, 0], [1, 0.4], [1.6, 1]]),
        explanation: `O salário líquido estimado da profissão equivale a ${pct(ratio)} do custo de vida intermediário.`,
      });
    }
  }

  // 3. Segurança.
  if (answers.safety > 0) {
    const s = dest.quality.safety.score;
    criteria.push({
      id: "safety",
      label: "Segurança",
      weight: 4 * answers.safety,
      fraction: s === null ? null : s / 100,
      explanation: s === null ? "Indicador de segurança indisponível." : `Indicador de segurança: ${s}/100.`,
    });
  }

  // 4. Clima.
  if (answers.climate !== "indiferente") {
    const t = dest.climate.type;
    const fraction = t === answers.climate ? 1 : t === "ameno" || answers.climate === "ameno" ? 0.5 : 0;
    criteria.push({ id: "climate", label: "Clima", weight: 10, fraction, explanation: `Clima predominante: ${t}.` });
  }

  // 5. Idioma.
  const spoken = new Set(answers.languages);
  const local = dest.country.languages.map((l) => l.split(" ")[0]!);
  const speaksLocal = local.some((l) => spoken.has(l));
  const englishOk = spoken.has("Inglês") && (local.includes("Inglês") || ENGLISH_FRIENDLY.has(dest.country.slug));
  criteria.push({
    id: "language",
    label: "Idioma",
    weight: 12,
    fraction: speaksLocal ? 1 : englishOk ? 0.7 : 0,
    explanation: speaksLocal
      ? `Você fala ${local.find((l) => spoken.has(l))}, idioma local.`
      : englishOk
        ? "O inglês é amplamente usado, mas o idioma local ajuda na integração."
        : `Idioma principal: ${dest.country.languages[0]}, que você não indicou falar.`,
  });

  // 6. Porte da cidade.
  if (answers.size !== "indiferente") {
    criteria.push({
      id: "size",
      label: "Porte da cidade",
      weight: 6,
      fraction: dest.size === answers.size ? 1 : 0.3,
      explanation: `Porte: cidade ${dest.size}.`,
    });
  }

  // 7. Ambiente (praia, natureza, urbano).
  if (answers.settings.length > 0) {
    const overlap = answers.settings.filter((s) => dest.settings.includes(s));
    criteria.push({
      id: "settings",
      label: "Estilo de vida",
      weight: 8,
      fraction: overlap.length / answers.settings.length,
      explanation: overlap.length ? `Combina com: ${overlap.join(", ")}.` : "Não oferece o ambiente que você priorizou.",
    });
  }

  // 8. Trabalho remoto.
  if (answers.remote) {
    const internet = dest.quality.internet.score;
    const fraction = internet === null ? (dest.work.remoteFriendly ? 0.6 : 0.2) : dest.work.remoteFriendly ? 0.6 + 0.4 * (internet / 100) : 0.3 * (internet / 100);
    criteria.push({
      id: "remote",
      label: "Trabalho remoto",
      weight: 10,
      fraction,
      explanation: dest.work.remoteFriendly
        ? "Destino com histórico de receptividade a profissionais remotos."
        : "Há menos opções de residência voltadas a trabalhadores remotos.",
    });
  }

  // 9. Família: educação.
  if (answers.household === "familia") {
    const e = dest.quality.education.score;
    criteria.push({
      id: "education",
      label: "Educação (família)",
      weight: 8,
      fraction: e === null ? null : e / 100,
      explanation: e === null ? "Indicador de educação indisponível." : `Indicador de educação: ${e}/100.`,
    });
  }

  const known = criteria.filter((c) => c.fraction !== null);
  const max = known.reduce((s, c) => s + c.weight, 0);
  const got = known.reduce((s, c) => s + c.weight * c.fraction!, 0);
  const score = max > 0 ? Math.round(clamp((got / max) * 100, 0, 100)) : 0;

  const reasons = known.filter((c) => c.fraction! >= 0.75).sort((a, b) => b.weight - a.weight).map((c) => c.explanation);
  const attention = known.filter((c) => c.fraction! < 0.4).sort((a, b) => b.weight - a.weight).map((c) => c.explanation);
  const unknowns = criteria.filter((c) => c.fraction === null).map((c) => `${c.label}: ${c.explanation}`);
  const nationalityNote = answers.nationality ? dest.country.immigration.nationalityNotes?.[answers.nationality] : undefined;

  return { slug: dest.slug, score, criteria, reasons, attention, unknowns, nationalityNote };
}

export function rankDestinations(dests: Destination[], answers: QuizAnswers, snapshot: ExchangeSnapshot | null) {
  return dests
    .map((d) => ({ dest: d, result: scoreDestination(d, answers, snapshot) }))
    .sort((a, b) => b.result.score - a.result.score || a.dest.name.localeCompare(b.dest.name));
}
