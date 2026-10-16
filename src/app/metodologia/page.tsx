import type { Metadata } from "next";
import Link from "next/link";
import { sources } from "@/lib/data/seed/sources";
import { dataKindLabels } from "@/lib/format";
import { INDEX_WEIGHTS, AFFORDABILITY_RANGE, MIN_COVERAGE } from "@/lib/calc/livora-index";
import { indicatorMeta } from "@/lib/domain/catalog";
import { COST_LEVEL_EUR } from "@/lib/explore/filters";
import { PageHeader, Badge } from "@/components/ui/primitives";
import { formatPercent } from "@/lib/format";

export const metadata: Metadata = {
  title: "Metodologia e fontes de dados",
  description: "Como a LIVORA calcula custo de vida, salário líquido, compatibilidade e o Índice LIVORA, e de onde vêm os dados.",
  alternates: { canonical: "/metodologia" },
};

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="font-display mt-14 scroll-mt-24 text-3xl font-medium">{children}</h2>;
}

export default function MetodologiaPage() {
  return (
    <>
      <PageHeader eyebrow="Transparência" title="Metodologia e fontes" description="Cada número na LIVORA deve poder ser explicado. Aqui estão as fontes, as fórmulas e as limitações." />
      <div className="container-page max-w-4xl py-6 text-[15px] leading-relaxed text-navy-800">
        <H2 id="tipos">Tipos de dado</H2>
        <p className="mt-3 text-muted">A interface sempre distingue a natureza de cada informação:</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {(Object.keys(dataKindLabels) as (keyof typeof dataKindLabels)[]).map((k) => (
            <li key={k} className="rounded-xl border border-sand-200 bg-white p-4">
              <Badge tone={k === "demo" ? "demo" : k === "official" ? "teal" : "neutral"}>{dataKindLabels[k]}</Badge>
              <p className="mt-2 text-sm text-muted">
                {{ official: "Publicado por órgão governamental ou padrão internacional.", third_party: "Publicado por organização independente, com licença e termos verificados.", estimate: "Aproximação feita pela equipe a partir de fontes indicadas, pendente de verificação.", user: "Valores que você digitou nas ferramentas.", demo: "Valores ilustrativos usados no desenvolvimento. Não representam a realidade." }[k]}
              </p>
            </li>
          ))}
        </ul>

        <H2 id="dados-demonstrativos">Dados demonstrativos nesta versão</H2>
        <div className="mt-3 rounded-2xl border border-demo-200 bg-demo-50 p-5 text-demo-700">
          <p><strong>Ainda são demonstrativos:</strong> custos de vida por categoria, salários (medianos e por profissão), alíquotas efetivas de impostos, indicadores de qualidade de vida e temperaturas mensais.</p>
          <p className="mt-2"><strong>Estimativas editoriais pendentes de verificação:</strong> população (com o instituto de referência indicado) e informações gerais de imigração.</p>
          <p className="mt-2"><strong>Conectados a fontes reais:</strong> câmbio (BCE via Frankfurter), códigos de moeda (ISO 4217) e fusos horários (IANA).</p>
          <p className="mt-2">Quando a variável <code>NEXT_PUBLIC_LIVORA_DATA_MODE=production</code> está ativa, nenhum valor demonstrativo é exibido: cidades sem dados verificados saem do catálogo e indicadores aparecem como “Dados indisponíveis”.</p>
        </div>

        <H2 id="custo">Custo de vida</H2>
        <p className="mt-3">Cada cidade tem valores mensais de referência na moeda local para 1 pessoa: aluguel (1 e 3 quartos, centro e fora), supermercado, restaurantes, transporte público, energia e água, internet, saúde, lazer e diversos.</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
          <li><strong className="text-navy-800">Econômico:</strong> aluguel fora do centro; supermercado ×0,85; restaurantes ×0,4; lazer ×0,4; saúde ×0,7; diversos ×0,7.</li>
          <li><strong className="text-navy-800">Intermediário:</strong> aluguel = média entre centro e fora; demais itens ×1.</li>
          <li><strong className="text-navy-800">Confortável:</strong> aluguel no centro; supermercado ×1,25; restaurantes ×1,8; lazer ×1,6; saúde ×1,3; diversos ×1,5.</li>
          <li><strong className="text-navy-800">Família (2 adultos + 1 criança):</strong> aluguel de 3 quartos; supermercado ×2,4; restaurantes ×2,2; transporte ×2; energia ×1,5; saúde ×2,6; lazer e diversos ×2,2. Não inclui escola nem creche.</li>
        </ul>
        <p className="mt-3 text-muted">Despesas individuais e familiares nunca são somadas entre si. Faixas de custo do explorador (em EUR, 1 pessoa, intermediário): {Object.values(COST_LEVEL_EUR).map((r) => `${r.label} ${r.max === Infinity ? `≥ ${r.min}` : `< ${r.max}`}`).join(" · ")}.</p>

        <H2 id="salario">Salário bruto e líquido</H2>
        <p className="mt-3">Salários são sempre brutos mensais. O líquido é estimado aplicando o modelo tributário do país (hoje, uma alíquota efetiva demonstrativa para pessoa solteira, residente e contratada localmente). O motor também suporta faixas progressivas com contribuições sociais e número de salários por ano.</p>
        <p className="mt-3 text-muted">Se não há modelo tributário para o país, a LIVORA não estima o líquido e nunca trata o valor bruto como líquido.</p>

        <H2 id="cambio">Câmbio</H2>
        <p className="mt-3">Taxas de referência do Banco Central Europeu via API Frankfurter, atualizadas em dias úteis e armazenadas em cache por 1 hora. Conversões entre moedas não-euro são cruzadas via EUR. O dirham dos Emirados (AED) é derivado do dólar pela paridade fixa oficial de 3,6725. Moedas fora da cobertura do BCE (como ARS e COP) aparecem como “cotação indisponível” em produção.</p>
        <p className="mt-3 text-muted">Se a API falhar, mostramos a última cotação obtida com sua data. Taxas de referência não incluem spread bancário nem tarifas.</p>

        <H2 id="indice">Índice LIVORA</H2>
        <p className="mt-3">Média ponderada (0–100) dos indicadores disponíveis. Componentes sem dado são excluídos e os pesos restantes são renormalizados; com menos de {formatPercent(MIN_COVERAGE)} do peso disponível, o índice não é calculado.</p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-sand-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-sand-50 text-left text-xs text-subtle"><tr><th scope="col" className="px-4 py-2 font-medium">Componente</th><th scope="col" className="px-4 py-2 text-right font-medium">Peso</th><th scope="col" className="px-4 py-2 font-medium">Metodologia prevista</th></tr></thead>
            <tbody>
              {(Object.keys(INDEX_WEIGHTS) as (keyof typeof INDEX_WEIGHTS)[]).map((id) => (
                <tr key={id} className="border-t border-sand-100 align-top">
                  <th scope="row" className="px-4 py-2 text-left font-medium">{id === "affordability" ? "Equilíbrio renda × custo" : indicatorMeta[id].label}</th>
                  <td className="px-4 py-2 text-right tabular-nums">{formatPercent(INDEX_WEIGHTS[id])}</td>
                  <td className="px-4 py-2 text-muted">{id === "affordability" ? `Salário líquido mediano ÷ custo intermediário, mapeado linearmente de ${AFFORDABILITY_RANGE.min} (0 pontos) a ${AFFORDABILITY_RANGE.max} (100 pontos).` : indicatorMeta[id].methodology}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2 id="compatibilidade">Compatibilidade do questionário</H2>
        <p className="mt-3">Soma ponderada de critérios: orçamento (30), idioma (12), clima (10), trabalho remoto (10), estilo de vida (8), educação para famílias (8), porte da cidade (6), segurança (4 × importância) e carreira (6 × importância). Cada destino mostra o peso e o quanto atendeu cada critério. Critérios sem dados não entram no total.</p>

        <H2 id="fontes">Registro de fontes</H2>
        <ul className="mt-4 space-y-3">
          {sources.map((s) => (
            <li key={s.id} className="rounded-xl border border-sand-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{s.name}</p><Badge tone={s.kind === "demo" ? "demo" : "neutral"}>{dataKindLabels[s.kind]}</Badge></div>
              <p className="mt-1 text-sm text-muted">{s.methodology}</p>
              <p className="mt-1 text-sm text-muted"><strong className="text-navy-800">Limitações:</strong> {s.limitations}</p>
              {s.updateFrequency && <p className="mt-1 text-xs text-subtle">Atualização: {s.updateFrequency}{s.license ? ` · ${s.license}` : ""}</p>}
              {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-teal-700 hover:underline">{s.url}</a>}
            </li>
          ))}
        </ul>

        <H2 id="proximas-fontes">Fontes em avaliação</H2>
        <p className="mt-3 text-muted">Antes de qualquer integração, a equipe verifica licença, cobertura, limites e custo. Candidatas: Banco Mundial (indicadores de desenvolvimento, API aberta), OMS (qualidade do ar), Open-Meteo (climatologia), institutos nacionais de estatística e OpenStreetMap (áreas verdes). Fontes comerciais de custo de vida e salários só serão usadas com licença compatível. Veja <code>docs/integracoes.md</code> no repositório.</p>
        <p className="mt-8 text-sm"><Link href="/" className="text-teal-700 hover:underline">← Voltar para a página inicial</Link></p>
      </div>
    </>
  );
}
