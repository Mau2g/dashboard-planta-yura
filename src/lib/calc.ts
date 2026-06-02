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

// ── Legacy functions (Vista A / Firebase) ───────────────────────────────────
import { DIA_POR_INDICE } from './constants';
import type { PlanSemanal, PlanesEspeciales } from './types';
export function totalDia(despachos: { tm: number }[]): number { return despachos.reduce((s, d) => s + (Number(d.tm) || 0), 0); }
export interface Participacion { tipo: string; tm: number; pct: number; destacado: boolean; }
export function participaciones(despachos: { tipo: string; tm: number }[]): Participacion[] {
  const total = totalDia(despachos);
  return despachos.map((d) => { const tm = Number(d.tm) || 0; const pct = total ? (tm / total) * 100 : 0; return { tipo: d.tipo, tm, pct, destacado: pct > 10 }; });
}
export function totalVehiculos(v: { llamado: number; proceso: number; playa: number }): number { return (Number(v.llamado) || 0) + (Number(v.proceso) || 0) + (Number(v.playa) || 0); }
export function rendimientoPromedio(maquinas: { ratioECS: number; ratioIdeal: number }[]): number {
  if (!maquinas.length) return 0;
  return maquinas.reduce((s, m) => s + rendimiento(m.ratioECS, m.ratioIdeal), 0) / maquinas.length;
}
export function planDiario(fechaStr: string, planSemanal: PlanSemanal, planesEspeciales: PlanesEspeciales): number {
  if (planesEspeciales[fechaStr] !== undefined) return planesEspeciales[fechaStr];
  const [year, month, day] = fechaStr.split('-').map(Number);
  const fecha = new Date(year, month - 1, day);
  const dia = DIA_POR_INDICE[fecha.getDay()];
  return planSemanal[dia] || 0;
}
