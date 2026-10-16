import { indicatorMeta } from "@/lib/domain/catalog";
import type { Destination, IndicatorId } from "@/lib/domain/types";
import { clamp } from "@/lib/utils";
import { referenceMonthlyCost } from "./cost-of-living";
import { estimateNetMonthly } from "./tax";

/**
 * Índice Partiu Morar: média ponderada dos indicadores de qualidade de vida disponíveis
 * mais um componente de equilíbrio entre renda e custo de vida.
 *
 * - Componentes sem dado são EXCLUÍDOS e os pesos restantes são renormalizados.
 * - Se menos de 60% do peso total tiver dados, o índice não é calculado.
 * - Não é uma verdade absoluta: os componentes são sempre exibidos ao lado do valor.
 */

export type IndexComponentId = IndicatorId | "affordability";

export const INDEX_WEIGHTS: Record<IndexComponentId, number> = {
  safety: 0.15,
  health: 0.12,
  education: 0.08,
  mobility: 0.1,
  air: 0.08,
  climate: 0.07,
  internet: 0.1,
  green: 0.07,
  culture: 0.08,
  affordability: 0.15,
};

export const MIN_COVERAGE = 0.6;

/** Razão salário líquido mediano / custo mensal intermediário mapeada para 0–100. */
export const AFFORDABILITY_RANGE = { min: 0.8, max: 2.5 };

export function affordabilityRatio(dest: Destination): number | null {
  const median = dest.salaries.median;
  if (median === null) return null;
  const net = estimateNetMonthly(median, dest.country.taxModel);
  if (!net) return null;
  const cost = referenceMonthlyCost(dest.costs);
  return cost > 0 ? net.net / cost : null;
}

export function affordabilityScore(dest: Destination): number | null {
  const ratio = affordabilityRatio(dest);
  if (ratio === null) return null;
  const { min, max } = AFFORDABILITY_RANGE;
  return clamp(((ratio - min) / (max - min)) * 100, 0, 100);
}

export interface IndexComponent {
  id: IndexComponentId;
  label: string;
  weight: number;
  score: number | null;
  /** Contribuição em pontos para o índice final (já renormalizada). */
  contribution: number | null;
}

export interface LivoraIndex {
  value: number | null;
  coverage: number;
  components: IndexComponent[];
  isDemo: boolean;
}

export function computeLivoraIndex(dest: Destination, weights = INDEX_WEIGHTS): LivoraIndex {
  const raw = (Object.keys(weights) as IndexComponentId[]).map((id) => {
    const score = id === "affordability" ? affordabilityScore(dest) : dest.quality[id].score;
    const label = id === "affordability" ? "Equilíbrio renda × custo" : indicatorMeta[id].label;
    return { id, label, weight: weights[id], score };
  });
  const totalWeight = raw.reduce((s, c) => s + c.weight, 0);
  const available = raw.filter((c) => c.score !== null);
  const availableWeight = available.reduce((s, c) => s + c.weight, 0);
  const coverage = totalWeight > 0 ? availableWeight / totalWeight : 0;

  const components: IndexComponent[] = raw.map((c) => ({
    ...c,
    contribution: c.score !== null && availableWeight > 0 ? (c.score * c.weight) / availableWeight : null,
  }));

  const value =
    coverage >= MIN_COVERAGE ? components.reduce((s, c) => s + (c.contribution ?? 0), 0) : null;

  const isDemo =
    Object.values(dest.quality).some((q) => q.provenance.sourceId === "livora-demo") ||
    dest.costs.provenance.sourceId === "livora-demo";

  return { value: value === null ? null : Math.round(value), coverage, components, isDemo };
}
