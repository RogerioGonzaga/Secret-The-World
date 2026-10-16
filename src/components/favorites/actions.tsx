"use client";

import { useState } from "react";
import { Check, GitCompareArrows, Heart, Link2, Share2 } from "lucide-react";
import { planner, usePlanner } from "@/lib/favorites/store";
import { MAX_COMPARE } from "@/lib/compare/compare";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function FavoriteButton({ slug, name, variant = "icon", className }: { slug: string; name: string; variant?: "icon" | "full"; className?: string }) {
  const { favorites } = usePlanner();
  const saved = favorites.some((f) => f.slug === slug);
  const label = saved ? `Remover ${name} dos favoritos` : `Salvar ${name} nos favoritos`;
  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          planner.toggleFavorite(slug);
        }}
        aria-pressed={saved}
        aria-label={label}
        title={label}
        className={cn("grid size-10 place-items-center rounded-full bg-white/95 text-ink shadow-card transition hover:scale-105", className)}
      >
        <Heart className={cn("size-[18px] transition", saved && "fill-copper-500 text-copper-500")} aria-hidden />
      </button>
    );
  }
  return (
    <Button variant="outline" onClick={() => planner.toggleFavorite(slug)} aria-pressed={saved} className={className}>
      <Heart className={cn(saved && "fill-copper-500 text-copper-500")} aria-hidden />
      {saved ? "Salvo nos favoritos" : "Salvar destino"}
    </Button>
  );
}

export function CompareButton({ slug, className, size = "md" }: { slug: string; className?: string; size?: "sm" | "md" }) {
  const { compare } = usePlanner();
  const [full, setFull] = useState(false);
  const active = compare.includes(slug);
  return (
    <div className="relative">
      <Button
        variant="outline"
        size={size}
        className={className}
        aria-pressed={active}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const ok = planner.toggleCompare(slug);
          setFull(!ok);
          if (!ok) setTimeout(() => setFull(false), 3000);
        }}
      >
        {active ? <Check aria-hidden /> : <GitCompareArrows aria-hidden />}
        {active ? "Na comparação" : "Comparar"}
      </Button>
      <span role="status" className={full ? "absolute top-full left-0 z-10 mt-1 w-56 rounded-lg bg-navy-900 px-3 py-2 text-xs text-white shadow-lift" : "sr-only"}>
        {full ? `Você já tem ${MAX_COMPARE} cidades na comparação. Remova uma para adicionar outra.` : ""}
      </span>
    </div>
  );
}

/** Compartilha via Web Share API quando disponível; senão copia o link. */
export function ShareButton({ title, text, url, className, label = "Compartilhar" }: { title: string; text?: string; url?: string; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      className={className}
      onClick={async () => {
        const href = url ? new URL(url, window.location.origin).toString() : window.location.href;
        if (navigator.share) {
          try {
            await navigator.share({ title, text, url: href });
            return;
          } catch {
            // Usuário cancelou: cai para cópia.
          }
        }
        try {
          await navigator.clipboard.writeText(href);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {
          window.prompt("Copie o link:", href);
        }
      }}
    >
      {copied ? <Link2 aria-hidden /> : <Share2 aria-hidden />}
      <span aria-live="polite">{copied ? "Link copiado" : label}</span>
    </Button>
  );
}
