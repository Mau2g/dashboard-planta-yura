import { DIA_POR_INDICE } from './constants';
import type { DespachoLinea, Vehiculos, PlanSemanal, PlanesEspeciales } from './types';

export function rendimiento(ratioECS: number, ratioIdeal: number): number {
  if (!ratioIdeal) return 0;
  return (ratioECS / ratioIdeal) * 100;
}

export function utilizacion(horas: number): number {
  return (horas / 24) * 100;
}

export function porcentajeLleno(inventario: number, capacidad: number): number {
  if (!capacidad) return 0;
  return (inventario / capacidad) * 100;
}

export function totalDia(despachos: DespachoLinea[]): number {
  return despachos.reduce((s, d) => s + (Number(d.tm) || 0), 0);
}

export interface Participacion { tipo: string; tm: number; pct: number; destacado: boolean; }

export function participaciones(despachos: DespachoLinea[]): Participacion[] {
  const total = totalDia(despachos);
  return despachos.map((d) => {
    const tm = Number(d.tm) || 0;
    const pct = total ? (tm / total) * 100 : 0;
    return { tipo: d.tipo, tm, pct, destacado: pct > 10 };
  });
}

export function totalVehiculos(v: Vehiculos): number {
  return (Number(v.llamado) || 0) + (Number(v.proceso) || 0) + (Number(v.playa) || 0);
}

export function rendimientoPromedio(maquinas: { ratioECS: number; ratioIdeal: number }[]): number {
  if (!maquinas.length) return 0;
  const sum = maquinas.reduce((s, m) => s + rendimiento(m.ratioECS, m.ratioIdeal), 0);
  return sum / maquinas.length;
}

export function planDiario(fechaStr: string, planSemanal: PlanSemanal, planesEspeciales: PlanesEspeciales): number {
  if (planesEspeciales[fechaStr] !== undefined) return planesEspeciales[fechaStr];
  const [year, month, day] = fechaStr.split('-').map(Number);
  const fecha = new Date(year, month - 1, day);
  const dia = DIA_POR_INDICE[fecha.getDay()];
  return planSemanal[dia] || 0;
}
