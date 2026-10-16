import type { Metadata } from "next";
import { getArticles } from "@/lib/data/repository";
import { GuideList } from "@/components/guides/guide-list";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Guias de mudança internacional",
  description: "Guias práticos sobre custo de vida, salários, reserva financeira e planejamento de mudança para outro país.",
  alternates: { canonical: "/guias" },
};

export default function GuiasPage() {
  return (
    <>
      <PageHeader eyebrow="Guias" title="Planeje sua mudança com calma" description="Orientações gerais escritas pela equipe da LIVORA. Não substituem aconselhamento jurídico, migratório ou financeiro." />
      <div className="container-page py-10">
        <GuideList articles={getArticles()} />
      </div>
    </>
  );
}
