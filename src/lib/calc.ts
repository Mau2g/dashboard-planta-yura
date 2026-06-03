import { DIA_POR_INDICE } from './constants';

export function rendimiento(ratioECS: number, ratioIdeal: number): number {
  return ratioIdeal ? (ratioECS / ratioIdeal) * 100 : 0;
}
export function utilizacion(horas: number): number { return (horas / 24) * 100; }
export function porcentajeLleno(inv: number, cap: number): number { return cap ? (inv / cap) * 100 : 0; }
export function pesoPromedioKg(tm: number, bolsas: number): number { return bolsas ? (tm * 1000) / bolsas : 0; }
export function variacionPct(actual: number, base: number): number { return base ? ((actual - base) / base) * 100 : 0; }
export function cumplimiento(real: number, plan: number): number { return plan ? (real / plan) * 100 : 0; }
export function totalTm(rows: { tm: number }[]): number { return rows.reduce((s, r) => s + (Number(r.tm) || 0), 0); }
export function totalBolsas(rows: { bolsas: number }[]): number { return rows.reduce((s, r) => s + (Number(r.bolsas) || 0), 0); }

export interface FilaComparativa { anio: number; mes: number; despacho_tm: number; }
export interface MesPivot { mes: number; valores: Record<number, number>; }
export function pivotComparativa(rows: FilaComparativa[]): MesPivot[] {
  const m = new Map<number, Record<number, number>>();
  for (const r of rows) { if (!m.has(r.mes)) m.set(r.mes, {}); m.get(r.mes)![r.anio] = r.despacho_tm; }
  return [...m.keys()].sort((a, b) => a - b).map((mes) => ({ mes, valores: m.get(mes)! }));
}

export function rendimientoPromedio(maquinas: { ratio_ecs: number; ratio_ideal: number }[]): number {
  if (!maquinas.length) return 0;
  return maquinas.reduce((s, m) => s + rendimiento(m.ratio_ecs, m.ratio_ideal), 0) / maquinas.length;
}

// ----- Productividad / eficiencia operativa de máquinas -----
// Ideal de embolsado: 1 bolsa por segundo = 3600 bolsas/hora.
export const BOLSA_IDEAL_POR_HORA = 3600;
// Umbrales de semáforo para el % de eficiencia.
export const UMBRAL_EFIC_OK = 90;
export const UMBRAL_EFIC_ALERTA = 70;

export interface EstadoProductividad {
  horas_produccion: number;
  horas_mantenimiento: number;
  horas_averia: number;
}
function n(v: number): number { return Number(v) || 0; }

// Horas evaluadas = suma de los tres estados.
export function horasEvaluadas(e: EstadoProductividad): number {
  return n(e.horas_produccion) + n(e.horas_mantenimiento) + n(e.horas_averia);
}
// Eficiencia operativa: producción + mantenimiento (excusado) sobre el total.
// La avería / paradas improductivas son lo único que penaliza.
export function eficienciaOperativa(e: EstadoProductividad): number {
  const total = horasEvaluadas(e);
  if (!total) return 0;
  return ((n(e.horas_produccion) + n(e.horas_mantenimiento)) / total) * 100;
}
// Rendimiento de embolsado: bolsas reales vs. el ideal de 1 bolsa/segundo
// durante las horas en producción.
export function rendimientoEmbolsado(bolsas: number, horasProduccion: number): number {
  const ideal = n(horasProduccion) * BOLSA_IDEAL_POR_HORA;
  return ideal ? (n(bolsas) / ideal) * 100 : 0;
}
export function estadoEficiencia(pct: number): 'verde' | 'amarillo' | 'rojo' {
  if (pct >= UMBRAL_EFIC_OK) return 'verde';
  if (pct >= UMBRAL_EFIC_ALERTA) return 'amarillo';
  return 'rojo';
}

// Plan especial (por fecha) gana sobre el plan semanal (por día de semana).
// Se usa T12:00:00 para evitar desfase de zona horaria al parsear la fecha.
export function planDiario(fecha: string, semanal: Record<string, number>, especiales: Record<string, number>): number {
  if (especiales[fecha] !== undefined) return especiales[fecha];
  const dia = DIA_POR_INDICE[new Date(`${fecha}T12:00:00`).getDay()];
  return semanal[dia] || 0;
}
