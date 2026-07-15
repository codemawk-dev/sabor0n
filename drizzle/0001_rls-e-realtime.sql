-- ============================================================
-- SaborOn — RLS, FK do owner e Realtime
-- Migration customizada: aplicada em todos os ambientes
-- via `npm run db:migrate` (após a 0000 criar as tabelas).
-- ============================================================

-- FK do dono do restaurante para o schema auth (o Drizzle não a cria)
alter table restaurantes
  add constraint restaurantes_owner_fk
  foreign key (owner_id) references auth.users (id) on delete set null;

-- ------------------------------------------------------------
-- Habilitar RLS em todas as tabelas
-- ------------------------------------------------------------
alter table restaurantes enable row level security;
alter table categorias   enable row level security;
alter table produtos     enable row level security;
alter table pedidos      enable row level security;
alter table itens_pedido enable row level security;

-- ------------------------------------------------------------
-- Leitura pública (loja do cliente)
-- ------------------------------------------------------------
create policy "public_read_restaurantes" on restaurantes
  for select to anon, authenticated
  using (ativo = true);

create policy "public_read_categorias" on categorias
  for select to anon, authenticated
  using (
    exists (
      select 1 from restaurantes r
      where r.id = restaurante_id and r.ativo = true
    )
  );

create policy "public_read_produtos" on produtos
  for select to anon, authenticated
  using (
    disponivel = true
    and exists (
      select 1 from restaurantes r
      where r.id = restaurante_id and r.ativo = true
    )
  );

-- ------------------------------------------------------------
-- Checkout anônimo (defesa em profundidade; o caminho principal
-- é o Server Action via Drizzle, que recomputa os preços)
-- ------------------------------------------------------------
create policy "anon_insert_pedidos" on pedidos
  for insert to anon, authenticated
  with check (true);

create policy "anon_insert_itens" on itens_pedido
  for insert to anon, authenticated
  with check (true);

-- Obs.: NÃO há SELECT anônimo em pedidos. O cliente acompanha o
-- pedido pelo servidor (busca por UUID via Server Action).

-- ------------------------------------------------------------
-- Políticas do lojista (owner)
-- ------------------------------------------------------------
create policy "owner_update_restaurante" on restaurantes
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "owner_all_categorias" on categorias
  for all to authenticated
  using (
    exists (
      select 1 from restaurantes r
      where r.id = restaurante_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from restaurantes r
      where r.id = restaurante_id and r.owner_id = auth.uid()
    )
  );

create policy "owner_all_produtos" on produtos
  for all to authenticated
  using (
    exists (
      select 1 from restaurantes r
      where r.id = restaurante_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from restaurantes r
      where r.id = restaurante_id and r.owner_id = auth.uid()
    )
  );

-- SELECT do owner em pedidos é o que escopa o Realtime do Kanban
create policy "owner_all_pedidos" on pedidos
  for all to authenticated
  using (
    exists (
      select 1 from restaurantes r
      where r.id = restaurante_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from restaurantes r
      where r.id = restaurante_id and r.owner_id = auth.uid()
    )
  );

create policy "owner_select_itens" on itens_pedido
  for select to authenticated
  using (
    exists (
      select 1
      from pedidos p
      join restaurantes r on r.id = p.restaurante_id
      where p.id = pedido_id and r.owner_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- Realtime: publicar mudanças da tabela pedidos
-- ------------------------------------------------------------
alter publication supabase_realtime add table pedidos;
alter table pedidos replica identity full;
