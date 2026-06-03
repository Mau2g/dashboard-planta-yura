-- Datos horarios por máquina (export automático ECS "Daily Report").
-- Granularidad: una fila por fecha + máquina + franja horaria (0..23).
-- Los valores de bolsas vienen ACUMULADOS dentro del día (BOL_DAY); la vista
-- v_maquina_hora deriva la producción por hora como diferencia con la franja previa.

create table maquina_hora (
  fecha               date not null,
  maquina_id          text not null references maquina(id),
  hora                int  not null check (hora between 0 and 23),
  bolsas_acum         numeric not null default 0,  -- BOL_DAY (acumulado intradía)
  paletizadas_acum    numeric not null default 0,  -- solo H5 / Ventomatic
  horas_operacion     numeric not null default 0,  -- HOUR_DAY
  ratio_embolsado     numeric not null default 0,  -- RATIO_DAY
  bolsas_rechazadas   numeric not null default 0,  -- TOT rechazadas
  primary key (fecha, maquina_id, hora)
);

create index maquina_hora_fecha_idx on maquina_hora (fecha);
create index maquina_hora_maquina_idx on maquina_hora (maquina_id);

-- Vista con producción por hora derivada (delta del acumulado) y rendimiento.
create view v_maquina_hora as
select
  mh.fecha,
  mh.maquina_id,
  m.nombre as maquina,
  mh.hora,
  mh.bolsas_acum,
  greatest(mh.bolsas_acum - coalesce(lag(mh.bolsas_acum) over (
    partition by mh.fecha, mh.maquina_id order by mh.hora), 0), 0) as bolsas_hora,
  mh.horas_operacion,
  mh.ratio_embolsado,
  mh.bolsas_rechazadas,
  mh.paletizadas_acum,
  m.ratio_ideal
from maquina_hora mh
join maquina m on m.id = mh.maquina_id;

-- RLS permisiva (paridad con el resto del esquema).
alter table public.maquina_hora enable row level security;
create policy "anon_all_maquina_hora" on public.maquina_hora
  for all to anon using (true) with check (true);
