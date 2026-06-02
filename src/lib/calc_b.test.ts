import { describe, it, expect } from 'vitest';
import { pesoPromedioKg, variacionPct, cumplimiento, pivotComparativa, totalFamilia } from './calc_b';

describe('pesoPromedioKg', () => {
  it('calcula kg/bolsa = tm*1000/bolsas', () => {
    expect(pesoPromedioKg(42.5, 1000)).toBeCloseTo(42.5, 3);
  });
  it('devuelve 0 si no hay bolsas', () => {
    expect(pesoPromedioKg(10, 0)).toBe(0);
  });
});

describe('variacionPct', () => {
  it('calcula (actual-base)/base*100', () => {
    expect(variacionPct(110, 100)).toBeCloseTo(10, 6);
  });
  it('devuelve 0 si base es 0', () => {
    expect(variacionPct(50, 0)).toBe(0);
  });
});

describe('cumplimiento', () => {
  it('calcula real/plan*100', () => {
    expect(cumplimiento(90, 100)).toBe(90);
  });
  it('devuelve 0 si plan es 0', () => {
    expect(cumplimiento(50, 0)).toBe(0);
  });
});

describe('totalFamilia', () => {
  it('suma tm de filas de una familia', () => {
    expect(totalFamilia([{ familia: 'IP', bolsas: 10, tm: 5 }, { familia: 'HE', bolsas: 2, tm: 3 }])).toBe(8);
  });
});

describe('pivotComparativa', () => {
  it('pivota filas largas (anio,mes,tm) a mes -> {anio: tm}', () => {
    const rows = [
      { anio: 2024, mes: 1, despacho_tm: 100 },
      { anio: 2025, mes: 1, despacho_tm: 110 },
      { anio: 2024, mes: 2, despacho_tm: 200 }
    ];
    const r = pivotComparativa(rows);
    expect(r[0]).toEqual({ mes: 1, valores: { 2024: 100, 2025: 110 } });
    expect(r[1]).toEqual({ mes: 2, valores: { 2024: 200 } });
  });
});
