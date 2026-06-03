import { getSupabase } from './supabase/client';
import type { ParteCompleto, TipoB, PlanSemanal, PlanesEspeciales, Planes } from './types';

export async function getTipos(): Promise<TipoB[]> {
  const { data, error } = await getSupabase().from('tipo_cemento')
    .select('id,nombre,familia,presentacion,orden').eq('activo', true).order('orden');
  if (error) throw error;
  return (data ?? []) as TipoB[];
}

export async function guardarParte(p: ParteCompleto): Promise<void> {
  const sb = getSupabase();
  const { data: parte, error } = await sb.from('parte_diario').upsert({
    fecha: p.fecha, veh_llamado: p.veh_llamado, veh_proceso: p.veh_proceso, veh_playa: p.veh_playa,
    acumulado_ajuste: p.acumulado_ajuste, comentario: p.comentario
  }, { onConflict: 'fecha' }).select('id').single();
  if (error) throw error;
  const id = parte.id as number;
  await sb.from('despacho').delete().eq('parte_id', id);
  if (p.despachos.length) {
    const { error: e } = await sb.from('despacho').insert(p.despachos.map((d) => ({ parte_id: id, tipo_id: d.tipo_id, bolsas: d.bolsas, tm: d.tm })));
    if (e) throw e;
  }
  await sb.from('venta_diaria').upsert({ parte_id: id, ...p.venta }, { onConflict: 'parte_id' });
  await sb.from('maquina_registro').delete().eq('parte_id', id);
  if (p.maquinas.length) await sb.from('maquina_registro').insert(p.maquinas.map((m) => ({ parte_id: id, ...m })));
  await sb.from('temporal_registro').delete().eq('parte_id', id);
  if (p.temporales.length) await sb.from('temporal_registro').insert(p.temporales.map((t) => ({ parte_id: id, ...t })));
  await sb.from('compuerta_registro').delete().eq('parte_id', id);
  if (p.compuertas.length) await sb.from('compuerta_registro').insert(p.compuertas.map((c) => ({ parte_id: id, ...c })));
}

export async function cargarParte(fecha: string): Promise<ParteCompleto | null> {
  const sb = getSupabase();
  const { data: cab } = await sb.from('parte_diario').select('*').eq('fecha', fecha).maybeSingle();
  if (!cab) return null;
  const id = cab.id as number;
  const [desp, venta, maq, temp, comp] = await Promise.all([
    sb.from('despacho').select('tipo_id,bolsas,tm,tipo_cemento(nombre,familia)').eq('parte_id', id),
    sb.from('venta_diaria').select('*').eq('parte_id', id).maybeSingle(),
    sb.from('maquina_registro').select('*').eq('parte_id', id),
    sb.from('temporal_registro').select('*').eq('parte_id', id),
    sb.from('compuerta_registro').select('*').eq('parte_id', id)
  ]);
  return {
    fecha,
    veh_llamado: cab.veh_llamado, veh_proceso: cab.veh_proceso, veh_playa: cab.veh_playa,
    acumulado_ajuste: cab.acumulado_ajuste, comentario: cab.comentario,
    despachos: (desp.data ?? []).map((d: any) => ({ tipo_id: d.tipo_id, nombre: d.tipo_cemento?.nombre ?? '', familia: d.tipo_cemento?.familia ?? '', bolsas: d.bolsas, tm: d.tm })),
    venta: { nacional_tm: venta.data?.nacional_tm ?? 0, export_tm: venta.data?.export_tm ?? 0, a_construir_tm: venta.data?.a_construir_tm ?? 0 },
    maquinas: (maq.data ?? []) as any, temporales: (temp.data ?? []) as any, compuertas: (comp.data ?? []) as any
  };
}

export interface ParticipacionRow { tipo: string; familia: string; bolsas: number; tm: number; pct: number; }
export async function getParticipacionDia(fecha: string): Promise<ParticipacionRow[]> {
  const { data, error } = await getSupabase().from('v_participacion_dia').select('*').eq('fecha', fecha);
  if (error) throw error; return (data ?? []) as ParticipacionRow[];
}
export interface FamiliaRow { familia: string; bolsas: number; tm: number; }
export async function getDespachoPorFamilia(fecha: string): Promise<FamiliaRow[]> {
  const { data, error } = await getSupabase().from('v_despacho_por_familia').select('familia,bolsas,tm').eq('fecha', fecha);
  if (error) throw error; return (data ?? []) as FamiliaRow[];
}
export interface ComparativaRow { anio: number; mes: number; despacho_tm: number; }
export async function getComparativaAnual(): Promise<ComparativaRow[]> {
  const { data, error } = await getSupabase().from('v_comparativa_anual').select('*');
  if (error) throw error; return (data ?? []) as ComparativaRow[];
}
export interface PlanVsRealRow { anio: number; mes: number; plan_tm: number; real_tm: number; cumplimiento_pct: number; }
export async function getPlanVsReal(anio: number): Promise<PlanVsRealRow[]> {
  const { data, error } = await getSupabase().from('v_plan_vs_real').select('*').eq('anio', anio).order('mes');
  if (error) throw error; return (data ?? []) as PlanVsRealRow[];
}
export async function getUltimosDespachosDiarios(desde: string, hasta: string): Promise<{ fecha: string; tm: number }[]> {
  const { data, error } = await getSupabase().from('v_participacion_dia').select('fecha,tm').gte('fecha', desde).lte('fecha', hasta);
  if (error) throw error;
  const m = new Map<string, number>();
  for (const r of (data ?? []) as { fecha: string; tm: number }[]) m.set(r.fecha, (m.get(r.fecha) ?? 0) + Number(r.tm || 0));
  return [...m.entries()].map(([fecha, tm]) => ({ fecha, tm })).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// ----- Productividad / eficiencia operativa de máquinas -----
export interface ProductividadRow {
  maquina_id: string;
  horas_produccion: number;
  horas_mantenimiento: number;
  horas_averia: number;
  bolsas: number;
  comentario: string;
}

export async function getProductividadDia(fecha: string): Promise<ProductividadRow[]> {
  const sb = getSupabase();
  const { data: cab } = await sb.from('parte_diario').select('id').eq('fecha', fecha).maybeSingle();
  if (!cab) return [];
  const { data, error } = await sb.from('maquina_productividad')
    .select('maquina_id,horas_produccion,horas_mantenimiento,horas_averia,bolsas,comentario')
    .eq('parte_id', cab.id);
  if (error) throw error;
  return (data ?? []) as ProductividadRow[];
}

export async function guardarProductividad(fecha: string, rows: ProductividadRow[]): Promise<void> {
  const sb = getSupabase();
  // Asegura la cabecera del parte para la fecha (sin tocar otros campos si ya existe).
  const { data: parte, error } = await sb.from('parte_diario')
    .upsert({ fecha }, { onConflict: 'fecha' }).select('id').single();
  if (error) throw error;
  const id = parte.id as number;
  await sb.from('maquina_productividad').delete().eq('parte_id', id);
  const limpios = rows.filter((r) =>
    Number(r.horas_produccion) || Number(r.horas_mantenimiento) || Number(r.horas_averia) || Number(r.bolsas) || r.comentario);
  if (limpios.length) {
    const { error: e } = await sb.from('maquina_productividad')
      .insert(limpios.map((r) => ({ parte_id: id, ...r })));
    if (e) throw e;
  }
}

// ----- Configuración -----
export async function getPlanSemanal(): Promise<PlanSemanal> {
  const { data } = await getSupabase().from('plan_semanal').select('dia,tm');
  const m: PlanSemanal = {};
  for (const r of (data ?? []) as { dia: string; tm: number }[]) m[r.dia] = r.tm;
  return m;
}
export async function guardarPlanSemanal(p: PlanSemanal): Promise<void> {
  const rows = Object.entries(p).map(([dia, tm]) => ({ dia, tm }));
  const { error } = await getSupabase().from('plan_semanal').upsert(rows, { onConflict: 'dia' });
  if (error) throw error;
}
export async function getPlanesEspeciales(): Promise<PlanesEspeciales> {
  const { data } = await getSupabase().from('plan_especial').select('fecha,tm');
  const m: PlanesEspeciales = {};
  for (const r of (data ?? []) as { fecha: string; tm: number }[]) m[r.fecha] = r.tm;
  return m;
}
export async function guardarPlanEspecial(fecha: string, tm: number): Promise<void> {
  const { error } = await getSupabase().from('plan_especial').upsert({ fecha, tm }, { onConflict: 'fecha' });
  if (error) throw error;
}
export async function eliminarPlanEspecial(fecha: string): Promise<void> {
  const { error } = await getSupabase().from('plan_especial').delete().eq('fecha', fecha);
  if (error) throw error;
}
export async function getPlanAnual(anio: number): Promise<Planes> {
  const { data } = await getSupabase().from('plan_anual').select('plan_mensual,plan_anual').eq('anio', anio).maybeSingle();
  return { planMensual: data?.plan_mensual ?? 0, planAnual: data?.plan_anual ?? 0 };
}
export async function guardarPlanAnual(anio: number, planMensual: number, planAnual: number): Promise<void> {
  const { error } = await getSupabase().from('plan_anual').upsert({ anio, plan_mensual: planMensual, plan_anual: planAnual }, { onConflict: 'anio' });
  if (error) throw error;
}
export async function crearTipo(nombre: string, familia = 'OTRO', presentacion = 'bolsa42.5'): Promise<void> {
  const { error } = await getSupabase().from('tipo_cemento').insert({ nombre, familia, presentacion });
  if (error) throw error;
}
export async function actualizarTipo(id: number, campos: { nombre?: string; familia?: string }): Promise<void> {
  const { error } = await getSupabase().from('tipo_cemento').update(campos).eq('id', id);
  if (error) throw error;
}
export async function eliminarTipo(id: number): Promise<void> {
  // borrado lógico (preserva integridad con despachos históricos)
  const { error } = await getSupabase().from('tipo_cemento').update({ activo: false }).eq('id', id);
  if (error) throw error;
}

// ----- Helpers de dashboard (paridad index.html) -----
// Despacho mensual combinado (histórico 2024/25 + vivo 2026+); sin solape.
export async function despachoMes(anio: number, mes: number): Promise<number> {
  const { data } = await getSupabase().from('v_despacho_mensual').select('despacho_tm').eq('anio', anio).eq('mes', mes);
  return (data ?? []).reduce((s: number, r: any) => s + Number(r.despacho_tm || 0), 0);
}

export interface MaquinaDiaRow { nombre: string; horas_maquina: number; ratio_ecs: number; ratio_ideal: number; averia_critica: string; }
export async function getMaquinasDia(fecha: string): Promise<MaquinaDiaRow[]> {
  const sb = getSupabase();
  const { data: cab } = await sb.from('parte_diario').select('id').eq('fecha', fecha).maybeSingle();
  if (!cab) return [];
  const { data } = await sb.from('maquina_registro').select('maquina_id,horas_maquina,ratio_ecs,averia_critica,maquina(nombre,ratio_ideal)').eq('parte_id', cab.id);
  return (data ?? []).map((m: any) => ({ nombre: m.maquina?.nombre ?? m.maquina_id, horas_maquina: m.horas_maquina, ratio_ecs: m.ratio_ecs, ratio_ideal: m.maquina?.ratio_ideal ?? 0, averia_critica: m.averia_critica }));
}

export async function getCompuertasDia(fecha: string): Promise<{ numero: number; horas: number; comentario: string }[]> {
  const sb = getSupabase();
  const { data: cab } = await sb.from('parte_diario').select('id').eq('fecha', fecha).maybeSingle();
  if (!cab) return [];
  const { data } = await sb.from('compuerta_registro').select('numero,horas,comentario').eq('parte_id', cab.id).order('numero');
  return (data ?? []) as { numero: number; horas: number; comentario: string }[];
}
