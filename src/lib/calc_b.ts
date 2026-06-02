export function pesoPromedioKg(tm: number, bolsas: number): number {
  if (!bolsas) return 0;
  return (tm * 1000) / bolsas;
}

export function variacionPct(actual: number, base: number): number {
  if (!base) return 0;
  return ((actual - base) / base) * 100;
}

export function cumplimiento(real: number, plan: number): number {
  if (!plan) return 0;
  return (real / plan) * 100;
}

export function totalFamilia(filas: { familia: string; bolsas: number; tm: number }[]): number {
  return filas.reduce((s, f) => s + (Number(f.tm) || 0), 0);
}

export interface FilaComparativa { anio: number; mes: number; despacho_tm: number; }
export interface MesPivot { mes: number; valores: Record<number, number>; }

export function pivotComparativa(rows: FilaComparativa[]): MesPivot[] {
  const porMes = new Map<number, Record<number, number>>();
  for (const r of rows) {
    if (!porMes.has(r.mes)) porMes.set(r.mes, {});
    porMes.get(r.mes)![r.anio] = r.despacho_tm;
  }
  return [...porMes.keys()].sort((a, b) => a - b).map((mes) => ({ mes, valores: porMes.get(mes)! }));
}
