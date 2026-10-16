# Integrações e fontes de dados

| Categoria | Situação | Fonte | Observações |
|---|---|---|---|
| Câmbio atual | **Conectado** | [Frankfurter](https://frankfurter.dev) (BCE) | Sem chave. Cache de 1 h. ~30 moedas. AED derivado da paridade oficial com USD (3,6725). |
| Câmbio histórico | **Conectado** | Frankfurter `/{inicio}..{fim}` | Cache de 6 h, via `/api/exchange/history`. |
| Mapa | **Conectado** | OpenStreetMap (tiles) | Política de uso do servidor público limita volume; usar provedor contratado em produção. |
| Fotos | **Conectado** | Unsplash (URLs diretas) | Licença Unsplash. Fallback visual se a imagem falhar. Recomendado: revisar cada foto e guardar crédito do autor. |
| Moeda / fuso | **Referência** | ISO 4217 / IANA tz | Estáveis; fuso calculado pelo navegador/servidor. |
| População | Estimativa editorial | Institutos oficiais citados por cidade | Conferir valor e ano em cada fonte antes do lançamento. |
| Custo de vida | **Demonstrativo** | — | Ver opções abaixo. |
| Salários | **Demonstrativo** | — | Ver opções abaixo. |
| Impostos | **Demonstrativo** | — | Motor já suporta faixas progressivas (`TaxModel.progressive`). |
| Qualidade de vida | **Demonstrativo** | — | Ver opções abaixo. |
| Clima mensal | **Demonstrativo** | — | Ver opções abaixo. |
| Imigração | Editorial, não verificada | Links oficiais por país | Preencher `lastVerified` após conferência. |

## Como conectar uma fonte real

1. Registre a fonte em `src/lib/data/seed/sources.ts` (ou na tabela `data_sources`) com metodologia,
   limitações, licença e frequência de atualização.
2. Crie um adaptador em `src/lib/integrations/<fonte>/` que **valide a resposta com zod**, use
   `AbortSignal.timeout` e `next: { revalidate }`, e nunca rode no navegador se exigir chave.
3. Converta para os tipos de domínio com `Provenance` preenchida (`verified: true` só após conferência).
4. Grave em `data_updates` o resultado de cada execução (sucesso/falha) quando houver ingestão agendada.
5. Escreva teste unitário com `fetch` simulado (veja `tests/unit/exchange.test.ts`).

## Fontes candidatas (verificar termos antes de usar)

Nenhuma destas foi integrada; os termos, limites e custos precisam ser confirmados na documentação oficial.

- **Banco Mundial – Indicators API**: indicadores nacionais (expectativa de vida, acesso à internet, PIB per capita).
- **OMS – Global Health Observatory**: poluição do ar (PM2.5) e saúde.
- **Open-Meteo** (Historical/Climate API): normais climatológicas por coordenada. Verificar licença para uso comercial.
- **Institutos nacionais de estatística** (INE, IBGE, Destatis, ONS, StatCan…): população, salários e preços.
- **Eurostat**: salários e preços harmonizados na UE.
- **OpenStreetMap / Overpass**: áreas verdes e equipamentos culturais (licença ODbL exige atribuição).
- **Custo de vida e salários comerciais** (ex.: provedores pagos de dados de preços): usar apenas com contrato e licença
  que permita exibição pública.

## Variáveis de ambiente

Ver `.env.example`. Nenhuma credencial é necessária para a versão atual.
