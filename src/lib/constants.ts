import type { Maquina, Temporal, TipoCemento } from './types';

export const MAQUINAS: Maquina[] = [
  { id: 'H1', nombre: 'Haver 1', ratioIdeal: 2400 },
  { id: 'H2', nombre: 'Haver 2', ratioIdeal: 3600 },
  { id: 'H3', nombre: 'Haver 3', ratioIdeal: 3900 },
  { id: 'H4', nombre: 'Haver 4', ratioIdeal: 3900 },
  { id: 'H5', nombre: 'Haver 5', ratioIdeal: 3900 },
  { id: 'V', nombre: 'Ventomatic', ratioIdeal: 4300 }
];

export const TEMPORALES: Temporal[] = [
  { nombre: 'Temporal 1', capacidad: 2142, inventario: 0 },
  { nombre: 'Temporal 2', capacidad: 1890, inventario: 0 },
  { nombre: 'Misti', capacidad: 3006, inventario: 0 }
];

export const DIAS_SEMANA = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'] as const;

// getDay() -> 0=Domingo
export const DIA_POR_INDICE: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo'
};

export const TIPOS_DEFECTO: TipoCemento[] = [
  "CEM. FRONTERA GU X 42.5 KG",
  "CEMENTO FRONTERA IP x 42.5 KG",
  "CEMENTO HS+R X 42.5 KG RUMI",
  "CEMENTO PORTLAND TIPO I X 42.5 KG YURA",
  "CEMENTO YURA ANTISALITRE (MS) X 42.5 KG",
  "CEMENTO YURA MAX (HS) X 42.5KG",
  "CEMENTO YURA PRO (HE) 42.5KG",
  "CEMENTO YURA PRO EXPORT BRASIL x 42.5 kg",
  "CEMENTO BLANCO X 25 KG YURA NACIONAL",
  "CEMENTO YURA PRO (HE) BBx1.5TM INC.ENV",
  "CEM ALT REST IN HE BB1.5TM YURA ENV CHIL",
  "CEM. PORT. PUZ. IP BBx1.5TM INC.ENV YURA",
  "CEM.YURA ANTISALITRE MS BBx1.5TM INC.ENV",
  "CEMENTO YURA MAX BBx1.5TM INC.ENV",
  "CEM. PORT. I BBx1.5TM INC.ENV YURA",
  "CEMENTO YURA PRO (HE) GRANEL EN BOMBONA",
  "CEMENTO YURA IP A GRANEL EN BOMBONA",
  "CEMENTO YURA MAX GRANEL BOMBONA"
].map(n => ({ nombre: n }));
