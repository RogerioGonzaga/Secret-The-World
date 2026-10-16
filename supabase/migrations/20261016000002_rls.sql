-- Row Level Security: catálogo é leitura pública; dados de usuário são visíveis apenas ao dono.

-- Catálogo público (somente leitura para anon/authenticated; escrita só via service role).
do $$
declare t text;
begin
  foreach t in array array[
    'data_sources','currencies','countries','cities','city_population','cost_categories','city_costs',
    'professions','city_salaries','tax_models','indicators','city_indicators','immigration_info',
    'external_links','exchange_rates','articles'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "leitura publica" on %I for select using (true)', t);
  end loop;
end $$;

-- Cidades não publicadas não aparecem para o público.
drop policy "leitura publica" on cities;
create policy "leitura publica de cidades publicadas" on cities for select using (published);

alter table data_updates enable row level security; -- sem políticas: apenas service role

-- Dados privados
alter table user_preferences enable row level security;
alter table favorites enable row level security;
alter table lists enable row level security;
alter table list_items enable row level security;
alter table checklist_items enable row level security;

create policy "dono gerencia preferencias" on user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono gerencia favoritos" on favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono gerencia listas" on lists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono gerencia checklist" on checklist_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono gerencia itens da lista" on list_items for all
  using (exists (select 1 from lists l where l.id = list_id and l.user_id = auth.uid()))
  with check (exists (select 1 from lists l where l.id = list_id and l.user_id = auth.uid()));

-- Listas compartilhadas são lidas por token através de uma função que expõe só os destinos.
create or replace function shared_list(token text)
returns table (name text, city_slug text, "position" int)
language sql stable security definer set search_path = public as $$
  select l.name, i.city_slug, i.position
  from lists l join list_items i on i.list_id = l.id
  where l.share_token = token and token is not null and length(token) >= 16
  order by i.position;
$$;
revoke all on function shared_list(text) from public;
grant execute on function shared_list(text) to anon, authenticated;
