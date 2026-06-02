import { getSupabase } from './supabase/client';
import type { ParteCompleto, TipoB } from './types';

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
// ── Vista A legacy stubs ─────────────────────────────────────────────────────
export interface PuntoEvolucion { label: string; real: number; plan: number; }
export interface ConfigCompleta { planSemanal: Record<string, number>; planesEspeciales: Record<string, number>; planes: { planMensual: number; planAnual: number }; }
import type { DatosDia } from './types';

export async function getConfig(): Promise<ConfigCompleta> {
  return { planSemanal: {}, planesEspeciales: {}, planes: { planMensual: 0, planAnual: 0 } };
}
export async function cargarDia(_fecha: string): Promise<DatosDia | null> { return null; }
export async function acumuladoMes(_fecha: string): Promise<number> { return 0; }
export async function acumuladoMesAnterior(_fecha: string): Promise<number | null> { return null; }
export async function ultimos7Dias(
  _fecha: string,
  _planSemanal: Record<string, number>,
  _planesEspeciales: Record<string, number>,
  _planDiario: (...args: any[]) => number
): Promise<PuntoEvolucion[]> { return []; }

export async function guardarDia(_datos: DatosDia): Promise<void> { return; }
export async function guardarPlanSemanal(_plan: Record<string, number>): Promise<void> { return; }
export async function guardarPlanesEspeciales(_planes: Record<string, number>): Promise<void> { return; }
export async function guardarTiposYPlanes(_cfg: any): Promise<void> { return; }

export async function getUltimosDespachosDiarios(desde: string, hasta: string): Promise<{ fecha: string; tm: number }[]> {
  const { data, error } = await getSupabase().from('v_participacion_dia').select('fecha,tm').gte('fecha', desde).lte('fecha', hasta);
  if (error) throw error;
  const m = new Map<string, number>();
  for (const r of (data ?? []) as { fecha: string; tm: number }[]) m.set(r.fecha, (m.get(r.fecha) ?? 0) + Number(r.tm || 0));
  return [...m.entries()].map(([fecha, tm]) => ({ fecha, tm })).sort((a, b) => a.fecha.localeCompare(b.fecha));
}
