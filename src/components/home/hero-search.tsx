"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import { normalizeSearch } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface SearchItem {
  slug: string;
  name: string;
  country: string;
  continent: string;
}

/** Busca com sugestões (combobox acessível): setas navegam, Enter abre, Esc fecha. */
export function HeroSearch({ items, className, size = "lg" }: { items: SearchItem[]; className?: string; size?: "lg" | "md" }) {
  const router = useRouter();
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return [];
    return items
      .map((item) => {
        const name = normalizeSearch(item.name);
        const country = normalizeSearch(item.country);
        const rank = name.startsWith(q) ? 0 : country.startsWith(q) ? 1 : name.includes(q) || country.includes(q) ? 2 : -1;
        return { item, rank };
      })
      .filter((x) => x.rank >= 0)
      .sort((a, b) => a.rank - b.rank || a.item.name.localeCompare(b.item.name))
      .slice(0, 6)
      .map((x) => x.item);
  }, [items, query]);

  const go = (slug?: string) => {
    setOpen(false);
    if (slug) router.push(`/destinos/${slug}`);
    else router.push(query.trim() ? `/destinos?q=${encodeURIComponent(query.trim())}` : "/destinos");
  };

  const listId = `${id}-list`;
  const showList = open && query.trim().length > 0;

  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        go(active >= 0 ? suggestions[active]?.slug : undefined);
      }}
    >
      <label htmlFor={`${id}-input`} className="sr-only">
        Pesquisar cidade ou país
      </label>
      <div className={cn("flex items-center gap-2 rounded-2xl bg-white p-2 shadow-lift ring-1 ring-black/5", size === "lg" ? "pl-4" : "pl-3")}>
        <Search className="size-5 shrink-0 text-subtle" aria-hidden />
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          placeholder="Cidade ou país: Lisboa, Canadá…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, -1));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className={cn("min-w-0 flex-1 bg-transparent text-ink placeholder:text-subtle focus:outline-none", size === "lg" ? "h-12 text-base" : "h-10 text-[15px]")}
        />
        <button type="submit" className={cn("shrink-0 rounded-xl bg-navy-900 font-medium text-white transition hover:bg-navy-800", size === "lg" ? "h-12 px-5 text-[15px]" : "h-10 px-4 text-sm")}>
          <span className="hidden sm:inline">Explorar destinos</span>
          <span className="sm:hidden">Buscar</span>
        </button>
      </div>
      <ul
        id={listId}
        role="listbox"
        aria-label="Sugestões de destinos"
        className={cn("absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-sand-200 bg-white py-2 text-left shadow-lift", !showList && "hidden")}
      >
        {suggestions.length === 0 ? (
          <li className="px-4 py-3 text-sm text-muted">
            Nenhum destino encontrado para “{query}”. Pressione Enter para buscar no explorador.
          </li>
        ) : (
          suggestions.map((s, i) => (
            <li
              key={s.slug}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                go(s.slug);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn("flex cursor-pointer items-center gap-3 px-4 py-2.5", i === active && "bg-sand-100")}
            >
              <MapPin className="size-4 text-teal-600" aria-hidden />
              <span className="font-medium text-ink">{s.name}</span>
              <span className="text-sm text-muted">{s.country}</span>
            </li>
          ))
        )}
      </ul>
    </form>
  );
}
