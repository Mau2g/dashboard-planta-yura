export interface TipoCemento { nombre: string; }

export interface DespachoLinea { tipo: string; tm: number; }

export interface Maquina {
  id: string;
  nombre: string;
  ratioIdeal: number;
}

export interface MaquinaRegistro {
  id: string;
  nombre: string;
  horasMaquina: number;
  ratioECS: number;
  ratioIdeal: number;
  comentario: string;
  averiaCritica: 'verde' | 'amarillo' | 'rojo';
}

export interface Temporal { nombre: string; capacidad: number; inventario: number; }

export interface Compuerta { numero: number; horas: number; comentario: string; }

export interface Vehiculos { llamado: number; proceso: number; playa: number; }

export interface DatosDia {
  fecha: string;
  despachos: DespachoLinea[];
  maquinas: MaquinaRegistro[];
  temporales: Temporal[];
  compuertas: Compuerta[];
  vehiculos: Vehiculos;
  acumuladoAjuste: number;
  comentarioGeneral: string;
}

export type PlanSemanal = Record<string, number>;
export type PlanesEspeciales = Record<string, number>;
export interface Planes { planMensual: number; planAnual: number; }
