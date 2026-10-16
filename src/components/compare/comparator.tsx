"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, Minus, Plus, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Destination, ProfessionId } from "@/lib/domain/types";
import { compareDestinations, MAX_COMPARE, MIN_COMPARE, type CompareRow } from "@/lib/compare/compare";
import { profileMeta, SPENDING_PROFILES, householdMeta, type Household, type SpendingProfile } from "@/lib/calc/cost-of-living";
import { professionLabels } from "@/lib/domain/catalog";
import { userCurrencies } from "@/lib/data/seed/currencies";
import type { ExchangeSnapshot } from "@/lib/integrations/exchange/types";
import { formatMoney, formatPercent } from "@/lib/format";
import { planner } from "@/lib/favorites/store";
import { CityImage } from "@/components/ui/city-image";
import { ShareButton } from "@/components/favorites/actions";
import { EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const COLORS = ["#137572", "#1b3a57", "#c9773a"];
const groupLabels: Record<CompareRow["group"], string> = { custos: "Custos", trabalho: "Trabalho e renda", qualidade: "Qualidade de vida", geral: "Informações gerais" };

export function Comparator({ destinations, snapshot, initialSlugs }: { destinations: Destination[]; snapshot: ExchangeSnapshot; initialSlugs: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [slugs, setSlugs] = useState<string[]>(initialSlugs);
  const [profile, setProfile] = useState<SpendingProfile>("intermediario");
  const [household, setHousehold] = useState<Household>("individual");
  const [currency, setCurrency] = useState("BRL");
  const [profession, setProfession] = useState<ProfessionId | "">("");

  useEffect(() => {
    const qs = new URLSearchParams();
    if (slugs.length) qs.set("cidades", slugs.join(","));
    router.replace(qs.size ? `${pathname}?${qs.toString().replace(/%2C/g, ",")}` : pathname, { scroll: false });
    planner.setCompare(slugs);
  }, [slugs, pathname, router]);

  const selected = slugs.map((s) => destinations.find((d) => d.slug === s)).filter((d): d is Destination => !!d);
  const result = useMemo(
    () => (selected.length >= MIN_COMPARE ? compareDestinations(selected, { profile, household, displayCurrency: currency, profession: profession || null }, snapshot) : null),
    [selected, profile, household, currency, profession, snapshot],
  );

  const fmt = (row: CompareRow, v: number | null) =>
    v === null ? <span className="text-xs text-subtle italic">Indisponível</span> : row.format === "money" ? formatMoney(v, currency) : row.format === "percent" ? formatPercent(v) : `${Math.round(v)}/100`;

  const chartData = result
    ? ["cost", "net", "savings"].map((id) => {
        const row = result.rows.find((r) => r.id === id)!;
        return Object.fromEntries([["label", row.label], ...selected.map((d, i) => [d.name, row.values[i] === null ? null : Math.round(row.values[i]!)])]);
      })
    : [];

  return (
    <div className="container-page py-8">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: MAX_COMPARE }).map((_, i) => {
          const d = selected[i];
          return d ? (
            <div key={d.slug} className="relative overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-card">
              <CityImage src={d.image.url} alt="" name="" sizes="33vw" className="aspect-[16/7]" />
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="flex items-center gap-2 font-semibold">
                    <span className="inline-block size-2.5 rounded-full" style={{ background: COLORS[i] }} aria-hidden />
                    <Link href={`/destinos/${d.slug}`} className="hover:text-teal-700">{d.name}</Link>
                  </p>
                  <p className="text-sm text-muted">{d.country.name}</p>
                </div>
                <button type="button" onClick={() => setSlugs(slugs.filter((s) => s !== d.slug))} className="grid size-9 place-items-center rounded-lg hover:bg-sand-100" aria-label={`Remover ${d.name} da comparação`}>
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          ) : (
            <div key={`empty-${i}`} className="flex flex-col justify-center rounded-2xl border border-dashed border-sand-300 bg-white/60 p-5">
              <label htmlFor={`add-${i}`} className="mb-2 flex items-center gap-2 text-sm font-medium text-navy-800">
                <Plus className="size-4" aria-hidden /> Adicionar cidade {i + 1}
                {i >= MIN_COMPARE && <span className="font-normal text-subtle">(opcional)</span>}
              </label>
              <select id={`add-${i}`} className="input" value="" onChange={(e) => e.target.value && setSlugs([...slugs, e.target.value])}>
                <option value="">Escolha um destino…</option>
                {destinations.filter((x) => !slugs.includes(x.slug)).map((x) => (
                  <option key={x.slug} value={x.slug}>{x.name}, {x.country.name}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl bg-white p-4 ring-1 ring-sand-200">
        <div>
          <label htmlFor="cmp-profile" className="label">Perfil de gastos</label>
          <select id="cmp-profile" className="input" value={profile} onChange={(e) => setProfile(e.target.value as SpendingProfile)}>
            {SPENDING_PROFILES.map((p) => <option key={p} value={p}>{profileMeta[p].label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cmp-household" className="label">Domicílio</label>
          <select id="cmp-household" className="input" value={household} onChange={(e) => setHousehold(e.target.value as Household)}>
            {(["individual", "familia"] as Household[]).map((h) => <option key={h} value={h}>{householdMeta[h].label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cmp-prof" className="label">Profissão</label>
          <select id="cmp-prof" className="input" value={profession} onChange={(e) => setProfession(e.target.value as ProfessionId | "")}>
            <option value="">Salário mediano geral</option>
            {(Object.keys(professionLabels) as ProfessionId[]).map((p) => <option key={p} value={p}>{professionLabels[p]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="cmp-cur" className="label">Exibir em</label>
          <select id="cmp-cur" className="input w-28" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {userCurrencies.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {selected.length >= MIN_COMPARE && <ShareButton title="Comparação na LIVORA" label="Compartilhar comparação" className="ml-auto" />}
      </div>

      {!result ? (
        <div className="mt-10">
          <EmptyState icon={<Minus />} title="Escolha pelo menos duas cidades" description="Selecione destinos acima para ver custos, salários, poder de compra e indicadores lado a lado." />
        </div>
      ) : (
        <>
          {result.warnings.length > 0 && (
            <ul className="mt-6 space-y-1 rounded-xl bg-demo-50 p-4 text-sm text-demo-700" role="status">
              {result.warnings.map((w) => <li key={w} className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />{w}</li>)}
            </ul>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {result.highlights.map((h, i) => (
              <div key={h.slug} className="rounded-2xl border border-sand-200 bg-white p-5">
                <p className="font-semibold">{selected[i]!.name}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-teal-700"><ThumbsUp className="size-3.5" aria-hidden /> Se destaca em</p>
                <p className="mt-1 text-sm text-muted">{h.strengths.length ? h.strengths.join(", ") : "Nenhum critério em que fique à frente das demais."}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-copper-600"><ThumbsDown className="size-3.5" aria-hidden /> Pontos de atenção</p>
                <p className="mt-1 text-sm text-muted">{h.weaknesses.length ? h.weaknesses.join(", ") : "Nenhum critério em que fique atrás das demais."}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-subtle">Não há vencedor universal: o melhor destino depende do peso que você dá a cada critério.</p>

          <div className="mt-8 rounded-2xl border border-sand-200 bg-white p-5">
            <h2 className="font-semibold">Custo, salário líquido e sobra mensal ({currency})</h2>
            <div className="mt-4 h-72" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid stroke="#ebe6dc" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5a6573" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#8a939e" }} axisLine={false} tickLine={false} width={72} tickFormatter={(v: number) => formatMoney(v, currency, { compact: true })} />
                  <Tooltip formatter={(v) => formatMoney(Number(v), currency)} cursor={{ fill: "#f5f2ec" }} />
                  <Legend />
                  {selected.map((d, i) => <Bar key={d.slug} dataKey={d.name} fill={COLORS[i]} radius={[6, 6, 0, 0]} />)}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="sr-only">Os mesmos valores estão na tabela abaixo.</p>
          </div>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-sand-200 bg-white">
            <table className="w-full min-w-[40rem] text-sm">
              <caption className="sr-only">Comparação detalhada</caption>
              <thead className="bg-sand-50">
                <tr>
                  <th scope="col" className="w-1/4 px-5 py-3 text-left text-xs font-medium text-subtle">Critério</th>
                  {selected.map((d, i) => (
                    <th key={d.slug} scope="col" className="px-5 py-3 text-left font-semibold">
                      <span className="mr-2 inline-block size-2.5 rounded-full" style={{ background: COLORS[i] }} aria-hidden />
                      {d.name}
                    </th>
                  ))}
                </tr>
              </thead>
              {(["custos", "trabalho", "qualidade", "geral"] as const).map((g) => (
                <tbody key={g}>
                  <tr className="border-t border-sand-200 bg-sand-50/60">
                    <th scope="colgroup" colSpan={selected.length + 1} className="px-5 py-2 text-left text-xs font-semibold tracking-wide text-teal-700 uppercase">{groupLabels[g]}</th>
                  </tr>
                  {result.rows.filter((r) => r.group === g).map((row) => {
                    const valid = row.values.filter((v): v is number => v !== null);
                    const best = row.better === "none" || valid.length < 2 ? null : row.better === "higher" ? Math.max(...valid) : Math.min(...valid);
                    return (
                      <tr key={row.id} className="border-t border-sand-100 align-top">
                        <th scope="row" className="px-5 py-3 text-left font-normal">
                          <span className="text-ink">{row.label}</span>
                          {row.note && <span className="mt-0.5 block text-xs text-subtle">{row.note}</span>}
                        </th>
                        {selected.map((d, i) => (
                          <td key={d.slug} className={cn("px-5 py-3", row.format !== "text" && "tabular-nums", best !== null && row.values[i] === best && "font-semibold text-teal-700")}>
                            {row.format === "text" ? <span className="text-muted">{row.text![i]}</span> : fmt(row, row.values[i]!)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          </div>
          <p className="mt-3 text-xs text-subtle">
            Todos os destinos usam as mesmas categorias de despesa, o mesmo perfil e o mesmo período de referência dos dados. Em destaque, o melhor valor de cada linha.
          </p>
        </>
      )}
    </div>
  );
}
