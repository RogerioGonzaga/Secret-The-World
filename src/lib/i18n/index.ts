import { ptBR } from "./pt-BR";

/**
 * Internacionalização. A versão inicial é publicada apenas em pt-BR, mas os textos de
 * navegação e interface comum ficam centralizados aqui. Para adicionar inglês ou espanhol:
 * 1. Crie `en.ts`/`es.ts` com a mesma forma de `pt-BR.ts` (o tipo `Dictionary` garante as chaves).
 * 2. Adicione o locale em `locales` e roteie por segmento `[locale]` (ver docs/arquitetura.md).
 */
export const locales = ["pt-BR"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pt-BR";

export type Dictionary = typeof ptBR;

const dictionaries: Record<Locale, Dictionary> = { "pt-BR": ptBR };

export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale];
}

export const t = getDictionary();
