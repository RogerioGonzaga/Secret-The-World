"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Info, LayoutGrid, Map as MapIcon, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import type { ClimateType, ContinentId, Destination } from "@/lib/domain/types";
import { continents, climateLabels } from "@/lib/domain/catalog";
import { userCurrencies } from "@/lib/data/seed/currencies";
import type { ExchangeSnapshot } from "@/lib/integrations/exchange/types";
import {
  applyFilters,
  COST_LEVEL_EUR,
  defaultFilters,
  paginate,
  SORT_CRITERIA,
  SORT_LABELS,
  type CostLevel,
  type ExploreFilters,
  type SortKey,
  type WorkFilter,
} from "@/lib/explore/filters";
import { activeFilterCount, serializeFilters } from "@/lib/explore/url-state";
import { rankDestinations } from "@/lib/calc/compatibility";
import { useStoredQuizAnswers } from "@/components/quiz/storage";
import { DestinationCard } from "./destination-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const MapView = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: () => <div className="skeleton h-[min(70vh,560px)] w-full" aria-label="Carregando mapa" />,
});

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Explorer({ destinations, snapshot, initial }: { destinations: Destination[]; snapshot: ExchangeSnapshot; initial: ExploreFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<ExploreFilters>(initial);
  const [panelOpen, setPanelOpen] = useState(false);
  const quiz = useStoredQuizAnswers();
  const [, startTransition] = useTransition();

  // Mantém a URL compartilhável sincronizada com os filtros.
  useEffect(() => {
    const qs = serializeFilters(filters);
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }, [filters, pathname, router]);

  const compatibility = useMemo(() => {
    if (!quiz) return undefined;
    return new Map(rankDestinations(destinations, quiz, snapshot).map((r) => [r.dest.slug, r.result.score]));
  }, [quiz, destinations, snapshot]);

  const outcome = useMemo(() => applyFilters(destinations, filters, snapshot, compatibility), [destinations, filters, snapshot, compatibility]);
  const page = paginate(outcome.results, filters.page);

  const languages = useMemo(() => [...new Set(destinations.flatMap((d) => d.country.languages.map((l) => l.split(" ")[0]!)))].sort(), [destinations]);
  const currencies = useMemo(() => [...new Set(destinations.map((d) => d.currency.code))].sort(), [destinations]);

  const update = (patch: Partial<ExploreFilters>) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));
  const active = activeFilterCount(filters);

  const filterPanel = (
    <div className="space-y-5">
      <Field label="Continente" htmlFor="f-continent">
        <select id="f-continent" className="input" value={filters.continent ?? ""} onChange={(e) => update({ continent: (e.target.value || null) as ContinentId | null })}>
          <option value="">Todos</option>
          {(Object.keys(continents) as ContinentId[]).map((c) => (
            <option key={c} value={c}>
              {continents[c].label}
            </option>
          ))}
        </select>
      </Field>
      <div>
        <label htmlFor="f-budget" className="label">
          Orçamento mensal máximo
        </label>
        <div className="flex gap-2">
          <input
            id="f-budget"
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            placeholder="Ex.: 8000"
            className="input"
            value={filters.budgetMax ?? ""}
            onChange={(e) => update({ budgetMax: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })}
          />
          <select aria-label="Moeda do orçamento" className="input w-24" value={filters.budgetCurrency} onChange={(e) => update({ budgetCurrency: e.target.value })}>
            {userCurrencies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-xs text-subtle">Compara com o custo de 1 pessoa no perfil intermediário.</p>
      </div>
      <Field label="Custo de vida" htmlFor="f-cost">
        <select id="f-cost" className="input" value={filters.cost ?? ""} onChange={(e) => update({ cost: (e.target.value || null) as CostLevel | null })}>
          <option value="">Qualquer</option>
          {(Object.keys(COST_LEVEL_EUR) as CostLevel[]).map((k) => {
            const r = COST_LEVEL_EUR[k];
            return (
              <option key={k} value={k}>
                {r.label} ({r.max === Infinity ? `acima de € ${r.min}` : r.min === 0 ? `até € ${r.max}` : `€ ${r.min}–${r.max}`})
              </option>
            );
          })}
        </select>
      </Field>
      <Field label="Moeda local" htmlFor="f-currency">
        <select id="f-currency" className="input" value={filters.currency ?? ""} onChange={(e) => update({ currency: e.target.value || null })}>
          <option value="">Qualquer</option>
          {currencies.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label="Idioma" htmlFor="f-language">
        <select id="f-language" className="input" value={filters.language ?? ""} onChange={(e) => update({ language: e.target.value || null })}>
          <option value="">Qualquer</option>
          {languages.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </Field>
      <fieldset>
        <legend className="label">Clima</legend>
        <div className="flex flex-wrap gap-2">
          {([null, "quente", "ameno", "frio"] as (ClimateType | null)[]).map((c) => (
            <button
              key={c ?? "todos"}
              type="button"
              aria-pressed={filters.climate === c}
              onClick={() => update({ climate: c })}
              className={cn("rounded-full px-3.5 py-1.5 text-sm ring-1 transition", filters.climate === c ? "bg-navy-900 text-white ring-navy-900" : "bg-white text-navy-800 ring-sand-300 hover:ring-navy-600/40")}
            >
              {c ? climateLabels[c] : "Todos"}
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="f-safety" className="label">
          Segurança mínima: <span className="tabular-nums">{filters.safetyMin ?? 0}</span>/100
        </label>
        <input id="f-safety" type="range" min={0} max={90} step={10} value={filters.safetyMin ?? 0} onChange={(e) => update({ safetyMin: Number(e.target.value) || null })} className="w-full accent-teal-600" />
      </div>
      <Field label="Oportunidades de trabalho" htmlFor="f-work">
        <select id="f-work" className="input" value={filters.work ?? ""} onChange={(e) => update({ work: (e.target.value || null) as WorkFilter | null })}>
          <option value="">Qualquer</option>
          <option value="cobre">Salário mediano cobre o custo de vida</option>
          <option value="folga">Salário mediano supera o custo em 30% ou mais</option>
        </select>
      </Field>
      {active > 0 && (
        <Button variant="ghost" size="sm" onClick={() => setFilters({ ...defaultFilters, q: filters.q, sort: filters.sort, view: filters.view })}>
          <RotateCcw aria-hidden /> Limpar filtros
        </Button>
      )}
    </div>
  );

  return (
    <div className="container-page py-8 md:py-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <label htmlFor="f-q" className="sr-only">
            Buscar cidade ou país
          </label>
          <input id="f-q" type="search" className="input pl-10" placeholder="Buscar cidade, país, moeda ou idioma" value={filters.q} onChange={(e) => update({ q: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="lg:hidden" onClick={() => setPanelOpen((v) => !v)} aria-expanded={panelOpen} aria-controls="painel-filtros">
            <SlidersHorizontal aria-hidden /> Filtros{active > 0 && ` (${active})`}
          </Button>
          <label htmlFor="f-sort" className="sr-only">
            Ordenar por
          </label>
          <select id="f-sort" className="input w-auto min-w-0 flex-1 md:w-64" value={filters.sort} onChange={(e) => update({ sort: e.target.value as SortKey })}>
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
          <div className="flex rounded-xl border border-sand-300 bg-white p-1" role="group" aria-label="Modo de visualização">
            {(["grade", "mapa"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={filters.view === v}
                aria-label={v === "grade" ? "Ver em grade" : "Ver no mapa"}
                onClick={() => update({ view: v, page: filters.page })}
                className={cn("grid size-9 place-items-center rounded-lg transition", filters.view === v ? "bg-navy-900 text-white" : "text-navy-700 hover:bg-sand-100")}
              >
                {v === "grade" ? <LayoutGrid className="size-4" aria-hidden /> : <MapIcon className="size-4" aria-hidden />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside id="painel-filtros" aria-label="Filtros" className={cn("lg:block", panelOpen ? "block rounded-2xl border border-sand-200 bg-white p-5" : "hidden")}>
          {panelOpen && (
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <p className="font-semibold">Filtros</p>
              <button type="button" onClick={() => setPanelOpen(false)} aria-label="Fechar filtros" className="grid size-9 place-items-center rounded-lg hover:bg-sand-100">
                <X className="size-4" aria-hidden />
              </button>
            </div>
          )}
          {filterPanel}
        </aside>

        <section aria-labelledby="resultados">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="resultados" className="text-sm text-muted" aria-live="polite">
              <strong className="text-ink">{outcome.total}</strong> {outcome.total === 1 ? "destino encontrado" : "destinos encontrados"}
            </h2>
            <p className="flex items-center gap-1.5 text-xs text-subtle">
              <Info className="size-3.5" aria-hidden />
              Critério de ordenação: {SORT_CRITERIA[filters.sort]}
            </p>
          </div>

          {filters.sort === "compatibilidade" && !quiz && (
            <div className="mb-4 rounded-xl bg-teal-50 p-4 text-sm text-teal-700">
              Para ordenar por compatibilidade, responda o questionário.{" "}
              <Link href="/destino-ideal" className="font-semibold underline underline-offset-2">
                Descobrir meu destino ideal
              </Link>
            </div>
          )}
          {outcome.skipped.length > 0 && (
            <div className="mb-4 rounded-xl bg-demo-50 p-4 text-sm text-demo-700" role="status">
              Filtros não aplicados por falta de dados: {outcome.skipped.join(", ")}.
            </div>
          )}
          {outcome.missingData > 0 && (
            <p className="mb-4 text-xs text-subtle">Alguns destinos foram excluídos por não terem o dado exigido pelos filtros (dados indisponíveis).</p>
          )}

          {outcome.total === 0 ? (
            <EmptyState icon={<Search />} title="Nenhum destino corresponde a esses filtros" description="Tente aumentar o orçamento, escolher outro continente ou remover algum filtro.">
              <Button variant="outline" onClick={() => setFilters(defaultFilters)}>
                <RotateCcw aria-hidden /> Limpar tudo
              </Button>
            </EmptyState>
          ) : filters.view === "mapa" ? (
            <MapView destinations={outcome.results} />
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {page.items.map((d, i) => (
                  <DestinationCard key={d.slug} dest={d} snapshot={snapshot} compatibility={filters.sort === "compatibilidade" ? compatibility?.get(d.slug) : undefined} priority={i < 3} className="animate-fade-up" />
                ))}
              </div>
              {page.hasMore && (
                <div className="mt-10 flex flex-col items-center gap-2">
                  <Button variant="outline" onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>
                    Carregar mais destinos
                  </Button>
                  <p className="text-xs text-subtle">
                    Mostrando {page.items.length} de {outcome.total}
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
