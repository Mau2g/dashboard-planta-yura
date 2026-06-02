-- Participación por tipo de un parte (día)
create or replace view v_participacion_dia as
select
  p.fecha,
  tc.nombre as tipo,
  tc.familia,
  d.bolsas,
  d.tm,
  case when sum(d.tm) over (partition by p.fecha) = 0 then 0
       else d.tm / sum(d.tm) over (partition by p.fecha) * 100 end as pct
from parte_diario p
join despacho d on d.parte_id = p.id
join tipo_cemento tc on tc.id = d.tipo_id;

-- Despacho por familia y fecha
create or replace view v_despacho_por_familia as
select p.fecha, tc.familia,
       sum(d.bolsas) as bolsas,
       sum(d.tm) as tm
from parte_diario p
join despacho d on d.parte_id = p.id
join tipo_cemento tc on tc.id = d.tipo_id
group by p.fecha, tc.familia;

-- Despacho mensual en vivo (desde captura)
create or replace view v_despacho_mensual_live as
select extract(year from p.fecha)::int as anio,
       extract(month from p.fecha)::int as mes,
       sum(d.tm) as despacho_tm
from parte_diario p
join despacho d on d.parte_id = p.id
group by 1, 2;

-- Despacho mensual combinado (histórico + vivo). Sin solape: histórico solo 2024/2025.
create or replace view v_despacho_mensual as
select anio, mes, despacho_tm from resumen_mensual_historico
union all
select anio, mes, despacho_tm from v_despacho_mensual_live;

-- Comparativa anual: una fila por mes/año (formato largo, el cliente pivota)
create or replace view v_comparativa_anual as
select anio, mes, despacho_tm from v_despacho_mensual order by mes, anio;

-- Plan vs real mensual (plan total por mes = suma de familias)
create or replace view v_plan_vs_real as
select pv.anio, pv.mes,
       sum(pv.tm) as plan_tm,
       coalesce(l.despacho_tm, 0) as real_tm,
       case when sum(pv.tm) = 0 then 0
            else coalesce(l.despacho_tm,0) / sum(pv.tm) * 100 end as cumplimiento_pct
from plan_ventas_familia pv
left join v_despacho_mensual_live l on l.anio = pv.anio and l.mes = pv.mes
group by pv.anio, pv.mes, l.despacho_tm;
