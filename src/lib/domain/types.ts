/**
 * Modelos de domínio do Partiu Morar. Toda informação quantitativa carrega sua proveniência
 * para que a interface possa mostrar fonte, data e natureza do dado.
 */

/** Natureza do dado, exibida ao usuário. */
export type DataKind = "official" | "third_party" | "estimate" | "user" | "demo";

export interface Source {
  id: string;
  name: string;
  publisher?: string;
  url?: string;
  kind: DataKind;
  methodology: string;
  limitations: string;
  license?: string;
  updateFrequency?: string;
}

export interface Provenance {
  sourceId: string;
  /** Data em que o dado foi coletado (ISO). */
  collectedAt: string | null;
  /** Período a que o dado se refere (ex.: "2024", "2026-10"). */
  referenceDate: string | null;
  currency?: string;
  unit?: string;
  notes?: string;
  /** Próxima atualização prevista (ISO), quando aplicável. */
  nextUpdate?: string | null;
  /** Indica se a equipe já conferiu o valor na fonte original. */
  verified: boolean;
}

export interface Sourced<T> {
  value: T | null;
  provenance: Provenance;
}

export interface ExternalLink {
  label: string;
  url: string;
  /** "official" para órgãos de governo; "portal" para serviços privados. */
  type: "official" | "portal";
  /** Links afiliados devem ser sempre sinalizados (monetização futura). */
  affiliate?: boolean;
}

export type ContinentId =
  | "europa"
  | "america-do-norte"
  | "america-do-sul"
  | "asia"
  | "oceania"
  | "africa";

export type ClimateType = "quente" | "ameno" | "frio";
export type CitySize = "grande" | "media" | "pequena";
export type Setting = "praia" | "natureza" | "urbano";

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  /** Casas decimais usuais na exibição. */
  decimals: number;
}

export type TaxModel =
  | {
      kind: "flat_estimate";
      /** Percentual estimado de imposto de renda + contribuições do empregado sobre o bruto. */
      deductionRate: number;
      description: string;
      provenance: Provenance;
    }
  | {
      kind: "progressive";
      /** Faixas anuais na moeda local; `upTo` nulo = sem teto. */
      brackets: { upTo: number | null; rate: number }[];
      /** Contribuições sociais do empregado, sobre o bruto. */
      socialRate: number;
      /** Quantos salários por ano (ex.: 14 em Portugal). */
      paymentsPerYear: number;
      description: string;
      provenance: Provenance;
    };

export interface ImmigrationInfo {
  summary: string;
  pathways: { title: string; description: string }[];
  /** Observações específicas por nacionalidade, quando conhecidas (chave ISO alpha-2). */
  nationalityNotes?: Record<string, string>;
  links: ExternalLink[];
  /** Data da última verificação editorial (ISO) ou null se ainda não verificado. */
  lastVerified: string | null;
}

export interface Country {
  slug: string;
  name: string;
  iso2: string;
  continent: ContinentId;
  currencyCode: string;
  languages: string[];
  immigration: ImmigrationInfo;
  taxModel: TaxModel | null;
  jobPortals: ExternalLink[];
  housingPortals: ExternalLink[];
  practical: {
    language: string;
    health: string;
    education: string;
    connectivity: string;
  };
  remoteWork: string;
}

export const COST_ITEMS = [
  "rent1Center",
  "rent1Outside",
  "rent3Center",
  "rent3Outside",
  "groceries",
  "restaurants",
  "transport",
  "utilities",
  "internet",
  "health",
  "leisure",
  "misc",
] as const;
export type CostItemId = (typeof COST_ITEMS)[number];

export interface CostData {
  currency: string;
  /** Valores mensais de referência para UMA pessoa em perfil intermediário (aluguéis por tipo de imóvel). */
  items: Record<CostItemId, number>;
  provenance: Provenance;
}

export const PROFESSIONS = [
  "software",
  "enfermagem",
  "professor",
  "design",
  "financas",
  "marketing",
  "atendimento",
  "engenharia",
] as const;
export type ProfessionId = (typeof PROFESSIONS)[number];

export interface SalaryData {
  currency: string;
  /** Sempre salário BRUTO mensal (antes de impostos e contribuições). */
  basis: "gross_monthly";
  median: number | null;
  byProfession: Partial<Record<ProfessionId, number>>;
  provenance: Provenance;
}

export const INDICATORS = [
  "safety",
  "health",
  "education",
  "mobility",
  "air",
  "climate",
  "internet",
  "green",
  "culture",
] as const;
export type IndicatorId = (typeof INDICATORS)[number];

export interface Indicator {
  /** Escala 0–100, maior é melhor. null = dados indisponíveis. */
  score: number | null;
  provenance: Provenance;
}

export interface CityImage {
  url: string;
  alt: string;
  credit: string;
  creditUrl: string;
}

export interface City {
  slug: string;
  name: string;
  countrySlug: string;
  coordinates: { lat: number; lng: number };
  timezone: string;
  population: Sourced<number>;
  size: CitySize;
  settings: Setting[];
  image: CityImage;
  summary: string;
  pros: string[];
  cons: string[];
  climate: {
    type: ClimateType;
    summary: string;
    monthlyHighC: Sourced<number[]>;
  };
  costs: CostData;
  salaries: SalaryData;
  quality: Record<IndicatorId, Indicator>;
  work: {
    demandAreas: string[];
    remoteFriendly: boolean;
    modes: string;
  };
  housing: {
    types: string[];
    centerVsOutside: string;
  };
  tags: CityTag[];
}

export type CityTag = "tendencia" | "remoto" | "oportunidades" | "economico";

/** Cidade com dados do país já resolvidos — formato usado pela interface. */
export interface Destination extends City {
  country: Country;
  currency: Currency;
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  readingMinutes: number;
  publishedAt: string;
  updatedAt: string;
  author: string;
  /** Blocos simples de conteúdo; facilita migrar para CMS/MDX depois. */
  body: ArticleBlock[];
  relatedDestinations?: string[];
}

export type ArticleCategory = "planejamento" | "financas" | "carreira" | "destinos";

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "callout"; text: string };
