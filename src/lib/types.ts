export interface DespachoLinea { tipo_id: number; nombre: string; familia: string; bolsas: number; tm: number; }
export interface VentaDia { nacional_tm: number; export_tm: number; a_construir_tm: number; }
export interface MaquinaReg { maquina_id: string; nombre: string; ratio_ideal: number; horas_maquina: number; ratio_ecs: number; operativos: number; comentario: string; averia_critica: 'verde' | 'amarillo' | 'rojo'; }
export interface TemporalReg { temporal_id: number; nombre: string; capacidad: number; inventario: number; }
export interface CompuertaReg { numero: number; horas: number; comentario: string; }
export interface Vehiculos { llamado: number; proceso: number; playa: number; }

export interface ParteCompleto {
  fecha: string;
  veh_llamado: number; veh_proceso: number; veh_playa: number;
  acumulado_ajuste: number; comentario: string;
  despachos: DespachoLinea[];
  venta: VentaDia;
  maquinas: { maquina_id: string; horas_maquina: number; ratio_ecs: number; operativos: number; comentario: string; averia_critica: string }[];
  temporales: { temporal_id: number; inventario: number }[];
  compuertas: CompuertaReg[];
}

export interface TipoB { id: number; nombre: string; familia: string; presentacion: string; orden: number; }
export type PlanSemanal = Record<string, number>;
export type PlanesEspeciales = Record<string, number>;
export interface Planes { planMensual: number; planAnual: number; }
