# Partiu Morar

**Seu próximo destino começa aqui.**

Plataforma para descobrir onde vale a pena morar: explore cidades do mundo, compare custo de vida, salários,
moedas, oportunidades de trabalho e qualidade de vida, simule quanto sobra do seu salário e encontre destinos
que combinam com você.

Domínio oficial: <https://partiumorar.com.br> (configuração de DNS e hospedagem descrita em
[Implantação e domínio](#implantação-e-domínio); o domínio ainda não foi conectado por este repositório).

> **Versão de desenvolvimento.** Custos, salários, alíquotas, indicadores de qualidade de vida e
> temperaturas mensais são **dados demonstrativos**, sinalizados em toda a interface. O câmbio vem de
> fonte real (BCE via Frankfurter). Veja [Dados e integrações](#dados-e-integrações).

## Funcionalidades

- **Homepage** com busca com sugestões, destinos em alta, simulador de orçamento, oportunidades, remoto,
  comparações populares, continentes, guias e rodapé com fontes.
- **Explorador** (`/destinos`): busca, filtros reais (continente, orçamento, moeda, idioma, clima, segurança,
  custo de vida, salário × custo), ordenação com critério explicado, grade ou mapa interativo,
  carregamento progressivo e URL compartilhável.
- **Página de destino** (`/destinos/[slug]`): visão geral, custo de vida por perfil (econômico, intermediário,
  confortável; individual ou família), salários brutos e líquidos estimados, calculadora de poder de compra,
  moeda e histórico de câmbio, indicadores com fonte e metodologia, Índice Partiu Morar com componentes, moradia,
  imigração com links oficiais, vida prática, clima mensal e ferramentas (favoritar, comparar, compartilhar,
  imprimir, destinos semelhantes).
- **Calculadora** (`/custo-de-vida`): renda bruta ou líquida em qualquer moeda, conversão, impostos estimados,
  despesas, sobra, comprometimento da renda, economia anual e cenários. Nunca trata bruto como líquido.
- **Comparador** (`/comparar?cidades=a,b,c`): 2 a 3 cidades, mesma metodologia, gráfico, tabela, pontos
  fortes e de atenção sem vencedor universal, compartilhável.
- **Salários** (`/trabalho`): por profissão, bruto, líquido e cobertura do custo de vida.
- **Questionário** (`/destino-ideal`): 8 etapas, sem cadastro, recomendações com motivos, pontos de atenção,
  informações desconhecidas e tabela de pesos.
- **Favoritos** (`/favoritos`): salvar destinos, status, anotações, comparar selecionados, checklist de
  mudança e lista compartilhável (só destinos, nunca anotações). Tudo em `localStorage`.
- **Guias** (`/guias`), **Metodologia** (`/metodologia`), **Sobre** e **Privacidade**.
- SEO: metadados por página, Open Graph, `sitemap.xml`, `robots.txt`, JSON-LD (City, Article).

## Stack

Next.js 16 (App Router, TypeScript), React 19, Tailwind CSS 4, Radix UI (diálogo, popover), Lucide,
Recharts, Leaflet/OpenStreetMap, Zod, Vitest, Playwright. Esquema PostgreSQL/Supabase com RLS em `supabase/`.

## Como executar

Requisitos: Node.js 20.9+ e npm.

```bash
npm install
cp .env.example .env.local   # opcional; os padrões funcionam
npm run dev                  # http://localhost:3000
```

Produção local:

```bash
npm run build
npm start
```

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificação de tipos |
| `npm test` | Testes unitários (cálculos, filtros, comparação, questionário, câmbio, dados) |
| `npm run test:e2e` | Testes de ponta a ponta (Playwright; rode `npm run build` antes) |
| `npm run data:validate` | Valida o conjunto de dados de seed |
| `npm run db:seed-sql` | Gera `supabase/seed.sql` a partir dos seeds |

Para os testes E2E é preciso um Chromium do Playwright (`npx playwright install chromium`) ou
`PLAYWRIGHT_CHROMIUM_PATH=/caminho/do/chromium`.

## Dados e integrações

| Dado | Situação |
|---|---|
| Câmbio atual e histórico | Real: BCE via Frankfurter, cache de 1 h / 6 h. Sem conexão, mostra a última cotação com data; em modo demo, taxas demonstrativas sinalizadas. |
| Moeda, fuso horário | Referências estáveis (ISO 4217, IANA). |
| Mapa | OpenStreetMap. |
| Fotos | Unsplash, com fallback visual. |
| População, imigração | Estimativa/síntese editorial pendente de verificação, com links oficiais. |
| Custos, salários, impostos, indicadores, clima mensal | **Demonstrativos.** |

`NEXT_PUBLIC_LIVORA_DATA_MODE=production` oculta todo valor demonstrativo: cidades sem custos verificados
saem do catálogo e indicadores viram “Dados indisponíveis”. Com os dados atuais, o catálogo fica vazio
nesse modo — é proposital, para impedir que números fictícios sejam publicados.

Detalhes, fontes candidatas e passo a passo para conectar fontes reais: [`docs/integracoes.md`](docs/integracoes.md).
Arquitetura, como adicionar cidades e migrar para o banco: [`docs/arquitetura.md`](docs/arquitetura.md).

## Banco de dados

`supabase/migrations/` contém o esquema (países, cidades, moedas, custos por categoria, salários por
profissão, modelos tributários, indicadores, fontes, histórico de atualizações, câmbio, artigos, favoritos,
listas, checklist e preferências) e políticas de Row Level Security. `supabase/seed.sql` é gerado dos seeds.
As migrações e o seed foram aplicados com sucesso em PostgreSQL (PGlite) durante o desenvolvimento.
A aplicação ainda lê os seeds em TypeScript; a troca para o banco está descrita em `docs/arquitetura.md`.

## Implantação e domínio

Funciona em qualquer host com Node.js (Vercel, Render, Fly.io, Docker).

**O que o código já faz para o domínio `https://partiumorar.com.br`:**

- `siteConfig.url` (`src/lib/config.ts`) usa o domínio oficial por padrão; URLs canônicas, `sitemap.xml`,
  `robots.txt`, Open Graph e `manifest.webmanifest` são gerados a partir dele.
- `NEXT_PUBLIC_SITE_URL` só deve sobrescrevê-lo em prévias ou testes (ex.: `http://localhost:3000`).
- `www.partiumorar.com.br` redireciona permanentemente para o domínio sem `www` (`next.config.ts`).

**Etapas externas (feitas por você no provedor de hospedagem e no registrador):**

1. **Hospedagem:** crie o projeto a partir deste repositório, defina as variáveis de ambiente
   (`NEXT_PUBLIC_SITE_URL=https://partiumorar.com.br`, `NEXT_PUBLIC_LIVORA_DATA_MODE` e as demais do
   `.env.example`) e adicione os domínios `partiumorar.com.br` e `www.partiumorar.com.br` ao projeto.
2. **Registrador (Registro.br):** no painel do domínio, use os servidores DNS do provedor ou crie os registros
   que ele indicar (normalmente um registro `A`/`ALIAS` para o domínio raiz e um `CNAME` para `www`). Use
   exatamente os valores mostrados pelo provedor.
3. **HTTPS:** aguarde a propagação do DNS; a maioria dos provedores emite o certificado automaticamente.
4. **Buscadores:** verifique o domínio no Google Search Console (registro `TXT` no DNS) e envie
   `https://partiumorar.com.br/sitemap.xml`.
5. **Dados:** mantenha `NEXT_PUBLIC_LIVORA_DATA_MODE=demo` em prévias; use `production` apenas quando os
   dados verificados estiverem carregados (no modo `production` cidades sem dados verificados saem do catálogo).
6. Em produção, troque o servidor de tiles do OpenStreetMap por um provedor com contrato.
7. `npm run build && npm start` (ou o fluxo padrão do provedor).

O nome técnico da variável `NEXT_PUBLIC_LIVORA_DATA_MODE`, os identificadores de fonte `livora-demo` e
`livora-editorial` e as chaves de `localStorage` (`livora:*`) foram mantidos de propósito para preservar a
compatibilidade com dados e configurações existentes.

## O que falta para produção

- Substituir dados demonstrativos por fontes licenciadas e verificadas (custos, salários, impostos,
  indicadores, clima) e conferir população e informações de imigração (`lastVerified`).
- Ligar o repositório ao Supabase e criar a ingestão agendada com registro em `data_updates`.
- Contas de usuário (Supabase Auth) com sincronização de favoritos e consentimento.
- Revisão jurídica de privacidade/LGPD e dos textos de imigração; revisão editorial dos guias.
- Revisar cada foto (crédito do autor) e contratar provedor de mapas.
- Traduções para inglês e espanhol; monitoramento de erros e analytics com consentimento.
