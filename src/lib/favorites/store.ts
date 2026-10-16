"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";
import { MAX_COMPARE } from "@/lib/compare/compare";
import { DEFAULT_CHECKLIST } from "./checklist";

/**
 * Persistência local do planejamento (favoritos, anotações, checklist e lista de comparação).
 * Fica apenas no navegador do visitante (localStorage) — nada é enviado ao servidor.
 * Uma futura sincronização com conta (Supabase) deve implementar a mesma forma de dados:
 * ver supabase/migrations e docs/arquitetura.md.
 */

const STORAGE_KEY = "livora:planner:v1";

export const favoriteStatusLabels = {
  considerar: "Considerando",
  visitar: "Quero visitar",
  decidido: "Decidido",
} as const;
export type FavoriteStatus = keyof typeof favoriteStatusLabels;

const favoriteSchema = z.object({
  slug: z.string().max(80),
  addedAt: z.string(),
  note: z.string().max(2000).default(""),
  status: z.enum(["considerar", "visitar", "decidido"]).default("considerar"),
});

const checklistItemSchema = z.object({
  id: z.string(),
  label: z.string().max(200),
  done: z.boolean(),
});

const stateSchema = z.object({
  version: z.literal(1),
  favorites: z.array(favoriteSchema).max(200),
  checklist: z.array(checklistItemSchema).max(200),
  compare: z.array(z.string()).max(MAX_COMPARE),
});

export type Favorite = z.infer<typeof favoriteSchema>;
export type ChecklistItem = z.infer<typeof checklistItemSchema>;
export type PlannerState = z.infer<typeof stateSchema>;


function initialState(): PlannerState {
  return {
    version: 1,
    favorites: [],
    checklist: DEFAULT_CHECKLIST.map((label, i) => ({ id: `default-${i}`, label, done: false })),
    compare: [],
  };
}

let state: PlannerState = initialState();
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = stateSchema.safeParse(JSON.parse(raw));
      if (parsed.success) state = parsed.data;
    }
  } catch {
    // Armazenamento bloqueado (navegação privada etc.): segue com o estado em memória.
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignorado: o estado continua válido durante a sessão.
  }
}

function set(next: PlannerState) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    loaded = false;
    load();
    listeners.forEach((l) => l());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const serverState = initialState();

export function usePlanner(): PlannerState {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => serverState,
  );
}

export const planner = {
  isFavorite: (slug: string) => state.favorites.some((f) => f.slug === slug),
  toggleFavorite(slug: string) {
    load();
    const exists = state.favorites.some((f) => f.slug === slug);
    set({
      ...state,
      favorites: exists
        ? state.favorites.filter((f) => f.slug !== slug)
        : [...state.favorites, { slug, addedAt: new Date().toISOString(), note: "", status: "considerar" }],
    });
  },
  updateFavorite(slug: string, patch: Partial<Pick<Favorite, "note" | "status">>) {
    load();
    set({ ...state, favorites: state.favorites.map((f) => (f.slug === slug ? { ...f, ...patch } : f)) });
  },
  /** Adiciona/remove da comparação. Retorna false se a lista já estiver cheia. */
  toggleCompare(slug: string): boolean {
    load();
    if (state.compare.includes(slug)) {
      set({ ...state, compare: state.compare.filter((s) => s !== slug) });
      return true;
    }
    if (state.compare.length >= MAX_COMPARE) return false;
    set({ ...state, compare: [...state.compare, slug] });
    return true;
  },
  setCompare(slugs: string[]) {
    load();
    set({ ...state, compare: slugs.slice(0, MAX_COMPARE) });
  },
  toggleChecklist(id: string) {
    load();
    set({ ...state, checklist: state.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)) });
  },
  addChecklist(label: string) {
    load();
    const clean = label.trim().slice(0, 200);
    if (!clean) return;
    set({ ...state, checklist: [...state.checklist, { id: `c-${Date.now()}`, label: clean, done: false }] });
  },
  removeChecklist(id: string) {
    load();
    set({ ...state, checklist: state.checklist.filter((c) => c.id !== id) });
  },
  importFavorites(slugs: string[]) {
    load();
    const existing = new Set(state.favorites.map((f) => f.slug));
    const added = slugs
      .filter((s) => !existing.has(s))
      .map((slug) => ({ slug, addedAt: new Date().toISOString(), note: "", status: "considerar" as const }));
    set({ ...state, favorites: [...state.favorites, ...added] });
  },
  clearAll() {
    set(initialState());
  },
};
