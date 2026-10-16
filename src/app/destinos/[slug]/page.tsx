import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, ExternalLink, Globe2, Languages, MapPin, Users, Wallet } from "lucide-react";
import { getDestination, getDestinations, getSimilarDestinations } from "@/lib/data/repository";
import { getExchangeSnapshot } from "@/lib/integrations/exchange/service";
import { computeLivoraIndex } from "@/lib/calc/livora-index";
import { estimateNetMonthly } from "@/lib/calc/tax";
import { continents, indicatorMeta, professionLabels, sizeLabels } from "@/lib/domain/catalog";
import { INDICATORS, type ExternalLink as Ext, type ProfessionId } from "@/lib/domain/types";
import { formatMoney, formatPopulation, formatPercent, localTime, utcOffset } from "@/lib/format";
import { DEFAULT_CHECKLIST } from "@/lib/favorites/checklist";
import { CityImage } from "@/components/ui/city-image";
import { SourceNote } from "@/components/ui/source-note";
import { ScoreBar } from "@/components/ui/score-bar";
import { Badge } from "@/components/ui/primitives";
import { DemoInline } from "@/components/layout/demo-banner";
import { DestSection } from "@/components/destination/section";
import { CostSection } from "@/components/destination/cost-section";
import { CurrencySection } from "@/components/destination/currency-section";
import { ClimateChart } from "@/components/destination/climate-chart";
import { DestinationTools } from "@/components/destination/tools";
import { PurchasingPowerCalculator } from "@/components/calculator/purchasing-power-calculator";
import { DestinationCard } from "@/components/destinations/destination-card";

export const revalidate = 3600;

export function generateStaticParams() {
  return getDestinations().map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dest = getDestination(slug);
  if (!dest) return { title: "Destino não encontrado" };
  const title = `Morar em ${dest.name}, ${dest.country.name}: custo de vida, salários e qualidade de vida`;
  return withSocial({
    title,
    description: dest.summary,
    alternates: { canonical: `/destinos/${dest.slug}` },
    openGraph: { images: [{ url: dest.image.url, alt: dest.image.alt }] },
  });
}

const sections = [
  ["visao-geral", "Visão geral"],
  ["custo", "Custo de vida"],
  ["trabalho", "Trabalho"],
  ["calculadora", "Calculadora"],
  ["moeda", "Moeda"],
  ["qualidade", "Qualidade de vida"],
  ["moradia", "Moradia"],
  ["imigracao", "Imigração"],
  ["viver", "Viver na prática"],
] as const;

function LinkList({ links }: { links: Ext[] }) {
  return (
    <ul className="space-y-2">
      {links.map((l) => (
        <li key={l.url}>
          <a href={l.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2 text-sm font-medium text-navy-800 hover:text-teal-700">
            <ExternalLink className="size-3.5 text-subtle group-hover:text-teal-600" aria-hidden />
            {l.label}
            {l.type === "official" && <Badge tone="teal">Oficial</Badge>}
            {l.affiliate && <Badge tone="copper">Link afiliado</Badge>}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dest = getDestination(slug);
  if (!dest) notFound();
  const snapshot = await getExchangeSnapshot();
  const index = computeLivoraIndex(dest);
  const similar = getSimilarDestinations(dest);
  const tax = dest.country.taxModel;
  const code = dest.currency.code;
  const median = dest.salaries.median;
  const medianNet = median !== null ? estimateNetMonthly(median, tax) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "City",
    name: dest.name,
    description: dest.summary,
    geo: { "@type": "GeoCoordinates", latitude: dest.coordinates.lat, longitude: dest.coordinates.lng },
    containedInPlace: { "@type": "Country", name: dest.country.name },
    image: dest.image.url,
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* A. Cabeçalho visual */}
      <header className="relative isolate overflow-hidden bg-navy-950 text-white">
        <CityImage src={dest.image.url} alt={dest.image.alt} name="" sizes="100vw" priority className="absolute inset-0 -z-10 opacity-75" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-950 via-navy-950/50 to-navy-950/10" />
        <div className="container-page pt-24 pb-10 md:pt-40">
          <nav aria-label="Trilha" className="text-sm text-white/70">
            <Link href="/destinos" className="hover:text-white">Destinos</Link> <span aria-hidden>/</span>{" "}
            <Link href={`/destinos?continente=${dest.country.continent}`} className="hover:text-white">{continents[dest.country.continent].label}</Link> <span aria-hidden>/</span>{" "}
            <span className="text-white">{dest.name}</span>
          </nav>
          <h1 className="font-display mt-4 text-5xl font-medium tracking-tight md:text-7xl">{dest.name}</h1>
          <p className="mt-2 flex items-center gap-2 text-lg text-white/80">
            <MapPin className="size-4" aria-hidden /> {dest.country.name} · {continents[dest.country.continent].label}
          </p>
          <p className="mt-6 text-[11px] text-white/50">
            Foto: <a href={dest.image.creditUrl} className="underline" target="_blank" rel="noopener noreferrer">{dest.image.credit}</a>
          </p>
        </div>
      </header>

      <div className="sticky top-16 z-30 border-b border-sand-200 bg-white/95 backdrop-blur no-print">
        <nav aria-label="Seções do destino" className="container-page flex gap-1 overflow-x-auto py-2 [scrollbar-width:none]">
          {sections.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-navy-700 hover:bg-sand-100 hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
      </div>

      <div className="container-page">
        <div className="pt-8">
          <DestinationTools slug={dest.slug} name={dest.name} />
        </div>

        <DestSection id="visao-geral" letter="A · Visão geral" title={`Como é morar em ${dest.name}`}>
          <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div>
              <p className="text-lg leading-relaxed text-navy-800">{dest.summary}</p>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl bg-teal-50 p-5">
                  <h3 className="flex items-center gap-2 font-semibold text-teal-700"><CheckCircle2 className="size-4" aria-hidden /> Vantagens</h3>
                  <ul className="mt-3 space-y-2 text-sm text-navy-800">{dest.pros.map((p) => <li key={p}>{p}</li>)}</ul>
                </div>
                <div className="rounded-2xl bg-copper-50 p-5">
                  <h3 className="flex items-center gap-2 font-semibold text-copper-600"><AlertTriangle className="size-4" aria-hidden /> Desafios</h3>
                  <ul className="mt-3 space-y-2 text-sm text-navy-800">{dest.cons.map((p) => <li key={p}>{p}</li>)}</ul>
                </div>
              </div>
              <p className="mt-4 text-xs text-subtle">Vantagens e desafios são uma síntese editorial, não uma avaliação estatística.</p>
            </div>
            <dl className="divide-y divide-sand-100 rounded-2xl border border-sand-200 bg-white text-sm">
              {[
                { icon: Users, label: "População", value: formatPopulation(dest.population.value), extra: <SourceNote provenance={dest.population.provenance} label="Estimativa" /> },
                { icon: Languages, label: "Idiomas", value: dest.country.languages.join(", ") },
                { icon: Wallet, label: "Moeda", value: `${dest.currency.name} (${code})` },
                { icon: Clock, label: "Fuso horário", value: `${utcOffset(dest.timezone)} · agora ${localTime(dest.timezone)}`, extra: <span className="text-xs text-subtle">{dest.timezone}</span> },
                { icon: Globe2, label: "Clima", value: dest.climate.summary },
                { icon: MapPin, label: "Porte", value: sizeLabels[dest.size] },
              ].map((row) => (
                <div key={row.label} className="flex gap-3 px-5 py-3.5">
                  <row.icon className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden />
                  <div className="min-w-0">
                    <dt className="text-xs text-subtle">{row.label}</dt>
                    <dd className="font-medium text-ink">{row.value}</dd>
                    {row.extra}
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </DestSection>

        <DestSection id="custo" letter="B · Custo de vida" title="Quanto custa viver aqui por mês" description="Escolha um perfil de gastos e a composição do domicílio para recalcular. Valores na moeda local." aside={<DemoInline />}>
          <CostSection dest={dest} snapshot={snapshot} />
        </DestSection>

        <DestSection id="trabalho" letter="C · Salários e mercado de trabalho" title="Trabalho e renda" description="Salários são BRUTOS mensais (antes de impostos). O líquido é uma estimativa e depende da situação individual." aside={<DemoInline />}>
          <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
            <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white">
              <table className="w-full min-w-[30rem] text-sm">
                <caption className="sr-only">Salários por profissão em {code}</caption>
                <thead className="bg-sand-50 text-left text-xs text-subtle">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">Profissão</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">Bruto/mês</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">Líquido estimado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-sand-100 bg-teal-50/40">
                    <th scope="row" className="px-5 py-3 text-left font-semibold">Mediana geral</th>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">{median === null ? "Dados indisponíveis" : formatMoney(median, code)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{medianNet ? formatMoney(medianNet.net, code) : <span className="text-xs text-subtle italic">Indisponível</span>}</td>
                  </tr>
                  {(Object.keys(professionLabels) as ProfessionId[]).map((p) => {
                    const g = dest.salaries.byProfession[p];
                    const n = g !== undefined ? estimateNetMonthly(g, tax) : null;
                    return (
                      <tr key={p} className="border-t border-sand-100">
                        <th scope="row" className="px-5 py-3 text-left font-normal">{professionLabels[p]}</th>
                        <td className="px-5 py-3 text-right tabular-nums">{g === undefined ? <span className="text-xs text-subtle italic">Indisponível</span> : formatMoney(g, code)}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-muted">{n ? formatMoney(n.net, code) : <span className="text-xs text-subtle italic">Indisponível</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex flex-wrap items-center gap-2 border-t border-sand-100 px-5 py-3 text-xs text-subtle">
                <SourceNote provenance={dest.salaries.provenance} />
                {tax ? (
                  <span>
                    Líquido: dedução estimada de {formatPercent(tax.kind === "flat_estimate" ? tax.deductionRate : null)} — {tax.description}
                  </span>
                ) : (
                  <span>Sem dados tributários de {dest.country.name}: o líquido não é estimado.</span>
                )}
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold">Áreas com demanda</h3>
                <ul className="mt-2 flex flex-wrap gap-2">{dest.work.demandAreas.map((a) => <li key={a}><Badge tone="outline">{a}</Badge></li>)}</ul>
              </div>
              <div>
                <h3 className="font-semibold">Presencial, híbrido e remoto</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{dest.work.modes}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{dest.country.remoteWork}</p>
              </div>
              <div>
                <h3 className="font-semibold">Portais de emprego</h3>
                <p className="mt-1 mb-3 text-xs text-subtle">O Partiu Morar não verifica vagas nem garante disponibilidade.</p>
                <LinkList links={dest.country.jobPortals} />
              </div>
            </div>
          </div>
          <p className="mt-6 rounded-xl bg-sand-100 p-4 text-sm leading-relaxed text-muted">
            <strong className="text-navy-800">Tributação e contribuições:</strong> a estimativa considera uma pessoa solteira, residente fiscal e contratada localmente. Regimes especiais, deduções,
            dependentes e contratos como autônomo mudam o resultado. Consulte o simulador oficial do país ou um contador antes de decidir.
          </p>
        </DestSection>

        <DestSection id="calculadora" letter="D · Calculadora de poder de compra" title={`Quanto sobraria do seu salário em ${dest.name}?`} description="Informe sua renda e veja despesas, sobra e cenários. As hipóteses aparecem ao lado do resultado.">
          <PurchasingPowerCalculator destinations={[dest]} initialSlug={dest.slug} snapshot={snapshot} />
        </DestSection>

        <DestSection id="moeda" letter="E · Moeda e câmbio" title={`${dest.currency.name} (${code})`}>
          <CurrencySection dest={dest} snapshot={snapshot} />
        </DestSection>

        <DestSection id="qualidade" letter="F · Qualidade de vida" title="Indicadores de qualidade de vida" description="Escala de 0 a 100, maior é melhor. Toque em “i” para ver fonte, data, metodologia e limitações de cada indicador." aside={<DemoInline />}>
          <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="grid gap-x-10 rounded-2xl border border-sand-200 bg-white px-5 py-2 sm:grid-cols-2">
              {INDICATORS.map((id) => (
                <ScoreBar key={id} label={indicatorMeta[id].label} description={indicatorMeta[id].description} indicator={dest.quality[id]} methodology={indicatorMeta[id].methodology} limitations={indicatorMeta[id].limitations} />
              ))}
            </div>
            <div className="rounded-2xl bg-navy-900 p-5 text-white">
              <p className="text-sm text-white/70">Índice Partiu Morar</p>
              <p className="font-display mt-1 text-5xl tabular-nums">{index.value ?? "—"}<span className="text-lg text-white/50">/100</span></p>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                Média ponderada dos componentes com dados ({formatPercent(index.coverage)} do peso total disponível). Não é uma verdade absoluta: veja os componentes.
              </p>
              <table className="mt-4 w-full text-xs">
                <caption className="sr-only">Componentes do Índice Partiu Morar</caption>
                <thead className="text-white/50"><tr><th scope="col" className="pb-1 text-left font-medium">Componente</th><th scope="col" className="pb-1 text-right font-medium">Peso</th><th scope="col" className="pb-1 text-right font-medium">Nota</th><th scope="col" className="pb-1 text-right font-medium">Pontos</th></tr></thead>
                <tbody>
                  {index.components.map((c) => (
                    <tr key={c.id} className="border-t border-white/10">
                      <th scope="row" className="py-1.5 text-left font-normal text-white/85">{c.label}</th>
                      <td className="py-1.5 text-right tabular-nums text-white/60">{formatPercent(c.weight)}</td>
                      <td className="py-1.5 text-right tabular-nums">{c.score === null ? "—" : Math.round(c.score)}</td>
                      <td className="py-1.5 text-right tabular-nums text-teal-200">{c.contribution === null ? "—" : c.contribution.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Link href="/metodologia#indice" className="mt-4 inline-block text-xs font-medium text-teal-200 hover:underline">Como o índice é calculado →</Link>
            </div>
          </div>
        </DestSection>

        <DestSection id="moradia" letter="G · Moradia e bairros" title="Onde e como morar">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <h3 className="font-semibold">Faixas de aluguel</h3>
              <dl className="mt-3 space-y-2 text-sm">
                {([["1 quarto · centro", dest.costs.items.rent1Center], ["1 quarto · fora do centro", dest.costs.items.rent1Outside], ["3 quartos · centro", dest.costs.items.rent3Center], ["3 quartos · fora do centro", dest.costs.items.rent3Outside]] as const).map(([l, v]) => (
                  <div key={l} className="flex justify-between gap-3"><dt className="text-muted">{l}</dt><dd className="font-medium tabular-nums">{formatMoney(v, code)}</dd></div>
                ))}
              </dl>
              <div className="mt-3"><SourceNote provenance={dest.costs.provenance} /></div>
            </div>
            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <h3 className="font-semibold">Tipos de moradia</h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm text-muted">{dest.housing.types.map((t) => <li key={t}>{t}</li>)}</ul>
              <h3 className="mt-5 font-semibold">Centro × periferia</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{dest.housing.centerVsOutside}</p>
            </div>
            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <h3 className="font-semibold">Portais imobiliários</h3>
              <p className="mt-1 mb-3 text-xs text-subtle">Links externos, sem parceria. O Partiu Morar não verifica anúncios nem preços.</p>
              <LinkList links={dest.country.housingPortals} />
            </div>
          </div>
        </DestSection>

        <DestSection id="imigracao" letter="H · Imigração e documentação" title="Vistos e autorização de residência">
          <div className="rounded-2xl border border-copper-500/30 bg-copper-50 p-5 text-sm leading-relaxed text-navy-800">
            <p>{dest.country.immigration.summary}</p>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
            <ul className="grid gap-4 sm:grid-cols-2">
              {dest.country.immigration.pathways.map((p) => (
                <li key={p.title} className="rounded-2xl border border-sand-200 bg-white p-5">
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{p.description}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold">Fontes oficiais</h3>
                <div className="mt-3"><LinkList links={dest.country.immigration.links} /></div>
              </div>
              {dest.country.immigration.nationalityNotes && (
                <div className="rounded-xl bg-teal-50 p-4 text-sm text-teal-700">
                  {Object.entries(dest.country.immigration.nationalityNotes).map(([iso, note]) => (
                    <p key={iso}><strong>{iso === "BR" ? "Para brasileiros: " : `${iso}: `}</strong>{note}</p>
                  ))}
                </div>
              )}
              <p className="text-xs text-subtle">
                Última verificação: {dest.country.immigration.lastVerified ?? "pendente de verificação editorial"}. Informação geral, não é aconselhamento jurídico.
              </p>
            </div>
          </div>
        </DestSection>

        <DestSection id="viver" letter="I · Viver na prática" title="O dia a dia">
          <div className="grid gap-8 lg:grid-cols-2">
            <dl className="grid gap-5 sm:grid-cols-2">
              {[
                ["Idioma e adaptação", dest.country.practical.language],
                ["Sistema de saúde", dest.country.practical.health],
                ["Educação", dest.country.practical.education],
                ["Conectividade", dest.country.practical.connectivity],
                ["Transporte", dest.housing.centerVsOutside],
              ].map(([t, v]) => (
                <div key={t}>
                  <dt className="font-semibold">{t}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="rounded-2xl border border-sand-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Clima ao longo do ano</h3>
                <SourceNote provenance={dest.climate.monthlyHighC.provenance} />
              </div>
              {dest.climate.monthlyHighC.value ? <ClimateChart values={dest.climate.monthlyHighC.value} /> : <p className="mt-4 text-sm text-subtle italic">Dados indisponíveis</p>}
            </div>
          </div>
          <div className="mt-8 rounded-2xl bg-sand-100 p-6">
            <h3 className="font-semibold">Checklist de planejamento de mudança</h3>
            <ul className="mt-3 grid gap-2 text-sm text-navy-800 sm:grid-cols-2">
              {DEFAULT_CHECKLIST.map((c) => <li key={c} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden />{c}</li>)}
            </ul>
            <Link href="/favoritos#checklist" className="mt-4 inline-block text-sm font-medium text-teal-700 hover:underline">Acompanhar minha checklist →</Link>
          </div>
        </DestSection>

        <section aria-labelledby="similares" className="no-print border-t border-sand-200 py-12">
          <h2 id="similares" className="font-display text-3xl font-medium">Destinos semelhantes</h2>
          <p className="mt-2 text-sm text-muted">Mesmo continente, clima ou estilo de vida.</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((d) => <DestinationCard key={d.slug} dest={d} snapshot={snapshot} />)}
          </div>
        </section>
      </div>
    </article>
  );
}
