import type { Metadata } from "next";
import { getDestinations } from "@/lib/data/repository";
import { PlannerView } from "@/components/favorites/planner-view";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Favoritos e planejamento",
  description: "Seus destinos salvos, anotações e checklist de mudança.",
  robots: { index: false },
};

export default async function FavoritosPage({ searchParams }: { searchParams: Promise<{ lista?: string }> }) {
  const { lista } = await searchParams;
  const destinations = getDestinations();
  const valid = new Set(destinations.map((d) => d.slug));
  const shared = [...new Set((lista ?? "").split(",").filter((s) => valid.has(s)))].slice(0, 30);
  return (
    <>
      <PageHeader eyebrow="Planejamento" title="Seus favoritos e sua mudança" description="Salve destinos, escreva anotações, compare os finalistas e acompanhe a checklist. Sem cadastro." />
      <PlannerView destinations={destinations} sharedSlugs={shared} />
    </>
  );
}
