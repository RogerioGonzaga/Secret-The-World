import type { Provenance, Source } from "@/lib/domain/types";

/**
 * Registro de fontes. Toda proveniência aponta para um id daqui.
 * Fontes "demo" existem apenas para desenvolvimento e são ocultadas no modo de produção.
 */
export const sources: Source[] = [
  {
    id: "livora-demo",
    name: "Dados demonstrativos LIVORA",
    kind: "demo",
    methodology:
      "Valores ilustrativos de ordem de grandeza, preparados pela equipe de desenvolvimento para testar a interface e os cálculos. Não foram coletados de uma fonte primária.",
    limitations:
      "Não representam preços, salários ou indicadores reais. Não use para decisões financeiras. Serão substituídos por fontes verificadas antes do lançamento.",
  },
  {
    id: "livora-editorial",
    name: "Pesquisa editorial LIVORA (pendente de verificação)",
    kind: "estimate",
    methodology:
      "Informação geral compilada pela equipe a partir de conhecimento público e de órgãos oficiais citados. Aguarda conferência individual na fonte original.",
    limitations:
      "Pode estar desatualizada ou arredondada. Confira sempre a fonte oficial indicada antes de agir.",
  },
  {
    id: "frankfurter-ecb",
    name: "Frankfurter API (taxas de referência do Banco Central Europeu)",
    publisher: "Frankfurter / Banco Central Europeu",
    url: "https://frankfurter.dev",
    kind: "third_party",
    methodology:
      "Taxas de referência publicadas pelo BCE em dias úteis (por volta de 16h CET) e distribuídas pela API aberta Frankfurter. Conversões entre moedas que não o euro são calculadas de forma cruzada via EUR.",
    limitations:
      "Não são cotações de balcão nem de cartão: bancos e casas de câmbio aplicam spread e tarifas. Cobre apenas cerca de 30 moedas; fins de semana e feriados repetem a última publicação.",
    license: "Dados públicos do BCE; API de código aberto sem chave",
    updateFrequency: "Diária (dias úteis)",
  },
  {
    id: "iso-4217",
    name: "ISO 4217 — códigos de moedas",
    publisher: "International Organization for Standardization",
    url: "https://www.iso.org/iso-4217-currency-codes.html",
    kind: "official",
    methodology: "Padrão internacional de códigos de moeda.",
    limitations: "Não informa valores ou cotações.",
  },
  {
    id: "iana-tz",
    name: "IANA Time Zone Database",
    publisher: "IANA",
    url: "https://www.iana.org/time-zones",
    kind: "official",
    methodology: "Base de referência de fusos horários usada por sistemas operacionais e navegadores.",
    limitations: "O horário de verão pode mudar por decisão de cada governo.",
  },
  {
    id: "user-input",
    name: "Informado por você",
    kind: "user",
    methodology: "Valores digitados por você nas ferramentas da LIVORA.",
    limitations: "Os resultados dependem da exatidão das informações fornecidas.",
  },
];

export const sourceById = new Map(sources.map((s) => [s.id, s]));

/** Proveniência padrão para valores demonstrativos. */
export const DEMO: Provenance = {
  sourceId: "livora-demo",
  collectedAt: "2026-10-01",
  referenceDate: "2026",
  verified: false,
  notes: "Valor demonstrativo para desenvolvimento.",
};

export function editorial(referenceDate: string | null, notes?: string): Provenance {
  return {
    sourceId: "livora-editorial",
    collectedAt: "2026-10-01",
    referenceDate,
    verified: false,
    notes,
  };
}
