"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Calculator, PiggyBank, Wallet } from "lucide-react";
import type { Destination } from "@/lib/domain/types";
import { calculatePurchasingPower, type IncomeBasis } from "@/lib/calc/purchasing-power";
import { householdMeta, profileMeta, SPENDING_PROFILES, type Household, type SpendingProfile } from "@/lib/calc/cost-of-living";
import { userCurrencies } from "@/lib/data/seed/currencies";
import type { ExchangeSnapshot } from "@/lib/integrations/exchange/types";
import { convert } from "@/lib/integrations/exchange/convert";
import { formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Calculadora de poder de compra. Todas as hipóteses do cálculo são listadas ao lado do resultado.
 * Se `destinations` tiver mais de um item, mostra seletor de cidade.
 */
export function PurchasingPowerCalculator({
  destinations,
  initialSlug,
  snapshot,
}: {
  destinations: Destination[];
  initialSlug: string;
  snapshot: ExchangeSnapshot;
}) {
  const [slug, setSlug] = useState(initialSlug);
  const [incomeText, setIncomeText] = useState("12000");
  const [currency, setCurrency] = useState("BRL");
  const [basis, setBasis] = useState<IncomeBasis>("net");
  const [household, setHousehold] = useState<Household>("individual");
  const [profile, setProfile] = useState<SpendingProfile>("intermediario");

  const dest = destinations.find((d) => d.slug === slug) ?? destinations[0]!;
  const currencyOptions = useMemo(() => [...new Set([...userCurrencies, dest.currency.code])], [dest]);
  const income = Number(incomeText.replace(/\./g, "").replace(",", "."));
  const result = calculatePurchasingPower({ income, incomeCurrency: currency, incomeBasis: basis, household, profile }, dest, snapshot);
  const code = result.localCurrency;
  const inUser = (v: number | null) => (v === null || currency === code ? null : convert(v, code, currency, snapshot));

  const incomeError = !Number.isFinite(income) || income <= 0 ? "Informe um valor maior que zero." : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_1fr]">
      <form className="min-w-0 space-y-5 rounded-2xl border border-sand-200 bg-white p-5 md:p-6" onSubmit={(e) => e.preventDefault()} aria-label="Dados para o cálculo">
        {destinations.length > 1 && (
          <div>
            <label htmlFor="calc-city" className="label">
              Cidade onde deseja morar
            </label>
            <select id="calc-city" className="input" value={slug} onChange={(e) => setSlug(e.target.value)}>
              {destinations.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}, {d.country.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="calc-income" className="label">
            Renda mensal
          </label>
          <div className="flex gap-2">
            <input
              id="calc-income"
              inputMode="decimal"
              className={cn("input", incomeError && "border-copper-500")}
              value={incomeText}
              onChange={(e) => setIncomeText(e.target.value.replace(/[^\d.,]/g, ""))}
              aria-invalid={!!incomeError}
              aria-describedby="calc-income-help"
            />
            <select aria-label="Moeda da renda" className="input w-24" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {currencyOptions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <p id="calc-income-help" className={cn("mt-1 text-xs", incomeError ? "text-copper-600" : "text-subtle")}>
            {incomeError ?? (household === "familia" ? "Some a renda de todas as pessoas do domicílio." : "Valor mensal antes ou depois dos impostos, conforme abaixo.")}
          </p>
        </div>
        <fieldset>
          <legend className="label">Esse valor é</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["net", "gross"] as IncomeBasis[]).map((b) => (
              <label key={b} className={cn("cursor-pointer rounded-xl border px-3 py-2.5 text-sm transition", basis === b ? "border-teal-500 bg-teal-50 text-teal-700" : "border-sand-300 hover:border-navy-600/40")}>
                <input type="radio" name="basis" value={b} checked={basis === b} onChange={() => setBasis(b)} className="sr-only" />
                <span className="font-medium">{b === "net" ? "Líquido" : "Bruto"}</span>
                <span className="block text-xs text-muted">{b === "net" ? "Já descontados impostos" : "Antes de impostos"}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="calc-household" className="label">
            Situação
          </label>
          <select id="calc-household" className="input" value={household} onChange={(e) => setHousehold(e.target.value as Household)}>
            {(["individual", "familia"] as Household[]).map((h) => (
              <option key={h} value={h}>
                {householdMeta[h].label} — {householdMeta[h].description.split(".")[0]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="calc-profile" className="label">
            Perfil de gastos
          </label>
          <select id="calc-profile" className="input" value={profile} onChange={(e) => setProfile(e.target.value as SpendingProfile)}>
            {SPENDING_PROFILES.map((p) => (
              <option key={p} value={p}>
                {profileMeta[p].label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-subtle">{profileMeta[profile].description}</p>
        </div>
      </form>

      <div className="min-w-0 space-y-4" aria-live="polite">
        {result.status === "ok" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat icon={<Wallet />} label={result.net.method === "estimated" ? "Líquido estimado" : "Renda líquida"} value={formatMoney(result.net.value, code)} sub={inUser(result.net.value) !== null ? `≈ ${formatMoney(inUser(result.net.value), currency)}` : undefined} />
              <Stat icon={<Calculator />} label="Despesas mensais" value={formatMoney(result.budget.total, code)} sub={`${formatPercent(result.commitment)} da renda`} />
              <Stat
                icon={<PiggyBank />}
                label="Sobra por mês"
                value={formatMoney(result.remaining, code)}
                sub={`${formatMoney(result.annualSavings, code, { compact: true })} por ano`}
                tone={result.remaining! >= 0 ? "good" : "bad"}
              />
            </div>
            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <h3 className="font-semibold">Cenários de orçamento</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[28rem] text-sm">
                  <thead>
                    <tr className="text-left text-xs text-subtle">
                      <th scope="col" className="pb-2 font-medium">Perfil</th>
                      <th scope="col" className="pb-2 text-right font-medium">Despesas</th>
                      <th scope="col" className="pb-2 text-right font-medium">Sobra</th>
                      <th scope="col" className="pb-2 text-right font-medium">Renda comprometida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.scenarios.map((s) => (
                      <tr key={s.profile} className={cn("border-t border-sand-100", s.profile === profile && "bg-teal-50/50")}>
                        <th scope="row" className="py-2 text-left font-medium">{profileMeta[s.profile].label}</th>
                        <td className="py-2 text-right tabular-nums">{formatMoney(s.expenses, code)}</td>
                        <td className={cn("py-2 text-right font-medium tabular-nums", (s.remaining ?? 0) < 0 ? "text-copper-600" : "text-teal-700")}>{formatMoney(s.remaining, code)}</td>
                        <td className="py-2 text-right tabular-nums">{formatPercent(s.commitment)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex gap-3 rounded-2xl border border-demo-200 bg-demo-50 p-5 text-sm text-demo-700">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">Não foi possível concluir o cálculo</p>
              {result.warnings.map((w) => (
                <p key={w} className="mt-1">{w}</p>
              ))}
              {result.status === "needs_net" && (
                <button type="button" onClick={() => setBasis("net")} className="mt-3 font-semibold underline underline-offset-2">
                  Informar renda líquida
                </button>
              )}
            </div>
          </div>
        )}
        {result.status === "ok" && result.warnings.length > 0 && (
          <ul className="space-y-1 rounded-xl bg-demo-50 p-4 text-xs text-demo-700">
            {result.warnings.map((w) => (
              <li key={w} className="flex gap-2">
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden /> {w}
              </li>
            ))}
          </ul>
        )}
        <details className="rounded-xl bg-sand-100 p-4 text-sm" open>
          <summary className="cursor-pointer font-medium text-navy-800">Hipóteses usadas no cálculo</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {result.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
            <li>Cálculo informativo: não substitui simulação tributária oficial nem aconselhamento financeiro.</li>
          </ul>
          {destinations.length > 1 && (
            <Link href={`/destinos/${dest.slug}`} className="mt-3 inline-block text-sm font-medium text-teal-700 hover:underline">
              Ver perfil completo de {dest.name} →
            </Link>
          )}
        </details>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-4">
      <p className="flex items-center gap-2 text-xs font-medium text-muted [&_svg]:size-4 [&_svg]:text-teal-600">
        {icon}
        {label}
      </p>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums", tone === "good" && "text-teal-700", tone === "bad" && "text-copper-600")}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-subtle">{sub}</p>}
    </div>
  );
}
