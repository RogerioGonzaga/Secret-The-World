import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import Link from "next/link";
import { getDestinations } from "@/lib/data/repository";
import { getExchangeSnapshot } from "@/lib/integrations/exchange/service";
import { referenceMonthlyCost } from "@/lib/calc/cost-of-living";
import { convert } from "@/lib/integrations/exchange/convert";
import { formatMoney } from "@/lib/format";
import { PurchasingPowerCalculator } from "@/components/calculator/purchasing-power-calculator";
import { PageHeader } from "@/components/ui/primitives";
import { DemoInline } from "@/components/layout/demo-banner";

export const revalidate = 3600;

export const metadata: Metadata = withSocial({
  title: "Calculadora de custo de vida e poder de compra",
  description: "Descubra quanto sobra do seu salário em outra cidade, com conversão cambial, estimativa de impostos e perfis de gasto.",
  alternates: { canonical: "/custo-de-vida" },
});

export default async function CustoDeVidaPage({ searchParams }: { searchParams: Promise<{ cidade?: string }> }) {
  const [{ cidade }, snapshot] = await Promise.all([searchParams, getExchangeSnapshot()]);
  const destinations = [...getDestinations()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const initial = destinations.find((d) => d.slug === cidade)?.slug ?? "lisboa-portugal";
  const ranking = destinations
    .map((d) => ({ d, local: referenceMonthlyCost(d.costs), brl: convert(referenceMonthlyCost(d.costs), d.currency.code, "BRL", snapshot) }))
    .sort((a, b) => (a.brl ?? Infinity) - (b.brl ?? Infinity));

  return (
    <>
      <PageHeader eyebrow="Custo de vida" title="Quanto sobra do seu salário em outra cidade?" description="Informe sua renda, escolha a cidade e o perfil de gastos. Todas as hipóteses ficam visíveis ao lado do resultado." />
      <div className="container-page py-10">
        {destinations.length > 0 && <PurchasingPowerCalculator destinations={destinations} initialSlug={initial} snapshot={snapshot} />}
        <section className="mt-16" aria-labelledby="tabela-custos">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="tabela-custos" className="font-display text-3xl font-medium">Custo mensal de referência por cidade</h2>
            <DemoInline />
          </div>
          <p className="mt-2 text-sm text-muted">1 pessoa, perfil intermediário. Conversão para reais {snapshot.status === "demo" ? "com taxas demonstrativas" : "pela taxa de referência do BCE"}.</p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-sand-200 bg-white">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="bg-sand-50 text-left text-xs text-subtle">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Cidade</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Moeda local</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Em reais</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map(({ d, local, brl }) => (
                  <tr key={d.slug} className="border-t border-sand-100">
                    <th scope="row" className="px-5 py-3 text-left font-normal">
                      <Link href={`/destinos/${d.slug}#custo`} className="font-medium hover:text-teal-700">{d.name}</Link>
                      <span className="text-muted"> · {d.country.name}</span>
                    </th>
                    <td className="px-5 py-3 text-right tabular-nums">{formatMoney(local, d.currency.code)}</td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums">{brl === null ? <span className="text-xs font-normal text-subtle italic">Cotação indisponível</span> : formatMoney(brl, "BRL")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
