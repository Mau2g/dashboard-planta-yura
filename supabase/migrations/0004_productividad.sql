-- Productividad / eficiencia operativa de máquinas de embolsado.
-- Tres estados de trabajo por máquina y día: producción, mantenimiento, avería.
-- Regla de negocio: el mantenimiento cuenta como tiempo productivo (no penaliza);
-- la avería y las paradas improductivas (p. ej. descansos no programados) sí penalizan.
-- Ideal de embolsado: 1 bolsa por segundo = 3600 bolsas/hora.

create table maquina_productividad (
  parte_id             bigint not null references parte_diario(id) on delete cascade,
  maquina_id           text not null references maquina(id),
  horas_produccion     numeric not null default 0,
  horas_mantenimiento  numeric not null default 0,
  horas_averia         numeric not null default 0,
  bolsas               numeric not null default 0,
  comentario           text not null default '',
  primary key (parte_id, maquina_id)
);

-- RLS permisiva (paridad con el resto del esquema; sin auth).
alter table public.maquina_productividad enable row level security;
create policy "anon_all_maquina_productividad" on public.maquina_productividad
  for all to anon using (true) with check (true);
