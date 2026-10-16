import Link from "next/link";
import { ArrowRight, ArrowUpRight, Calculator, Compass, FileSearch, GitCompareArrows, Laptop, ShieldCheck, Sparkles, Wifi } from "lucide-react";
import { getArticles, getDestinations } from "@/lib/data/repository";
import { getExchangeSnapshot } from "@/lib/integrations/exchange/service";
import { continents } from "@/lib/domain/catalog";
import { salaryCoverage } from "@/lib/explore/filters";
import { formatPercent } from "@/lib/format";
import { articleCategories } from "@/lib/data/seed/articles";
import type { ContinentId } from "@/lib/domain/types";
import { HeroSearch } from "@/components/home/hero-search";
import { BudgetExplorer } from "@/components/home/budget-explorer";
import { DestinationCard } from "@/components/destinations/destination-card";
import { CityImage } from "@/components/ui/city-image";
import { SectionHeading } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";

export const revalidate = 3600;

const popularComparisons: [string, string][] = [
  ["lisboa-portugal", "porto-portugal"],
  ["madrid-espanha", "barcelona-espanha"],
  ["toronto-canada", "montreal-canada"],
  ["lisboa-portugal", "madrid-espanha"],
  ["bangkok-tailandia", "chiang-mai-tailandia"],
  ["berlim-alemanha", "amsterda-paises-baixos"],
];

export default async function HomePage() {
  const destinations = getDestinations();
  const snapshot = await getExchangeSnapshot();
  const bySlug = new Map(destinations.map((d) => [d.slug, d]));
  const searchItems = destinations.map((d) => ({ slug: d.slug, name: d.name, country: d.country.name, continent: d.country.continent }));
  const hero = bySlug.get("lisboa-portugal") ?? destinations[0];

  const trending = destinations.filter((d) => d.tags.includes("tendencia")).slice(0, 3);
  const opportunities = destinations
    .map((d) => ({ d, coverage: salaryCoverage(d) }))
    .filter((x): x is { d: (typeof destinations)[number]; coverage: number } => x.coverage !== null)
    .sort((a, b) => b.coverage - a.coverage)
    .slice(0, 4);
  const remote = destinations
    .filter((d) => d.work.remoteFriendly)
    .sort((a, b) => (b.quality.internet.score ?? 0) - (a.quality.internet.score ?? 0))
    .slice(0, 4);
  const continentCounts = (Object.keys(continents) as ContinentId[])
    .map((id) => ({ id, ...continents[id], count: destinations.filter((d) => d.country.continent === id).length, sample: destinations.find((d) => d.country.continent === id) }))
    .filter((c) => c.count > 0);
  const articles = getArticles().slice(0, 3);
  const popular = ["lisboa-portugal", "madrid-espanha", "bangkok-tailandia", "toronto-canada"].map((s) => bySlug.get(s)).filter((d) => d !== undefined);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-navy-950">
        {hero && (
          <CityImage src={hero.image.url} alt="" name="" sizes="100vw" priority className="absolute inset-0 -z-10 opacity-70" />
        )}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(7_19_32/0.55)_0%,rgb(7_19_32/0.35)_45%,rgb(7_19_32/0.85)_100%)]" />
        <div className="container-page pt-20 pb-16 md:pt-32 md:pb-24">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90 ring-1 ring-white/20 backdrop-blur">
            <Compass className="size-3.5" aria-hidden /> {destinations.length} destinos em {continentCounts.length} continentes
          </p>
          <h1 className="font-display max-w-4xl text-[2.6rem] leading-[1.04] font-medium tracking-tight text-white sm:text-6xl md:text-7xl">
            Seu próximo capítulo começa em algum lugar do mundo.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">
            Descubra onde seu dinheiro rende mais, encontre novas oportunidades e compare como seria sua vida em qualquer lugar.
          </p>
          <HeroSearch items={searchItems} className="mt-10 max-w-2xl" />
          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-white/60">Populares:</span>
            {popular.map((d) => (
              <Link key={d.slug} href={`/destinos/${d.slug}`} className="rounded-full bg-white/10 px-3 py-1 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20">
                {d.name}
              </Link>
            ))}
          </div>
          <Link href="/destino-ideal" className="group mt-12 inline-flex items-center gap-3 rounded-2xl bg-white/10 py-3 pr-5 pl-3 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15">
            <span className="grid size-10 place-items-center rounded-xl bg-copper-500">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm text-white/70">Não sabe para onde ir?</span>
              <span className="block font-medium">Descubra seu destino ideal</span>
            </span>
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </section>

      {/* 1. Destinos em alta */}
      <section className="container-page pt-20">
        <SectionHeading
          eyebrow="Destinos em alta"
          title="Cidades que estão no radar de quem planeja mudar"
          description="Seleção editorial de destinos procurados por brasileiros e profissionais internacionais. Não é um ranking."
          action={{ href: "/destinos", label: "Ver todos os destinos" }}
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trending.map((d, i) => (
            <DestinationCard key={d.slug} dest={d} snapshot={snapshot} priority={i === 0} />
          ))}
        </div>
      </section>

      {/* 2. Onde o dinheiro rende */}
      <section className="container-page pt-24">
        <SectionHeading
          eyebrow="Seu dinheiro"
          title="Lugares onde seu dinheiro pode render mais"
          description="Mova o controle e veja quanto sobraria do seu orçamento em cada destino, a partir do custo de vida estimado."
          action={{ href: "/custo-de-vida", label: "Fazer cálculo completo" }}
        />
        <BudgetExplorer destinations={destinations} snapshot={snapshot} />
      </section>

      {/* 3 e 4. Oportunidades e remoto */}
      <section className="container-page grid gap-6 pt-24 lg:grid-cols-2">
        <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-card md:p-8">
          <p className="text-xs font-semibold tracking-[0.14em] text-teal-600 uppercase">Carreira</p>
          <h2 className="font-display mt-2 text-3xl font-medium">Cidades com oportunidades profissionais</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Ordenadas pela razão entre o salário líquido mediano estimado e o custo de vida local de 1 pessoa. Acima de 100%, o salário típico cobre as despesas.
          </p>
          <ol className="mt-6 space-y-3">
            {opportunities.map(({ d, coverage }) => (
              <li key={d.slug}>
                <Link href={`/destinos/${d.slug}#trabalho`} className="group flex items-center justify-between gap-4 rounded-xl border border-sand-100 px-4 py-3 transition hover:border-teal-200 hover:bg-teal-50/40">
                  <div>
                    <p className="font-medium text-ink">{d.name}</p>
                    <p className="text-xs text-muted">{d.work.demandAreas.slice(0, 2).join(" · ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums text-teal-700">{formatPercent(coverage)}</p>
                    <p className="text-[11px] text-subtle">salário ÷ custo</p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
          <Link href="/trabalho" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
            Salários por profissão <ArrowRight aria-hidden />
          </Link>
        </div>
        <div className="rounded-3xl bg-navy-900 p-6 text-white md:p-8">
          <p className="text-xs font-semibold tracking-[0.14em] text-teal-200 uppercase">Trabalho remoto</p>
          <h2 className="font-display mt-2 text-3xl font-medium">Destinos para quem trabalha de qualquer lugar</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Cidades com histórico de receptividade a profissionais remotos, ordenadas pelo indicador de internet. Os vistos variam: confira sempre a seção de imigração.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {remote.map((d) => (
              <li key={d.slug}>
                <Link href={`/destinos/${d.slug}`} className="group block rounded-xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/10">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{d.name}</p>
                    <ArrowUpRight className="size-4 text-white/50 group-hover:text-white" aria-hidden />
                  </div>
                  <p className="mt-1 text-xs text-white/60">{d.country.name}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-teal-200">
                    <Wifi className="size-3.5" aria-hidden /> Internet {d.quality.internet.score ?? "—"}/100
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/destinos?ordem=qualidade" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white hover:text-teal-200">
            <Laptop className="size-4" aria-hidden /> Explorar todos os destinos
          </Link>
        </div>
      </section>

      {/* 5. Comparações populares */}
      <section className="container-page pt-24">
        <SectionHeading eyebrow="Comparar" title="Comparações populares" description="Coloque cidades lado a lado com a mesma metodologia de custos e indicadores." action={{ href: "/comparar", label: "Montar minha comparação" }} />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {popularComparisons.map(([a, b]) => {
            const da = bySlug.get(a);
            const db = bySlug.get(b);
            if (!da || !db) return null;
            return (
              <li key={`${a}-${b}`}>
                <Link href={`/comparar?cidades=${a},${b}`} className="group flex items-center gap-4 rounded-2xl border border-sand-200 bg-white p-4 shadow-card transition hover:shadow-lift">
                  <div className="flex -space-x-3">
                    <CityImage src={da.image.url} alt="" name={da.name} sizes="48px" className="size-12 rounded-full ring-2 ring-white" />
                    <CityImage src={db.image.url} alt="" name={db.name} sizes="48px" className="size-12 rounded-full ring-2 ring-white" />
                  </div>
                  <p className="flex-1 font-medium text-ink">
                    {da.name} <span className="text-subtle">vs</span> {db.name}
                  </p>
                  <GitCompareArrows className="size-4 text-subtle group-hover:text-teal-600" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 6. Destino ideal */}
      <section className="container-page pt-24">
        <div className="relative overflow-hidden rounded-3xl bg-teal-700 px-6 py-12 text-white md:px-12 md:py-16">
          <div className="absolute -top-24 -right-24 size-72 rounded-full border border-white/10" aria-hidden />
          <div className="absolute -right-8 -bottom-32 size-96 rounded-full border border-white/10" aria-hidden />
          <div className="relative max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.14em] text-teal-100 uppercase">Meu destino ideal</p>
            <h2 className="font-display mt-3 text-3xl font-medium md:text-5xl">Responda algumas perguntas e veja quais lugares combinam com você.</h2>
            <p className="mt-4 text-teal-50/85">
              Orçamento, clima, idioma, carreira e estilo de vida. Sem cadastro: suas respostas ficam apenas no seu navegador, e cada recomendação mostra exatamente por que apareceu.
            </p>
            <Link href="/destino-ideal" className={buttonVariants({ variant: "light", size: "lg", className: "mt-8" })}>
              <Sparkles aria-hidden /> Começar o questionário
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Continentes */}
      <section className="container-page pt-24">
        <SectionHeading eyebrow="Explore por continente" title="Por onde você quer começar?" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {continentCounts.map((c) => (
            <li key={c.id}>
              <Link href={`/destinos?continente=${c.id}`} className="group relative block overflow-hidden rounded-2xl">
                {c.sample && <CityImage src={c.sample.image.url} alt="" name="" sizes="(min-width:1024px) 33vw, 100vw" className="aspect-[16/9] transition duration-500 group-hover:scale-[1.03]" />}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="font-display text-2xl">{c.label}</p>
                  <p className="mt-1 text-sm text-white/75">
                    {c.count} {c.count === 1 ? "destino" : "destinos"} · {c.description}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 8. Como funciona */}
      <section className="container-page pt-24">
        <SectionHeading eyebrow="Como a LIVORA funciona" title="Planejamento com números que você consegue auditar" />
        <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Compass, title: "Explore", text: "Filtre destinos por orçamento, clima, idioma, segurança e mercado de trabalho." },
            { icon: Calculator, title: "Calcule", text: "Simule quanto sobra do seu salário com perfis de gasto e hipóteses explícitas." },
            { icon: GitCompareArrows, title: "Compare", text: "Coloque até três cidades lado a lado com a mesma metodologia." },
            { icon: FileSearch, title: "Confira a fonte", text: "Cada número mostra origem, data e limitações. Dados demonstrativos são sempre sinalizados." },
          ].map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-sand-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-700">
                  <step.icon className="size-5" aria-hidden />
                </span>
                <span className="font-display text-3xl text-sand-300">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 flex items-start gap-2 text-sm text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-600" aria-hidden />
          <span>
            Sem cadastro obrigatório e sem venda de dados. Leia a{" "}
            <Link href="/metodologia" className="font-medium text-navy-800 underline underline-offset-2">
              metodologia
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="font-medium text-navy-800 underline underline-offset-2">
              política de privacidade
            </Link>
            .
          </span>
        </p>
      </section>

      {/* 9. Conteúdo */}
      <section className="container-page pt-24">
        <SectionHeading eyebrow="Guias" title="Para planejar a mudança com calma" action={{ href: "/guias", label: "Todos os guias" }} />
        <div className="grid gap-6 md:grid-cols-3">
          {articles.map((a) => (
            <article key={a.slug} className="group relative flex flex-col rounded-2xl border border-sand-200 bg-white p-6 transition hover:shadow-lift">
              <p className="text-xs font-semibold tracking-wide text-teal-600 uppercase">{articleCategories[a.category]}</p>
              <h3 className="mt-3 text-lg leading-snug font-semibold text-ink">
                <Link href={`/guias/${a.slug}`} className="after:absolute after:inset-0">
                  {a.title}
                </Link>
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{a.excerpt}</p>
              <p className="mt-5 text-xs text-subtle">{a.readingMinutes} min de leitura</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
