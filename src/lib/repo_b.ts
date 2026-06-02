import { getSupabase } from './supabase/client';

export interface DespachoLineaB { tipo_id: number; nombre: string; familia: string; bolsas: number; tm: number; }
export interface VentaDia { nacional_tm: number; export_tm: number; a_construir_tm: number; }
export interface MaquinaRegB { maquina_id: string; horas_maquina: number; ratio_ecs: number; operativos: number; comentario: string; averia_critica: string; }
export interface TemporalRegB { temporal_id: number; inventario: number; }
export interface CompuertaRegB { numero: number; horas: number; comentario: string; }

export interface ParteCompleto {
  fecha: string;
  veh_llamado: number; veh_proceso: number; veh_playa: number;
  acumulado_ajuste: number; comentario: string;
  despachos: DespachoLineaB[];
  venta: VentaDia;
  maquinas: MaquinaRegB[];
  temporales: TemporalRegB[];
  compuertas: CompuertaRegB[];
}

export interface TipoB { id: number; nombre: string; familia: string; presentacion: string; orden: number; }

export async function getTipos(): Promise<TipoB[]> {
  const { data, error } = await getSupabase()
    .from('tipo_cemento').select('id,nombre,familia,presentacion,orden')
    .eq('activo', true).order('orden');
  if (error) throw error;
  return data ?? [];
}

async function getParteId(fecha: string): Promise<number | null> {
  const { data } = await getSupabase().from('parte_diario').select('id').eq('fecha', fecha).maybeSingle();
  return data?.id ?? null;
}

export async function guardarParte(p: ParteCompleto): Promise<void> {
  const sb = getSupabase();
  const { data: parte, error: e1 } = await sb.from('parte_diario').upsert({
    fecha: p.fecha, veh_llamado: p.veh_llamado, veh_proceso: p.veh_proceso, veh_playa: p.veh_playa,
    acumulado_ajuste: p.acumulado_ajuste, comentario: p.comentario
  }, { onConflict: 'fecha' }).select('id').single();
  if (e1) throw e1;
  const parteId = parte.id as number;

  await sb.from('despacho').delete().eq('parte_id', parteId);
  if (p.despachos.length) {
    const { error } = await sb.from('despacho').insert(
      p.despachos.map((d) => ({ parte_id: parteId, tipo_id: d.tipo_id, bolsas: d.bolsas, tm: d.tm }))
    );
    if (error) throw error;
  }
  await sb.from('venta_diaria').upsert({ parte_id: parteId, ...p.venta }, { onConflict: 'parte_id' });

  await sb.from('maquina_registro').delete().eq('parte_id', parteId);
  if (p.maquinas.length) await sb.from('maquina_registro').insert(p.maquinas.map((m) => ({ parte_id: parteId, ...m })));

  await sb.from('temporal_registro').delete().eq('parte_id', parteId);
  if (p.temporales.length) await sb.from('temporal_registro').insert(p.temporales.map((t) => ({ parte_id: parteId, ...t })));

  await sb.from('compuerta_registro').delete().eq('parte_id', parteId);
  if (p.compuertas.length) await sb.from('compuerta_registro').insert(p.compuertas.map((c) => ({ parte_id: parteId, ...c })));
}

export interface ParticipacionRow { tipo: string; familia: string; bolsas: number; tm: number; pct: number; }
export async function getParticipacionDia(fecha: string): Promise<ParticipacionRow[]> {
  const { data, error } = await getSupabase().from('v_participacion_dia').select('*').eq('fecha', fecha);
  if (error) throw error;
  return (data ?? []) as ParticipacionRow[];
}

export interface FamiliaRow { familia: string; bolsas: number; tm: number; }
export async function getDespachoPorFamilia(fecha: string): Promise<FamiliaRow[]> {
  const { data, error } = await getSupabase().from('v_despacho_por_familia').select('familia,bolsas,tm').eq('fecha', fecha);
  if (error) throw error;
  return (data ?? []) as FamiliaRow[];
}

export interface ComparativaRow { anio: number; mes: number; despacho_tm: number; }
export async function getComparativaAnual(): Promise<ComparativaRow[]> {
  const { data, error } = await getSupabase().from('v_comparativa_anual').select('*');
  if (error) throw error;
  return (data ?? []) as ComparativaRow[];
}

export interface PlanVsRealRow { anio: number; mes: number; plan_tm: number; real_tm: number; cumplimiento_pct: number; }
export async function getPlanVsReal(anio: number): Promise<PlanVsRealRow[]> {
  const { data, error } = await getSupabase().from('v_plan_vs_real').select('*').eq('anio', anio).order('mes');
  if (error) throw error;
  return (data ?? []) as PlanVsRealRow[];
}

export async function cargarParte(fecha: string): Promise<ParteCompleto | null> {
  const sb = getSupabase();
  const id = await getParteId(fecha);
  if (!id) return null;
  const [{ data: cab }, desp, venta, maq, temp, comp] = await Promise.all([
    sb.from('parte_diario').select('*').eq('id', id).single(),
    sb.from('despacho').select('tipo_id,bolsas,tm,tipo_cemento(nombre,familia)').eq('parte_id', id),
    sb.from('venta_diaria').select('*').eq('parte_id', id).maybeSingle(),
    sb.from('maquina_registro').select('*').eq('parte_id', id),
    sb.from('temporal_registro').select('*').eq('parte_id', id),
    sb.from('compuerta_registro').select('*').eq('parte_id', id)
  ]);
  return {
    fecha,
    veh_llamado: cab?.veh_llamado ?? 0, veh_proceso: cab?.veh_proceso ?? 0, veh_playa: cab?.veh_playa ?? 0,
    acumulado_ajuste: cab?.acumulado_ajuste ?? 0, comentario: cab?.comentario ?? '',
    despachos: (desp.data ?? []).map((d: any) => ({ tipo_id: d.tipo_id, nombre: d.tipo_cemento?.nombre ?? '', familia: d.tipo_cemento?.familia ?? '', bolsas: d.bolsas, tm: d.tm })),
    venta: { nacional_tm: venta.data?.nacional_tm ?? 0, export_tm: venta.data?.export_tm ?? 0, a_construir_tm: venta.data?.a_construir_tm ?? 0 },
    maquinas: (maq.data ?? []) as any,
    temporales: (temp.data ?? []) as any,
    compuertas: (comp.data ?? []) as any
  };
}
