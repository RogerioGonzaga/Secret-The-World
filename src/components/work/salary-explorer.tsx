"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Destination, ProfessionId } from "@/lib/domain/types";
import { professionLabels } from "@/lib/domain/catalog";
import { estimateNetMonthly } from "@/lib/calc/tax";
import { referenceMonthlyCost } from "@/lib/calc/cost-of-living";
import { convert } from "@/lib/integrations/exchange/convert";
import type { ExchangeSnapshot } from "@/lib/integrations/exchange/types";
import { userCurrencies } from "@/lib/data/seed/currencies";
import { formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type Sort = "net" | "gross" | "coverage";

export function SalaryExplorer({ destinations, snapshot }: { destinations: Destination[]; snapshot: ExchangeSnapshot }) {
  const [profession, setProfession] = useState<ProfessionId>("software");
  const [currency, setCurrency] = useState("BRL");
  const [sort, setSort] = useState<Sort>("coverage");

  const rows = useMemo(() => {
    return destinations
      .map((d) => {
        const gross = d.salaries.byProfession[profession] ?? null;
        const net = gross === null ? null : (estimateNetMonthly(gross, d.country.taxModel)?.net ?? null);
        const cost = referenceMonthlyCost(d.costs);
        return {
          d,
          gross: gross === null ? null : convert(gross, d.currency.code, currency, snapshot),
          net: net === null ? null : convert(net, d.currency.code, currency, snapshot),
          coverage: net === null ? null : net / cost,
        };
      })
      .sort((a, b) => (b[sort] ?? -Infinity) - (a[sort] ?? -Infinity));
  }, [destinations, profession, currency, sort, snapshot]);

  const max = Math.max(1, ...rows.map((r) => r.gross ?? 0));

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="sal-prof" className="label">Profissão</label>
          <select id="sal-prof" className="input" value={profession} onChange={(e) => setProfession(e.target.value as ProfessionId)}>
            {(Object.keys(professionLabels) as ProfessionId[]).map((p) => <option key={p} value={p}>{professionLabels[p]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sal-cur" className="label">Exibir em</label>
          <select id="sal-cur" className="input w-28" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {userCurrencies.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sal-sort" className="label">Ordenar por</label>
          <select id="sal-sort" className="input" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="coverage">Líquido ÷ custo de vida local</option>
            <option value="net">Maior líquido estimado</option>
            <option value="gross">Maior bruto</option>
          </select>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-sand-200 bg-white">
        <table className="w-full min-w-[40rem] text-sm">
          <caption className="sr-only">Salários de {professionLabels[profession]} por cidade em {currency}</caption>
          <thead className="bg-sand-50 text-left text-xs text-subtle">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Cidade</th>
              <th scope="col" className="px-5 py-3 font-medium">Bruto/mês</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Líquido estimado</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Líquido ÷ custo local</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ d, gross, net, coverage }) => (
              <tr key={d.slug} className="border-t border-sand-100">
                <th scope="row" className="px-5 py-3 text-left font-normal">
                  <Link href={`/destinos/${d.slug}#trabalho`} className="font-medium hover:text-teal-700">{d.name}</Link>
                  <span className="block text-xs text-muted">{d.country.name}</span>
                </th>
                <td className="px-5 py-3">
                  {gross === null ? (
                    <span className="text-xs text-subtle italic">Indisponível</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="w-24 tabular-nums">{formatMoney(gross, currency, { compact: true })}</span>
                      <span className="hidden h-1.5 flex-1 rounded-full bg-sand-100 sm:block" aria-hidden>
                        <span className="block h-full rounded-full bg-navy-600" style={{ width: `${(gross / max) * 100}%` }} />
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-5 py-3 text-right tabular-nums">{net === null ? <span className="text-xs text-subtle italic">Indisponível</span> : formatMoney(net, currency, { compact: true })}</td>
                <td className={cn("px-5 py-3 text-right font-semibold tabular-nums", coverage !== null && (coverage >= 1 ? "text-teal-700" : "text-copper-600"))}>{coverage === null ? "—" : formatPercent(coverage)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-subtle">
        A última coluna não depende de câmbio: compara salário e custo na mesma moeda local. Líquido estimado com o modelo tributário de cada país (pessoa solteira, residente, contratada localmente);
        vazio quando não há dados tributários. Salários e alíquotas são demonstrativos nesta versão.
      </p>
    </div>
  );
}
