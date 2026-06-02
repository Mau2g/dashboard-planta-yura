// Stub — full implementation in Task 11/12
export interface FilaComparativa { mes: string; anio_actual: number; anio_anterior: number; }
export function pesoPromedioKg(tm: number, bolsas: number): number {
  if (!bolsas) return 0;
  return (tm * 1000) / bolsas;
}
export function cumplimiento(real: number, plan: number): number {
  if (!plan) return 0;
  return (real / plan) * 100;
}
export function pivotComparativa(rows: any[]): FilaComparativa[] {
  return rows;
}
