import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";
import Link from "next/link";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = withSocial({ title: "Sobre o Partiu Morar", description: "O que é o Partiu Morar, nossos princípios sobre dados e como pretendemos nos sustentar.", alternates: { canonical: "/sobre" } });

export default function SobrePage() {
  return (
    <>
      <PageHeader eyebrow="Sobre" title="Decisões de vida merecem informação honesta" />
      <div className="container-page prose-livora max-w-3xl py-10">
        <p>O Partiu Morar ajuda pessoas a descobrir onde podem viver melhor: comparando custo de vida, salários, câmbio, qualidade de vida e caminhos de imigração em cidades do mundo todo.</p>
        <h2>Nossos princípios</h2>
        <ul>
          <li>Mostrar a origem, a data e as limitações de cada dado.</li>
          <li>Nunca apresentar estimativas ou dados demonstrativos como fatos.</li>
          <li>Não declarar “a melhor cidade do mundo”: o melhor lugar depende das suas prioridades.</li>
          <li>Permitir usar as ferramentas principais sem cadastro.</li>
          <li>Coletar apenas os dados pessoais necessários.</li>
        </ul>
        <h2>Como pretendemos nos sustentar</h2>
        <p>No futuro, o Partiu Morar poderá oferecer recursos premium de planejamento, relatórios detalhados e parcerias com serviços de mudança, moradia e viagem. Qualquer link afiliado ou conteúdo patrocinado será identificado de forma clara, e a monetização não influenciará rankings, comparações ou recomendações. Nesta versão não há pagamentos, anúncios nem links afiliados.</p>
        <h2>Aviso</h2>
        <p>As informações têm finalidade de planejamento e não substituem orientação jurídica, migratória, tributária ou financeira profissional. Leia a <Link href="/metodologia" className="text-teal-700 underline">metodologia</Link>.</p>
      </div>
    </>
  );
}
