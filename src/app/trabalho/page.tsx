import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import { getDestinations } from "@/lib/data/repository";
import { getExchangeSnapshot } from "@/lib/integrations/exchange/service";
import { SalaryExplorer } from "@/components/work/salary-explorer";
import { PageHeader } from "@/components/ui/primitives";

export const revalidate = 3600;

export const metadata: Metadata = withSocial({
  title: "Salários e trabalho no exterior",
  description: "Compare salários brutos e líquidos estimados por profissão em cidades do mundo e veja quanto eles cobrem do custo de vida local.",
  alternates: { canonical: "/trabalho" },
});

export default async function TrabalhoPage() {
  const snapshot = await getExchangeSnapshot();
  return (
    <>
      <PageHeader eyebrow="Trabalho" title="Salários por profissão pelo mundo" description="Bruto não é líquido. Veja quanto cada profissão ganha, quanto sobra depois dos impostos estimados e quanto isso cobre do custo de vida local." />
      <div className="container-page py-10">
        <SalaryExplorer destinations={getDestinations()} snapshot={snapshot} />
        <div className="mt-10 rounded-2xl bg-sand-100 p-6 text-sm leading-relaxed text-muted">
          <h2 className="font-semibold text-ink">Sobre vagas de emprego</h2>
          <p className="mt-2">
            O Partiu Morar não publica vagas nem promete emprego. Em cada página de destino você encontra links para portais oficiais e privados de emprego do país. Desconfie de ofertas que cobram
            taxas antecipadas para garantir vaga ou visto.
          </p>
        </div>
      </div>
    </>
  );
}
