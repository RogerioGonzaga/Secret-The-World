import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import { getDestinations } from "@/lib/data/repository";
import { getExchangeSnapshot } from "@/lib/integrations/exchange/service";
import { Quiz } from "@/components/quiz/quiz";
import { PageHeader } from "@/components/ui/primitives";

export const revalidate = 3600;

export const metadata: Metadata = withSocial({
  title: "Descubra seu destino ideal",
  description: "Responda algumas perguntas sobre orçamento, clima, idioma e carreira e receba recomendações explicadas de cidades para morar.",
  alternates: { canonical: "/destino-ideal" },
});

export default async function DestinoIdealPage() {
  const snapshot = await getExchangeSnapshot();
  return (
    <>
      <PageHeader eyebrow="Meu destino ideal" title="Descubra quais lugares combinam com você" description="Oito perguntas rápidas. Suas respostas ficam apenas neste navegador e cada recomendação mostra por que apareceu." />
      <Quiz destinations={getDestinations()} snapshot={snapshot} />
    </>
  );
}
