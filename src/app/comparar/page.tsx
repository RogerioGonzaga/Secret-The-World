import type { Metadata } from "next";
import { Suspense } from "react";
import { getDestinations } from "@/lib/data/repository";
import { getExchangeSnapshot } from "@/lib/integrations/exchange/service";
import { parseCompareSlugs } from "@/lib/compare/compare";
import { Comparator } from "@/components/compare/comparator";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Comparar cidades",
  description: "Compare até três cidades lado a lado: custo de vida, aluguel, salários, poder de compra, segurança, clima e qualidade de vida.",
  alternates: { canonical: "/comparar" },
};

export default async function CompararPage({ searchParams }: { searchParams: Promise<{ cidades?: string }> }) {
  const [{ cidades }, snapshot] = await Promise.all([searchParams, getExchangeSnapshot()]);
  const destinations = getDestinations();
  const initial = parseCompareSlugs(cidades, new Set(destinations.map((d) => d.slug)));
  return (
    <>
      <PageHeader eyebrow="Comparador" title="Compare cidades lado a lado" description="Escolha de duas a três cidades. A comparação usa a mesma metodologia para todas e pode ser compartilhada pela URL." />
      <Suspense>
        <Comparator destinations={destinations} snapshot={snapshot} initialSlugs={initial} />
      </Suspense>
    </>
  );
}
