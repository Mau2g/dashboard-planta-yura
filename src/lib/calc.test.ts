import { describe, it, expect } from 'vitest';
import { rendimiento, utilizacion, porcentajeLleno, pesoPromedioKg, variacionPct, cumplimiento, totalTm, totalBolsas, pivotComparativa, rendimientoPromedio, planDiario } from './calc';

describe('rendimiento', () => {
  it('ratioECS/ratioIdeal en %', () => expect(rendimiento(3171, 4300)).toBeCloseTo(73.744, 2));
  it('0 si ideal=0', () => expect(rendimiento(100, 0)).toBe(0));
});
describe('utilizacion', () => { it('horas/24', () => expect(utilizacion(12)).toBe(50)); });
describe('porcentajeLleno', () => {
  it('inv/cap', () => expect(porcentajeLleno(580.37, 2142)).toBeCloseTo(27.094, 2));
  it('0 si cap=0', () => expect(porcentajeLleno(10, 0)).toBe(0));
});
describe('pesoPromedioKg', () => {
  it('tm*1000/bolsas', () => expect(pesoPromedioKg(42.5, 1000)).toBeCloseTo(42.5, 3));
  it('0 si bolsas=0', () => expect(pesoPromedioKg(10, 0)).toBe(0));
});
describe('variacionPct', () => {
  it('(a-b)/b*100', () => expect(variacionPct(110, 100)).toBeCloseTo(10, 6));
  it('0 si base=0', () => expect(variacionPct(50, 0)).toBe(0));
});
describe('cumplimiento', () => {
  it('real/plan*100', () => expect(cumplimiento(90, 100)).toBe(90));
  it('0 si plan=0', () => expect(cumplimiento(50, 0)).toBe(0));
});
describe('totales', () => {
  const d = [{ tm: 10, bolsas: 100 }, { tm: 5.5, bolsas: 50 }];
  it('totalTm', () => expect(totalTm(d)).toBe(15.5));
  it('totalBolsas', () => expect(totalBolsas(d)).toBe(150));
});
describe('pivotComparativa', () => {
  it('agrupa por mes -> {anio: tm}', () => {
    const r = pivotComparativa([
      { anio: 2024, mes: 1, despacho_tm: 100 },
      { anio: 2025, mes: 1, despacho_tm: 110 },
      { anio: 2024, mes: 2, despacho_tm: 200 }
    ]);
    expect(r[0]).toEqual({ mes: 1, valores: { 2024: 100, 2025: 110 } });
    expect(r[1]).toEqual({ mes: 2, valores: { 2024: 200 } });
  });
});
describe('rendimientoPromedio', () => {
  it('promedia el rendimiento de las máquinas', () =>
    expect(rendimientoPromedio([{ ratio_ecs: 2400, ratio_ideal: 2400 }, { ratio_ecs: 1800, ratio_ideal: 3600 }])).toBe(75));
  it('0 si no hay máquinas', () => expect(rendimientoPromedio([])).toBe(0));
});
describe('planDiario', () => {
  const ps = { Lunes: 6675, Martes: 9401, Miércoles: 9333, Jueves: 9361, Viernes: 7985, Sábado: 6720, Domingo: 5810 };
  it('el plan especial gana', () => expect(planDiario('2026-05-21', ps, { '2026-05-21': 12345 })).toBe(12345));
  it('usa el plan semanal por día (2026-05-21 es jueves)', () => expect(planDiario('2026-05-21', ps, {})).toBe(9361));
  it('0 si el día no está configurado', () => expect(planDiario('2026-05-21', {}, {})).toBe(0));
});
