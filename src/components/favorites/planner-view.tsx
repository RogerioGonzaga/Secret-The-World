"use client";

import { useState } from "react";
import Link from "next/link";
import { GitCompareArrows, Heart, ListChecks, Plus, Trash2, X } from "lucide-react";
import type { Destination } from "@/lib/domain/types";
import { favoriteStatusLabels, planner, usePlanner, type FavoriteStatus } from "@/lib/favorites/store";
import { MAX_COMPARE } from "@/lib/compare/compare";
import { referenceMonthlyCost } from "@/lib/calc/cost-of-living";
import { formatMoney } from "@/lib/format";
import { CityImage } from "@/components/ui/city-image";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { ShareButton } from "./actions";
import { cn } from "@/lib/utils";

export function PlannerView({ destinations, sharedSlugs }: { destinations: Destination[]; sharedSlugs: string[] }) {
  const state = usePlanner();
  const [selected, setSelected] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const bySlug = new Map(destinations.map((d) => [d.slug, d]));
  const favorites = state.favorites.filter((f) => bySlug.has(f.slug));
  const shared = sharedSlugs.map((s) => bySlug.get(s)).filter((d): d is Destination => !!d);
  const doneCount = state.checklist.filter((c) => c.done).length;

  return (
    <div className="container-page py-10">
      {shared.length > 0 && (
        <section aria-labelledby="lista-compartilhada" className="mb-12 rounded-3xl border border-teal-200 bg-teal-50 p-6">
          <h2 id="lista-compartilhada" className="text-lg font-semibold text-teal-700">Lista compartilhada com você</h2>
          <p className="mt-1 text-sm text-muted">Listas compartilhadas contêm apenas os destinos, nunca as anotações de quem enviou.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {shared.map((d) => (
              <li key={d.slug}>
                <Link href={`/destinos/${d.slug}`} className="inline-flex rounded-full bg-white px-3 py-1.5 text-sm font-medium ring-1 ring-teal-200 hover:ring-teal-500">{d.name}</Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => planner.importFavorites(shared.map((d) => d.slug))}>
              <Plus aria-hidden /> Adicionar aos meus favoritos
            </Button>
            {shared.length >= 2 && (
              <Link href={`/comparar?cidades=${shared.slice(0, MAX_COMPARE).map((d) => d.slug).join(",")}`} className={buttonVariants({ variant: "outline" })}>
                <GitCompareArrows aria-hidden /> Comparar estes destinos
              </Link>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="meus-favoritos">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="meus-favoritos" className="font-display text-3xl font-medium">Destinos salvos <span className="text-subtle">({favorites.length})</span></h2>
            {favorites.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <ShareButton title="Minha lista de destinos no Partiu Morar" label="Compartilhar lista" url={`/favoritos?lista=${favorites.map((f) => f.slug).join(",")}`} />
                {selected.length >= 2 ? (
                  <Link href={`/comparar?cidades=${selected.join(",")}`} className={buttonVariants({ variant: "secondary" })}>
                    <GitCompareArrows aria-hidden /> Comparar selecionados ({selected.length})
                  </Link>
                ) : (
                  <span className="self-center text-xs text-subtle">Selecione de 2 a 3 para comparar</span>
                )}
              </div>
            )}
          </div>
          {favorites.length === 0 ? (
            <div className="mt-6">
              <EmptyState icon={<Heart />} title="Você ainda não salvou destinos" description="Toque no coração em qualquer destino para guardá-lo aqui, junto com suas anotações.">
                <Link href="/destinos" className={buttonVariants()}>Explorar destinos</Link>
                <Link href="/destino-ideal" className={buttonVariants({ variant: "outline" })}>Descobrir meu destino ideal</Link>
              </EmptyState>
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {favorites.map((f) => {
                const d = bySlug.get(f.slug)!;
                const isSel = selected.includes(f.slug);
                return (
                  <li key={f.slug} className={cn("grid overflow-hidden rounded-2xl border bg-white sm:grid-cols-[11rem_1fr]", isSel ? "border-teal-500 ring-2 ring-teal-500/20" : "border-sand-200")}>
                    <CityImage src={d.image.url} alt="" name={d.name} sizes="11rem" className="h-36 sm:h-full" />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link href={`/destinos/${d.slug}`} className="text-lg font-semibold hover:text-teal-700">{d.name}</Link>
                          <p className="text-sm text-muted">{d.country.name} · {formatMoney(referenceMonthlyCost(d.costs), d.currency.code)}/mês</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-navy-800 hover:bg-sand-100">
                            <input
                              type="checkbox"
                              className="accent-teal-600"
                              checked={isSel}
                              disabled={!isSel && selected.length >= MAX_COMPARE}
                              onChange={() => setSelected(isSel ? selected.filter((s) => s !== f.slug) : [...selected, f.slug])}
                            />
                            Comparar
                          </label>
                          <button type="button" onClick={() => planner.toggleFavorite(f.slug)} className="grid size-8 place-items-center rounded-lg text-subtle hover:bg-sand-100 hover:text-copper-600" aria-label={`Remover ${d.name} dos favoritos`}>
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-[10rem_1fr]">
                        <div>
                          <label htmlFor={`st-${f.slug}`} className="sr-only">Status de {d.name}</label>
                          <select id={`st-${f.slug}`} className="input h-9 text-sm" value={f.status} onChange={(e) => planner.updateFavorite(f.slug, { status: e.target.value as FavoriteStatus })}>
                            {(Object.keys(favoriteStatusLabels) as FavoriteStatus[]).map((s) => <option key={s} value={s}>{favoriteStatusLabels[s]}</option>)}
                          </select>
                        </div>
                        <div>
                          <label htmlFor={`nt-${f.slug}`} className="sr-only">Anotações sobre {d.name}</label>
                          <textarea
                            id={`nt-${f.slug}`}
                            rows={2}
                            maxLength={2000}
                            placeholder="Anotações pessoais (ficam só neste navegador)"
                            className="w-full resize-y rounded-xl border border-sand-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 focus:outline-none"
                            defaultValue={f.note}
                            onBlur={(e) => planner.updateFavorite(f.slug, { note: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section id="checklist" aria-labelledby="checklist-title" className="scroll-mt-24">
          <div className="rounded-2xl border border-sand-200 bg-white p-5">
            <h2 id="checklist-title" className="flex items-center gap-2 font-semibold"><ListChecks className="size-5 text-teal-600" aria-hidden /> Checklist de mudança</h2>
            <p className="mt-1 text-xs text-subtle">{doneCount} de {state.checklist.length} concluídos</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-100" aria-hidden>
              <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${state.checklist.length ? (doneCount / state.checklist.length) * 100 : 0}%` }} />
            </div>
            <ul className="mt-4 space-y-1">
              {state.checklist.map((c) => (
                <li key={c.id} className="group flex items-start gap-2 rounded-lg px-1 py-1.5 hover:bg-sand-50">
                  <input id={c.id} type="checkbox" className="mt-1 accent-teal-600" checked={c.done} onChange={() => planner.toggleChecklist(c.id)} />
                  <label htmlFor={c.id} className={cn("flex-1 text-sm", c.done && "text-subtle line-through")}>{c.label}</label>
                  <button type="button" onClick={() => planner.removeChecklist(c.id)} className="opacity-60 transition group-hover:opacity-100 focus:opacity-100" aria-label={`Remover item: ${c.label}`}>
                    <X className="size-4 text-subtle" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                planner.addChecklist(newItem);
                setNewItem("");
              }}
            >
              <label htmlFor="novo-item" className="sr-only">Novo item da checklist</label>
              <input id="novo-item" className="input h-9 text-sm" placeholder="Adicionar item" value={newItem} maxLength={200} onChange={(e) => setNewItem(e.target.value)} />
              <Button type="submit" size="sm" variant="outline" aria-label="Adicionar item"><Plus aria-hidden /></Button>
            </form>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-subtle">
            Favoritos, anotações e checklist ficam salvos apenas no armazenamento local deste navegador. Nada é enviado aos servidores do Partiu Morar.
          </p>
          {(favorites.length > 0 || doneCount > 0) && (
            <Button variant="ghost" size="sm" className="mt-2 text-copper-600" onClick={() => { if (window.confirm("Apagar todos os favoritos, anotações e a checklist deste navegador?")) planner.clearAll(); }}>
              <Trash2 aria-hidden /> Apagar meus dados locais
            </Button>
          )}
        </section>
      </div>
    </div>
  );
}
