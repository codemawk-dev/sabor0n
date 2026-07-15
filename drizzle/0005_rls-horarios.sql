-- ============================================================
-- SaborOn — RLS de horarios_funcionamento
-- Horário de funcionamento é informação pública (a vitrine
-- exibe/valida); escrita apenas pelo dono do restaurante.
-- ============================================================

alter table horarios_funcionamento enable row level security;

create policy "public_read_horarios" on horarios_funcionamento
  for select to anon, authenticated
  using (
    exists (
      select 1 from restaurantes r
      where r.id = restaurante_id and r.ativo = true
    )
  );

create policy "owner_all_horarios" on horarios_funcionamento
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
