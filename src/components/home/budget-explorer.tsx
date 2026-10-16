"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Destination } from "@/lib/domain/types";
import { referenceMonthlyCost } from "@/lib/calc/cost-of-living";
import { convert } from "@/lib/integrations/exchange/convert";
import type { ExchangeSnapshot } from "@/lib/integrations/exchange/types";
import { formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

/** "Onde seu dinheiro rende mais": compara um orçamento em BRL com o custo de referência de cada cidade. */
export function BudgetExplorer({ destinations, snapshot }: { destinations: Destination[]; snapshot: ExchangeSnapshot }) {
  const [budget, setBudget] = useState(8000);

  const rows = useMemo(
    () =>
      destinations
        .map((d) => {
          const cost = convert(referenceMonthlyCost(d.costs), d.currency.code, "BRL", snapshot);
          return { d, cost, left: cost === null ? null : budget - cost };
        })
        .filter((r): r is { d: Destination; cost: number; left: number } => r.cost !== null)
        .sort((a, b) => b.left - a.left),
    [destinations, snapshot, budget],
  );
  const fits = rows.filter((r) => r.left >= 0).length;

  if (snapshot.status === "unavailable") {
    return <p className="rounded-2xl bg-white p-6 text-sm text-muted">O câmbio não está disponível agora, então não conseguimos converter os custos para reais.</p>;
  }

  return (
    <div className="grid gap-8 rounded-3xl border border-sand-200 bg-white p-6 shadow-card md:grid-cols-[minmax(0,22rem)_1fr] md:p-8">
      <div>
        <label htmlFor="home-budget" className="text-sm font-medium text-navy-800">
          Seu orçamento mensal
        </label>
        <p className="font-display mt-2 text-4xl font-medium tabular-nums text-ink">{formatMoney(budget, "BRL")}</p>
        <input
          id="home-budget"
          type="range"
          min={3000}
          max={30000}
          step={500}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="mt-5 w-full accent-teal-600"
          aria-valuetext={formatMoney(budget, "BRL")}
        />
        <div className="mt-1 flex justify-between text-xs text-subtle">
          <span>R$ 3 mil</span>
          <span>R$ 30 mil</span>
        </div>
        <p className="mt-6 text-sm leading-relaxed text-muted" aria-live="polite">
          Com esse valor, <strong className="text-ink">{fits} de {rows.length}</strong> destinos cabem no custo estimado de 1 pessoa no perfil intermediário.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-subtle">
          Critério: orçamento menos o custo mensal de referência convertido para reais{snapshot.status === "demo" ? " com taxas demonstrativas" : " pela taxa de referência do BCE"}. Não inclui impostos, mudança ou caução.
        </p>
      </div>
      <ol className="divide-y divide-sand-100">
        {rows.slice(0, 6).map(({ d, cost, left }, i) => (
          <li key={d.slug}>
            <Link href={`/destinos/${d.slug}`} className="group flex items-center gap-4 py-3">
              <span className="w-5 text-sm font-semibold tabular-nums text-subtle">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink group-hover:text-teal-700">
                  {d.name} <span className="font-normal text-muted">· {d.country.name}</span>
                </p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand-100" aria-hidden>
                  <div className={cn("h-full rounded-full", left >= 0 ? "bg-teal-500" : "bg-copper-500")} style={{ width: `${Math.min(100, (cost / budget) * 100)}%` }} />
                </div>
              </div>
              <div className="text-right text-sm">
                <p className={cn("font-semibold tabular-nums", left >= 0 ? "text-teal-700" : "text-copper-600")}>
                  {left >= 0 ? "sobra " : "falta "}
                  {formatMoney(Math.abs(left), "BRL", { compact: true })}
                </p>
                <p className="text-xs text-subtle">{formatPercent(cost / budget)} do orçamento</p>
              </div>
              <ArrowUpRight className="size-4 text-subtle transition group-hover:text-teal-600" aria-hidden />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
