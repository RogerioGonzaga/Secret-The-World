"use client";

import Link from "next/link";
import { GitCompareArrows, Printer } from "lucide-react";
import { CompareButton, FavoriteButton, ShareButton } from "@/components/favorites/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { usePlanner } from "@/lib/favorites/store";

export function DestinationTools({ slug, name }: { slug: string; name: string }) {
  const { compare } = usePlanner();
  return (
    <div className="no-print flex flex-wrap gap-2">
      <FavoriteButton slug={slug} name={name} variant="full" />
      <CompareButton slug={slug} />
      <ShareButton title={`${name} na LIVORA`} text={`Veja como é morar em ${name}`} />
      <Button variant="outline" onClick={() => window.print()}>
        <Printer aria-hidden /> Imprimir resumo
      </Button>
      {compare.length >= 2 && (
        <Link href={`/comparar?cidades=${compare.join(",")}`} className={buttonVariants({ variant: "secondary" })}>
          <GitCompareArrows aria-hidden /> Ver comparação ({compare.length})
        </Link>
      )}
    </div>
  );
}
