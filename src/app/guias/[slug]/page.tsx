import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { getArticle, getArticles, getDestination } from "@/lib/data/repository";
import { articleCategories } from "@/lib/data/seed/articles";
import { formatDate } from "@/lib/format";

export function generateStaticParams() {
  return getArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = getArticle((await params).slug);
  if (!a) return { title: "Guia não encontrado" };
  return withSocial({ title: a.title, description: a.excerpt, alternates: { canonical: `/guias/${a.slug}` }, openGraph: { type: "article", publishedTime: a.publishedAt, modifiedTime: a.updatedAt } });
}

export default async function GuiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  const related = getArticles().filter((a) => a.slug !== article.slug).sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category)).slice(0, 3);
  const destinations = (article.relatedDestinations ?? []).map(getDestination).filter((d) => d !== undefined);
  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.excerpt, datePublished: article.publishedAt, dateModified: article.updatedAt, author: { "@type": "Organization", name: "Partiu Morar" } };

  return (
    <article className="container-page max-w-3xl py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Trilha" className="text-sm text-muted"><Link href="/guias" className="hover:text-ink">Guias</Link> / {articleCategories[article.category]}</nav>
      <h1 className="font-display mt-4 text-4xl leading-tight font-medium tracking-tight md:text-5xl">{article.title}</h1>
      <p className="mt-4 text-lg text-muted">{article.excerpt}</p>
      <p className="mt-6 text-sm text-subtle">{article.author} · atualizado em {formatDate(article.updatedAt)} · {article.readingMinutes} min de leitura</p>
      <div className="prose-livora mt-10">
        {article.body.map((b, i) => {
          if (b.type === "h2") return <h2 key={i}>{b.text}</h2>;
          if (b.type === "ul") return <ul key={i}>{b.items.map((it) => <li key={it}>{it}</li>)}</ul>;
          if (b.type === "callout") return <p key={i} className="flex gap-3 rounded-xl bg-teal-50 p-4 text-teal-700"><Info className="mt-0.5 size-5 shrink-0" aria-hidden />{b.text}</p>;
          return <p key={i}>{b.text}</p>;
        })}
      </div>
      <p className="mt-10 rounded-xl bg-sand-100 p-4 text-xs leading-relaxed text-muted">
        Conteúdo de orientação geral produzido pela equipe do Partiu Morar, sem citação de pesquisas ou especialistas externos. Regras de imigração e tributação mudam: confirme sempre nas fontes oficiais.
      </p>
      {destinations.length > 0 && (
        <section className="mt-12" aria-labelledby="dest-rel">
          <h2 id="dest-rel" className="text-lg font-semibold">Destinos citados</h2>
          <ul className="mt-3 flex flex-wrap gap-2">{destinations.map((d) => <li key={d.slug}><Link href={`/destinos/${d.slug}`} className="inline-flex rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-sand-300 hover:ring-teal-500">{d.name}</Link></li>)}</ul>
        </section>
      )}
      <section className="mt-12 border-t border-sand-200 pt-8" aria-labelledby="rel">
        <h2 id="rel" className="text-lg font-semibold">Continue lendo</h2>
        <ul className="mt-4 space-y-3">{related.map((a) => <li key={a.slug}><Link href={`/guias/${a.slug}`} className="font-medium text-navy-800 hover:text-teal-700">{a.title}</Link></li>)}</ul>
      </section>
    </article>
  );
}
