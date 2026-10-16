"use client";

import { useState } from "react";
import type { Destination } from "@/lib/domain/types";
import { computeBudget, householdMeta, profileMeta, SPENDING_PROFILES, type Household, type SpendingProfile } from "@/lib/calc/cost-of-living";
import { convert } from "@/lib/integrations/exchange/convert";
import type { ExchangeSnapshot } from "@/lib/integrations/exchange/types";
import { formatMoney } from "@/lib/format";
import { SourceNote } from "@/components/ui/source-note";
import { cn } from "@/lib/utils";

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl bg-sand-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("rounded-lg px-3.5 py-1.5 text-sm font-medium transition", value === o.value ? "bg-white text-ink shadow-card" : "text-navy-700 hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function CostSection({ dest, snapshot }: { dest: Destination; snapshot: ExchangeSnapshot }) {
  const [profile, setProfile] = useState<SpendingProfile>("intermediario");
  const [household, setHousehold] = useState<Household>("individual");
  const budget = computeBudget(dest.costs, profile, household);
  const code = dest.currency.code;
  const inBrl = code === "BRL" ? null : convert(budget.total, code, "BRL", snapshot);
  const max = Math.max(...budget.lines.map((l) => l.amount));

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Segmented label="Perfil de gastos" value={profile} onChange={setProfile} options={SPENDING_PROFILES.map((p) => ({ value: p, label: profileMeta[p].label }))} />
        <Segmented label="Composição do domicílio" value={household} onChange={setHousehold} options={(["individual", "familia"] as Household[]).map((h) => ({ value: h, label: householdMeta[h].label }))} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <table className="w-full text-sm">
          <caption className="sr-only">Custo mensal estimado por categoria em {code}</caption>
          <thead>
            <tr className="text-left text-xs text-subtle">
              <th scope="col" className="pb-2 font-medium">Categoria</th>
              <th scope="col" className="pb-2 text-right font-medium">Por mês ({code})</th>
            </tr>
          </thead>
          <tbody>
            {budget.lines.map((l) => (
              <tr key={l.id} className="border-t border-sand-100">
                <th scope="row" className="py-2.5 pr-4 text-left font-normal">
                  <span className="text-ink">{l.label}</span>
                  {l.note && <span className="block text-xs text-subtle">{l.note}</span>}
                  <span className="mt-1.5 block h-1 rounded-full bg-sand-100" aria-hidden>
                    <span className="block h-full rounded-full bg-teal-500/70" style={{ width: `${(l.amount / max) * 100}%` }} />
                  </span>
                </th>
                <td className="py-2.5 text-right align-top font-medium tabular-nums">{formatMoney(l.amount, code)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-col rounded-2xl bg-navy-900 p-5 text-white">
          <p className="text-sm text-white/70">Total mensal estimado</p>
          <p className="font-display mt-1 text-4xl tabular-nums" aria-live="polite">{formatMoney(budget.total, code)}</p>
          {inBrl !== null && <p className="mt-1 text-sm text-white/70">≈ {formatMoney(inBrl, "BRL")}{snapshot.status === "demo" && " (câmbio demonstrativo)"}</p>}
          <p className="mt-4 text-xs leading-relaxed text-white/60">{householdMeta[household].description}</p>
          <p className="mt-2 text-xs leading-relaxed text-white/60">{profileMeta[profile].description}</p>
          <div className="mt-auto pt-4">
            <SourceNote provenance={dest.costs.provenance} className="text-teal-100 hover:bg-white/10" />
          </div>
        </div>
      </div>
      <details className="mt-5 text-sm text-muted">
        <summary className="cursor-pointer font-medium text-navy-800">O que está incluído nesta estimativa</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {budget.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
