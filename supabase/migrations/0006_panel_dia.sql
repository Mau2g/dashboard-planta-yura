-- RPC que devuelve TODO el dashboard del día en una sola llamada (jsonb),
-- reemplazando ~13 consultas separadas desde el navegador. Reduce drásticamente
-- la latencia (round-trips) sin cambiar la lógica. Ejecuta en ~14 ms.
create or replace function panel_dia(p_fecha date)
returns jsonb
language sql stable
as $$
  with y as (select extract(year from p_fecha)::int an, extract(month from p_fecha)::int me),
  ym_ant as (
    select case when me=1 then an-1 else an end an, case when me=1 then 12 else me-1 end me from y
  )
  select jsonb_build_object(
    'participacion', coalesce((select jsonb_agg(jsonb_build_object('tipo',tipo,'familia',familia,'bolsas',bolsas,'tm',tm,'pct',pct))
        from v_participacion_dia where fecha=p_fecha), '[]'::jsonb),
    'familias', coalesce((select jsonb_agg(jsonb_build_object('familia',familia,'bolsas',bolsas,'tm',tm))
        from v_despacho_por_familia where fecha=p_fecha), '[]'::jsonb),
    'maquinas', coalesce((select jsonb_agg(jsonb_build_object('nombre',m.nombre,'horas_maquina',mr.horas_maquina,
        'ratio_ecs',mr.ratio_ecs,'ratio_ideal',m.ratio_ideal,'averia_critica',mr.averia_critica) order by m.id)
        from maquina_registro mr join parte_diario p on p.id=mr.parte_id join maquina m on m.id=mr.maquina_id
        where p.fecha=p_fecha), '[]'::jsonb),
    'compuertas', coalesce((select jsonb_agg(jsonb_build_object('numero',cr.numero,'horas',cr.horas,'comentario',cr.comentario) order by cr.numero)
        from compuerta_registro cr join parte_diario p on p.id=cr.parte_id where p.fecha=p_fecha), '[]'::jsonb),
    'acum_mes', coalesce((select sum(despacho_tm) from v_despacho_mensual, y where anio=y.an and mes=y.me), 0),
    'acum_mes_ant', coalesce((select sum(despacho_tm) from v_despacho_mensual, ym_ant where anio=ym_ant.an and mes=ym_ant.me), 0),
    'plan', coalesce((select jsonb_build_object('planMensual',coalesce(plan_mensual,0),'planAnual',coalesce(plan_anual,0))
        from plan_anual, y where anio=y.an), jsonb_build_object('planMensual',0,'planAnual',0)),
    'plan_semanal', coalesce((select jsonb_object_agg(dia,tm) from plan_semanal), '{}'::jsonb),
    'plan_especiales', coalesce((select jsonb_object_agg(fecha::text,tm) from plan_especial), '{}'::jsonb),
    'plan_vs_real', coalesce((select jsonb_agg(jsonb_build_object('anio',anio,'mes',mes,'plan_tm',plan_tm,'real_tm',real_tm,'cumplimiento_pct',cumplimiento_pct) order by mes)
        from v_plan_vs_real, y where anio=y.an), '[]'::jsonb),
    'comparativa', coalesce((select jsonb_agg(jsonb_build_object('anio',anio,'mes',mes,'despacho_tm',despacho_tm))
        from v_comparativa_anual), '[]'::jsonb),
    'serie7', coalesce((select jsonb_agg(jsonb_build_object('fecha',fecha,'tm',tm)) from (
        select p.fecha, sum(d.tm) tm from parte_diario p join despacho d on d.parte_id=p.id
        where p.fecha between p_fecha-6 and p_fecha group by p.fecha) s), '[]'::jsonb)
  );
$$;
