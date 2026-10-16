"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Article } from "@/lib/domain/types";
import { articleCategories } from "@/lib/data/seed/articles";
import { normalizeSearch, cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/primitives";

export function GuideList({ articles }: { articles: Article[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Article["category"] | null>(null);
  const used = [...new Set(articles.map((a) => a.category))];
  const list = useMemo(() => {
    const query = normalizeSearch(q);
    return articles.filter((a) => (!cat || a.category === cat) && (!query || normalizeSearch(`${a.title} ${a.excerpt}`).includes(query)));
  }, [articles, q, cat]);

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categorias">
          {[null, ...used].map((c) => (
            <button key={c ?? "todas"} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className={cn("rounded-full px-3.5 py-1.5 text-sm ring-1 transition", cat === c ? "bg-navy-900 text-white ring-navy-900" : "bg-white ring-sand-300 hover:ring-navy-600/40")}>
              {c ? articleCategories[c] : "Todas"}
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <label htmlFor="guide-q" className="sr-only">Buscar guias</label>
          <input id="guide-q" type="search" className="input pl-10" placeholder="Buscar guias" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {list.length === 0 ? (
        <div className="mt-8"><EmptyState icon={<Search />} title="Nenhum guia encontrado" description="Tente outra palavra ou categoria." /></div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <article key={a.slug} className="group relative flex flex-col rounded-2xl border border-sand-200 bg-white p-6 transition hover:shadow-lift">
              <p className="text-xs font-semibold tracking-wide text-teal-600 uppercase">{articleCategories[a.category]}</p>
              <h2 className="mt-3 text-lg leading-snug font-semibold">
                <Link href={`/guias/${a.slug}`} className="after:absolute after:inset-0">{a.title}</Link>
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{a.excerpt}</p>
              <p className="mt-5 text-xs text-subtle">{a.readingMinutes} min de leitura</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
