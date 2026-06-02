import { describe, it, expect } from 'vitest';
import {
  rendimiento, utilizacion, porcentajeLleno, totalDia,
  participaciones, totalVehiculos, rendimientoPromedio, planDiario
} from './calc';

describe('rendimiento', () => {
  it('calcula ratioECS/ratioIdeal en %', () => {
    expect(rendimiento(3171, 4300)).toBeCloseTo(73.744, 2);
  });
  it('devuelve 0 si ratioIdeal es 0', () => {
    expect(rendimiento(100, 0)).toBe(0);
  });
});

describe('utilizacion', () => {
  it('calcula horas/24 en %', () => {
    expect(utilizacion(12)).toBe(50);
  });
});

describe('porcentajeLleno', () => {
  it('calcula inventario/capacidad en %', () => {
    expect(porcentajeLleno(580.37, 2142)).toBeCloseTo(27.094, 2);
  });
  it('devuelve 0 si capacidad es 0', () => {
    expect(porcentajeLleno(10, 0)).toBe(0);
  });
});

describe('totalDia', () => {
  it('suma las TM de los despachos', () => {
    expect(totalDia([{ tipo: 'A', tm: 10 }, { tipo: 'B', tm: 5.5 }])).toBe(15.5);
  });
});

describe('participaciones', () => {
  it('calcula pct y marca destacado > 10%', () => {
    const r = participaciones([{ tipo: 'A', tm: 80 }, { tipo: 'B', tm: 20 }]);
    expect(r[0]).toEqual({ tipo: 'A', tm: 80, pct: 80, destacado: true });
    expect(r[1]).toEqual({ tipo: 'B', tm: 20, pct: 20, destacado: true });
  });
  it('pct exactamente 10 no es destacado (>10 estricto)', () => {
    const r = participaciones([{ tipo: 'A', tm: 10 }, { tipo: 'B', tm: 90 }]);
    expect(r[0].destacado).toBe(false);
  });
  it('pct 0 cuando total es 0', () => {
    const r = participaciones([{ tipo: 'A', tm: 0 }]);
    expect(r[0].pct).toBe(0);
  });
});

describe('totalVehiculos', () => {
  it('suma llamado + proceso + playa', () => {
    expect(totalVehiculos({ llamado: 1, proceso: 2, playa: 3 })).toBe(6);
  });
});

describe('rendimientoPromedio', () => {
  it('promedia rendimiento de las máquinas', () => {
    const maq = [
      { ratioECS: 2400, ratioIdeal: 2400 },
      { ratioECS: 1800, ratioIdeal: 3600 }
    ];
    expect(rendimientoPromedio(maq)).toBe(75);
  });
  it('devuelve 0 si no hay máquinas', () => {
    expect(rendimientoPromedio([])).toBe(0);
  });
});

describe('planDiario', () => {
  const planSemanal = { Lunes: 6675, Martes: 9401, Miércoles: 9333, Jueves: 9361, Viernes: 7985, Sábado: 6720, Domingo: 5810 };
  it('usa plan especial si existe para la fecha', () => {
    expect(planDiario('2026-05-21', planSemanal, { '2026-05-21': 12345 })).toBe(12345);
  });
  it('usa plan semanal por día de semana si no hay especial', () => {
    // 2026-05-21 es jueves
    expect(planDiario('2026-05-21', planSemanal, {})).toBe(9361);
  });
  it('devuelve 0 si el día no está configurado', () => {
    expect(planDiario('2026-05-21', {}, {})).toBe(0);
  });
});
