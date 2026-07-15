-- ============================================================
-- SaborOn — RLS do módulo de Caixa (PDV)
-- Caixa e movimentações são dados internos do lojista:
-- nenhum acesso anônimo, apenas o dono do restaurante.
-- ============================================================

alter table caixas               enable row level security;
alter table movimentacoes_caixa  enable row level security;

create policy "owner_all_caixas" on caixas
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

create policy "owner_all_movimentacoes" on movimentacoes_caixa
  for all to authenticated
  using (
    exists (
      select 1
      from caixas c
      join restaurantes r on r.id = c.restaurante_id
      where c.id = caixa_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from caixas c
      join restaurantes r on r.id = c.restaurante_id
      where c.id = caixa_id and r.owner_id = auth.uid()
    )
  );
