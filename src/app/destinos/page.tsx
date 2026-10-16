import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import { Suspense } from "react";
import { getDestinations } from "@/lib/data/repository";
import { getExchangeSnapshot } from "@/lib/integrations/exchange/service";
import { parseFilters } from "@/lib/explore/url-state";
import { Explorer } from "@/components/destinations/explorer";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = withSocial({
  title: "Explorar destinos",
  description: "Filtre cidades do mundo por orçamento, clima, idioma, segurança, custo de vida e oportunidades de trabalho.",
  alternates: { canonical: "/destinos" },
});

export default async function DestinosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, snapshot] = await Promise.all([searchParams, getExchangeSnapshot()]);
  const destinations = getDestinations();
  return (
    <>
      <PageHeader
        eyebrow="Explorador"
        title="Explore destinos pelo mundo"
        description="Combine filtros de orçamento, clima, idioma e trabalho. A URL desta página guarda sua pesquisa para você compartilhar."
      />
      <Suspense>
        <Explorer destinations={destinations} snapshot={snapshot} initial={parseFilters(params)} />
      </Suspense>
    </>
  );
}
