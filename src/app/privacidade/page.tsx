import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Privacidade", description: "Como a LIVORA trata dados pessoais, em linha com a LGPD.", alternates: { canonical: "/privacidade" } };

export default function PrivacidadePage() {
  return (
    <>
      <PageHeader eyebrow="Privacidade" title="Política de privacidade" description="Versão preliminar para a fase de desenvolvimento. Deve passar por revisão jurídica antes do lançamento." />
      <div className="container-page prose-livora max-w-3xl py-10">
        <h2>Resumo</h2>
        <ul>
          <li>Não exigimos cadastro para usar o explorador, a calculadora, o comparador ou o questionário.</li>
          <li>Favoritos, anotações, checklist e respostas do questionário ficam no armazenamento local do seu navegador e não são enviados aos nossos servidores.</li>
          <li>Não usamos cookies de publicidade nem vendemos dados.</li>
        </ul>
        <h2>Dados que você informa</h2>
        <p>Renda, orçamento, profissão e nacionalidade são opcionais e usados apenas para calcular resultados no seu próprio navegador. A nacionalidade serve somente para destacar observações migratórias conhecidas e não altera a pontuação.</p>
        <h2>Dados técnicos</h2>
        <p>Como qualquer site, o provedor de hospedagem pode registrar dados técnicos de acesso (como endereço IP e navegador) para segurança e funcionamento. Os mapas são carregados do OpenStreetMap e as imagens do Unsplash, que recebem requisições do seu navegador conforme suas próprias políticas.</p>
        <h2>Contas de usuário (futuro)</h2>
        <p>Quando houver contas, os dados serão armazenados com controle de acesso por usuário (Row Level Security), você poderá exportá-los e excluí-los, e pediremos consentimento explícito quando necessário, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
        <h2>Seus direitos</h2>
        <p>Você pode apagar todos os dados locais a qualquer momento na página de Favoritos ou limpando os dados do site no navegador.</p>
      </div>
    </>
  );
}
