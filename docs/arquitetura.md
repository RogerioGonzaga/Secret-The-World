# Arquitetura da LIVORA

## Visão geral

```
src/
  app/                    Rotas (Next.js App Router). Páginas são componentes de servidor finos.
    api/exchange/         Endpoints de câmbio (snapshot e histórico), com cache.
  components/             Interface, agrupada por área (home, destinations, destination, compare, quiz…).
    ui/                   Primitivos visuais (Button, Card, SourceNote, ScoreBar, CityImage).
  lib/
    domain/               Tipos e catálogos (rótulos, metodologias dos indicadores).
    data/                 Repositório (única porta de acesso a dados), validação e seeds.
    calc/                 Regras de negócio puras: custo de vida, impostos, poder de compra,
                          Índice LIVORA, compatibilidade do questionário.
    explore/              Filtros, ordenação, paginação e estado na URL do explorador.
    compare/              Motor do comparador.
    integrations/         Adaptadores externos (exchange/frankfurter.ts) e serviços com fallback.
    favorites/            Persistência local (localStorage) de favoritos, anotações e checklist.
    i18n/                 Dicionários de interface (pt-BR; pronto para en/es).
supabase/                 Migrações SQL (esquema + RLS) e seed gerado.
scripts/                  Validação de dados e geração do seed SQL.
tests/unit|e2e            Vitest (regras) e Playwright (fluxos).
```

Princípios:

- **Regras de negócio são funções puras** em `lib/calc`, `lib/explore` e `lib/compare`, testadas sem interface.
- **Componentes não leem fontes de dados diretamente**: usam `lib/data/repository.ts`. Trocar os seeds
  por PostgreSQL significa reimplementar o repositório, não as páginas.
- **Proveniência obrigatória**: todo número tem `Provenance` (fonte, coleta, referência, unidade, verificado).
  `SourceNote` exibe isso na tela.
- **Modo de dados**: `NEXT_PUBLIC_LIVORA_DATA_MODE=production` faz o repositório remover tudo que for
  demonstrativo antes de chegar à interface.

## Adicionar uma cidade

1. Inclua o país em `src/lib/data/seed/countries.ts` (se ainda não existir) e a moeda em `currencies.ts`.
2. Inclua a cidade em `src/lib/data/seed/cities.ts`. A rota `/destinos/<slug>` é gerada automaticamente,
   e a cidade passa a aparecer no explorador, comparador, questionário, sitemap e mapa.
3. Rode `npm run data:validate` e `npm test`.
4. Rode `npm run db:seed-sql` para atualizar `supabase/seed.sql`.

Com o banco conectado, basta inserir linhas em `cities`, `city_costs`, `city_salaries` e `city_indicators`
com `published = true`.

## Migrar para o banco (Supabase)

1. Crie o projeto e aplique `supabase/migrations/*.sql` (`supabase db push` ou SQL Editor).
2. Carregue `supabase/seed.sql` (ou dados reais com as mesmas tabelas).
3. Implemente `lib/data/repository.ts` com consultas ao Supabase **no servidor** (chave anônima com RLS
   para leitura pública; a service role só em scripts de ingestão).
4. Mantenha a função `sanitizeForProduction` — ela é a garantia de que nada demonstrativo vaze.

## Contas de usuário (próxima etapa)

O esquema já tem `favorites`, `lists`, `list_items`, `checklist_items` e `user_preferences` com RLS
restrita ao dono (`auth.uid() = user_id`). Listas compartilhadas são lidas pela função
`shared_list(token)`, que expõe apenas os destinos, nunca as anotações. A interface hoje usa
`lib/favorites/store.ts` (localStorage); a versão autenticada deve sincronizar o mesmo formato.

## Internacionalização

Textos de navegação e interface comum estão em `lib/i18n/pt-BR.ts`. Para inglês/espanhol: criar
`en.ts`/`es.ts` com o mesmo tipo `Dictionary`, mover as rotas para `app/[locale]/…` e traduzir o conteúdo
editorial dos seeds (campos de texto de cidades, países e artigos).

## Monetização futura

- `ExternalLink.affiliate` e `articles.sponsored` já existem e são sinalizados na interface.
- Recursos premium (relatórios, comparações avançadas) devem ser rotas separadas, sem alterar rankings.
- Nenhum pagamento está implementado.
