export const MAQUINAS = [
  { id: 'H1', nombre: 'Haver 1', ratio_ideal: 2400 },
  { id: 'H2', nombre: 'Haver 2', ratio_ideal: 3600 },
  { id: 'H3', nombre: 'Haver 3', ratio_ideal: 3900 },
  { id: 'H4', nombre: 'Haver 4', ratio_ideal: 3900 },
  { id: 'H5', nombre: 'Haver 5', ratio_ideal: 3900 },
  { id: 'V', nombre: 'Ventomatic', ratio_ideal: 4300 }
] as const;

export const TEMPORALES = [
  { id: 1, nombre: 'Temporal 1', capacidad: 2142 },
  { id: 2, nombre: 'Temporal 2', capacidad: 1890 },
  { id: 3, nombre: 'Misti', capacidad: 3006 }
] as const;

export const DIAS_SEMANA = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'] as const;
export const DIA_POR_INDICE: Record<number, string> = { 1:'Lunes',2:'Martes',3:'Miércoles',4:'Jueves',5:'Viernes',6:'Sábado',0:'Domingo' };
export const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'] as const;
