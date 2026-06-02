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
