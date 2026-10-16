"use client";

import { useMemo, useSyncExternalStore } from "react";
import { z } from "zod";
import { defaultAnswers, type QuizAnswers } from "@/lib/calc/compatibility";

/** Respostas do questionário ficam somente no navegador (localStorage). */
const KEY = "livora:quiz:v1";

const schema = z.object({
  budget: z.number().nonnegative().nullable(),
  budgetCurrency: z.string().length(3),
  income: z.number().nonnegative().nullable(),
  incomeCurrency: z.string().length(3),
  profession: z.enum(["software", "enfermagem", "professor", "design", "financas", "marketing", "atendimento", "engenharia"]).nullable(),
  climate: z.enum(["quente", "ameno", "frio", "indiferente"]),
  languages: z.array(z.string().max(30)).max(10),
  size: z.enum(["grande", "media", "pequena", "indiferente"]),
  safety: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  career: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  settings: z.array(z.enum(["praia", "natureza", "urbano"])),
  remote: z.boolean(),
  household: z.enum(["individual", "familia"]),
  nationality: z.string().length(2).nullable(),
});

export function loadQuizAnswers(): QuizAnswers | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? { ...defaultAnswers, ...parsed.data } : null;
  } catch {
    return null;
  }
}

export function saveQuizAnswers(answers: QuizAnswers) {
  try {
    localStorage.setItem(KEY, JSON.stringify(answers));
    listeners.forEach((l) => l());
  } catch {
    // Armazenamento indisponível: o resultado continua visível nesta página.
  }
}

export function clearQuizAnswers() {
  try {
    localStorage.removeItem(KEY);
    listeners.forEach((l) => l());
  } catch {
    // ignorado
  }
}

const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Respostas salvas, lidas de forma segura para hidratação (null no servidor). */
export function useStoredQuizAnswers(): QuizAnswers | null {
  const raw = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      window.addEventListener("storage", cb);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", cb);
      };
    },
    readRaw,
    () => null,
  );
  return useMemo(() => (raw ? loadQuizAnswers() : null), [raw]);
}
