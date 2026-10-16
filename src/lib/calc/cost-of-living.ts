import type { CostData } from "@/lib/domain/types";

export type SpendingProfile = "economico" | "intermediario" | "confortavel";
export type Household = "individual" | "familia";

export const SPENDING_PROFILES: SpendingProfile[] = ["economico", "intermediario", "confortavel"];

export const profileMeta: Record<SpendingProfile, { label: string; description: string }> = {
  economico: {
    label: "Econômico",
    description: "Aluguel fora do centro, refeições quase sempre em casa e lazer reduzido.",
  },
  intermediario: {
    label: "Intermediário",
    description: "Aluguel na média entre centro e fora do centro, restaurantes ocasionais.",
  },
  confortavel: {
    label: "Confortável",
    description: "Aluguel no centro, restaurantes frequentes e mais lazer.",
  },
};

export const householdMeta: Record<Household, { label: string; description: string }> = {
  individual: { label: "Individual", description: "1 adulto morando em apartamento de 1 quarto." },
  familia: {
    label: "Família",
    description: "2 adultos e 1 criança em apartamento de 3 quartos. Não inclui escola particular nem creche.",
  },
};

export type BudgetCategory =
  | "rent"
  | "groceries"
  | "restaurants"
  | "transport"
  | "utilities"
  | "internet"
  | "health"
  | "leisure"
  | "misc";

export const budgetCategoryLabels: Record<BudgetCategory, string> = {
  rent: "Aluguel",
  groceries: "Supermercado",
  restaurants: "Restaurantes",
  transport: "Transporte público",
  utilities: "Energia e água",
  internet: "Internet",
  health: "Saúde e seguro",
  leisure: "Academia e lazer",
  misc: "Despesas diversas",
};

/**
 * Multiplicadores aplicados sobre os valores de referência (1 pessoa, perfil intermediário).
 * São premissas explícitas do modelo e aparecem na interface.
 */
const PROFILE_FACTORS: Record<SpendingProfile, Partial<Record<BudgetCategory, number>>> = {
  economico: { groceries: 0.85, restaurants: 0.4, utilities: 0.9, health: 0.7, leisure: 0.4, misc: 0.7 },
  intermediario: {},
  confortavel: { groceries: 1.25, restaurants: 1.8, utilities: 1.1, health: 1.3, leisure: 1.6, misc: 1.5 },
};

/** Família: 2 adultos + 1 criança. Transporte considera 2 passes adultos. */
const FAMILY_FACTORS: Partial<Record<BudgetCategory, number>> = {
  groceries: 2.4,
  restaurants: 2.2,
  transport: 2,
  utilities: 1.5,
  health: 2.6,
  leisure: 2.2,
  misc: 2.2,
};

export interface BudgetLine {
  id: BudgetCategory;
  label: string;
  amount: number;
  note?: string;
}

export interface Budget {
  currency: string;
  profile: SpendingProfile;
  household: Household;
  lines: BudgetLine[];
  total: number;
  assumptions: string[];
}

function rentFor(costs: CostData, profile: SpendingProfile, household: Household) {
  const center = household === "familia" ? costs.items.rent3Center : costs.items.rent1Center;
  const outside = household === "familia" ? costs.items.rent3Outside : costs.items.rent1Outside;
  const rooms = household === "familia" ? "3 quartos" : "1 quarto";
  if (profile === "economico") return { amount: outside, note: `${rooms} fora do centro` };
  if (profile === "confortavel") return { amount: center, note: `${rooms} no centro` };
  return { amount: (center + outside) / 2, note: `${rooms}, média entre centro e fora do centro` };
}

export function computeBudget(costs: CostData, profile: SpendingProfile, household: Household): Budget {
  const rent = rentFor(costs, profile, household);
  const base: Record<Exclude<BudgetCategory, "rent">, number> = {
    groceries: costs.items.groceries,
    restaurants: costs.items.restaurants,
    transport: costs.items.transport,
    utilities: costs.items.utilities,
    internet: costs.items.internet,
    health: costs.items.health,
    leisure: costs.items.leisure,
    misc: costs.items.misc,
  };

  const lines: BudgetLine[] = [{ id: "rent", label: budgetCategoryLabels.rent, amount: rent.amount, note: rent.note }];
  for (const [id, value] of Object.entries(base) as [Exclude<BudgetCategory, "rent">, number][]) {
    const p = PROFILE_FACTORS[profile][id] ?? 1;
    const h = household === "familia" ? (FAMILY_FACTORS[id] ?? 1) : 1;
    lines.push({ id, label: budgetCategoryLabels[id], amount: value * p * h });
  }

  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  return {
    currency: costs.currency,
    profile,
    household,
    lines,
    total,
    assumptions: [
      `Composição: ${householdMeta[household].description}`,
      `Perfil ${profileMeta[profile].label.toLowerCase()}: ${profileMeta[profile].description}`,
      "Valores mensais na moeda local. Não incluem custos de mudança, caução, compra de móveis, carro ou impostos sobre a renda.",
      "Saúde considera seguro ou despesas não cobertas por contribuições obrigatórias descontadas do salário.",
    ],
  };
}

/** Custo mensal de referência usado em filtros e rankings: perfil intermediário, individual. */
export function referenceMonthlyCost(costs: CostData) {
  return computeBudget(costs, "intermediario", "individual").total;
}
