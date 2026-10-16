-- Partiu Morar — esquema inicial (PostgreSQL / Supabase)
-- Catálogo público (países, cidades, custos, salários, indicadores) + dados privados de usuários.
-- Toda medida quantitativa referencia uma linha de `data_sources` e guarda datas de coleta/referência.

-- gen_random_uuid() é nativo a partir do PostgreSQL 13.

-- ---------------------------------------------------------------------------
-- Fontes e proveniência
-- ---------------------------------------------------------------------------
create type data_kind as enum ('official', 'third_party', 'estimate', 'user', 'demo');

create table data_sources (
  id                text primary key,                 -- ex.: 'frankfurter-ecb', 'livora-demo'
  name              text not null,
  publisher         text,
  url               text,
  kind              data_kind not null,
  methodology       text not null,
  limitations       text not null,
  license           text,
  update_frequency  text,
  created_at        timestamptz not null default now()
);

-- Campos de proveniência reutilizados por todas as tabelas de medidas.
-- (source_id, collected_at, reference_period, currency, unit, notes, next_update, verified)

-- ---------------------------------------------------------------------------
-- Catálogo geográfico
-- ---------------------------------------------------------------------------
create table currencies (
  code      char(3) primary key,                       -- ISO 4217
  name      text not null,
  symbol    text not null,
  decimals  smallint not null default 2
);

create table countries (
  slug                text primary key,
  name                text not null,
  iso2                char(2) not null unique,
  continent           text not null check (continent in ('europa','america-do-norte','america-do-sul','asia','oceania','africa')),
  currency_code       char(3) not null references currencies(code),
  languages           text[] not null default '{}',
  remote_work         text,
  practical           jsonb not null default '{}'::jsonb,   -- idioma, saúde, educação, conectividade
  updated_at          timestamptz not null default now()
);

create table cities (
  slug            text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name            text not null,
  country_slug    text not null references countries(slug) on delete restrict,
  lat             double precision not null check (lat between -90 and 90),
  lng             double precision not null check (lng between -180 and 180),
  timezone        text not null,                            -- IANA
  size            text not null check (size in ('grande','media','pequena')),
  settings        text[] not null default '{}',
  climate_type    text not null check (climate_type in ('quente','ameno','frio')),
  climate_summary text not null,
  summary         text not null,
  pros            text[] not null default '{}',
  cons            text[] not null default '{}',
  tags            text[] not null default '{}',
  image           jsonb not null,                           -- url, alt, credit, creditUrl
  work            jsonb not null default '{}'::jsonb,       -- demandAreas, remoteFriendly, modes
  housing         jsonb not null default '{}'::jsonb,       -- types, centerVsOutside
  published       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index cities_country_idx on cities(country_slug);

create table city_population (
  city_slug         text not null references cities(slug) on delete cascade,
  value             bigint check (value >= 0),
  source_id         text not null references data_sources(id),
  collected_at      date,
  reference_period  text,
  notes             text,
  verified          boolean not null default false,
  primary key (city_slug, source_id, reference_period)
);

-- ---------------------------------------------------------------------------
-- Custo de vida (valores mensais, moeda local, 1 pessoa / perfil intermediário)
-- ---------------------------------------------------------------------------
create table cost_categories (
  id     text primary key,         -- rent1Center, groceries, ...
  label  text not null,
  detail text not null
);

create table city_costs (
  id                uuid primary key default gen_random_uuid(),
  city_slug         text not null references cities(slug) on delete cascade,
  category_id       text not null references cost_categories(id),
  amount            numeric(14,2) not null check (amount >= 0),
  currency_code     char(3) not null references currencies(code),
  source_id         text not null references data_sources(id),
  collected_at      date,
  reference_period  text not null,
  verified          boolean not null default false,
  notes             text,
  unique (city_slug, category_id, source_id, reference_period)
);

-- ---------------------------------------------------------------------------
-- Salários (sempre brutos mensais) e modelos tributários
-- ---------------------------------------------------------------------------
create table professions (
  id    text primary key,
  label text not null
);

create table city_salaries (
  id                uuid primary key default gen_random_uuid(),
  city_slug         text not null references cities(slug) on delete cascade,
  profession_id     text references professions(id),     -- null = mediana geral
  gross_monthly     numeric(14,2) not null check (gross_monthly >= 0),
  currency_code     char(3) not null references currencies(code),
  source_id         text not null references data_sources(id),
  collected_at      date,
  reference_period  text not null,
  verified          boolean not null default false
);
create unique index city_salaries_uniq on city_salaries(city_slug, coalesce(profession_id, '_median'), source_id, reference_period);

create table tax_models (
  country_slug      text primary key references countries(slug) on delete cascade,
  model             jsonb not null,                         -- {kind:'flat_estimate'|'progressive', ...}
  description       text not null,
  source_id         text not null references data_sources(id),
  reference_period  text,
  verified          boolean not null default false
);

-- ---------------------------------------------------------------------------
-- Indicadores de qualidade de vida (0–100, maior é melhor)
-- ---------------------------------------------------------------------------
create table indicators (
  id           text primary key,      -- safety, health, ...
  label        text not null,
  methodology  text not null,
  limitations  text not null
);

create table city_indicators (
  city_slug         text not null references cities(slug) on delete cascade,
  indicator_id      text not null references indicators(id),
  score             numeric(5,2) check (score between 0 and 100),   -- null = indisponível
  source_id         text not null references data_sources(id),
  collected_at      date,
  reference_period  text,
  verified          boolean not null default false,
  primary key (city_slug, indicator_id, source_id)
);

-- ---------------------------------------------------------------------------
-- Imigração e links externos
-- ---------------------------------------------------------------------------
create table immigration_info (
  country_slug       text primary key references countries(slug) on delete cascade,
  summary            text not null,
  pathways           jsonb not null default '[]'::jsonb,
  nationality_notes  jsonb not null default '{}'::jsonb,
  last_verified      date
);

create table external_links (
  id            uuid primary key default gen_random_uuid(),
  country_slug  text not null references countries(slug) on delete cascade,
  kind          text not null check (kind in ('immigration','jobs','housing')),
  label         text not null,
  url           text not null check (url ~ '^https://'),
  link_type     text not null check (link_type in ('official','portal')),
  affiliate     boolean not null default false,       -- monetização futura: sempre sinalizado na interface
  sponsored     boolean not null default false
);

-- ---------------------------------------------------------------------------
-- Câmbio (cache das taxas de referência) e histórico de atualizações
-- ---------------------------------------------------------------------------
create table exchange_rates (
  base            char(3) not null,
  quote           char(3) not null,
  rate            numeric(20,10) not null check (rate > 0),
  reference_date  date not null,
  source_id       text not null references data_sources(id),
  fetched_at      timestamptz not null default now(),
  primary key (base, quote, reference_date, source_id)
);

create table data_updates (
  id           bigint generated always as identity primary key,
  entity       text not null,            -- 'city_costs', 'exchange_rates', ...
  entity_key   text,
  source_id    text references data_sources(id),
  status       text not null check (status in ('success','partial','failed')),
  details      jsonb,
  ran_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Conteúdo editorial
-- ---------------------------------------------------------------------------
create table articles (
  slug                  text primary key,
  title                 text not null,
  excerpt               text not null,
  category              text not null,
  body                  jsonb not null,
  author                text not null,
  reading_minutes       smallint not null,
  related_destinations  text[] not null default '{}',
  sponsored             boolean not null default false,
  published_at          date,
  updated_at            date
);

-- ---------------------------------------------------------------------------
-- Dados de usuários (privados)
-- ---------------------------------------------------------------------------
create table user_preferences (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  answers     jsonb not null,             -- respostas do questionário (nacionalidade é opcional)
  consent_at  timestamptz,
  updated_at  timestamptz not null default now()
);

create table favorites (
  user_id    uuid not null references auth.users(id) on delete cascade,
  city_slug  text not null references cities(slug) on delete cascade,
  status     text not null default 'considerar' check (status in ('considerar','visitar','decidido')),
  note       text not null default '' check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  primary key (user_id, city_slug)
);

create table lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) <= 120),
  -- Compartilhamento por token: apenas cidades, nunca anotações.
  share_token text unique,
  created_at  timestamptz not null default now()
);

create table list_items (
  list_id    uuid not null references lists(id) on delete cascade,
  city_slug  text not null references cities(slug) on delete cascade,
  position   int not null default 0,
  primary key (list_id, city_slug)
);

create table checklist_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null check (char_length(label) <= 200),
  done        boolean not null default false,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);
