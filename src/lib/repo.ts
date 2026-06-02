import {
  collection, doc, getDoc, getDocs, setDoc, query, where, serverTimestamp
} from 'firebase/firestore';
import { getDb } from './firebase';
import { TIPOS_DEFECTO } from './constants';
import { totalDia } from './calc';
import type {
  DatosDia, TipoCemento, Planes, PlanSemanal, PlanesEspeciales
} from './types';

const DIARIOS = 'planta_datos_diarios';
const CONFIG = 'planta_config';

export interface ConfigCompleta {
  tiposCemento: TipoCemento[];
  planes: Planes;
  planSemanal: PlanSemanal;
  planesEspeciales: PlanesEspeciales;
}

export async function getConfig(): Promise<ConfigCompleta> {
  const db = getDb();
  const tiposSnap = await getDoc(doc(db, CONFIG, 'tiposCemento'));
  const tiposCemento: TipoCemento[] = tiposSnap.exists()
    ? (tiposSnap.data().lista as TipoCemento[])
    : TIPOS_DEFECTO;

  const planesSnap = await getDoc(doc(db, CONFIG, 'planes'));
  const planes: Planes = planesSnap.exists()
    ? (planesSnap.data() as Planes)
    : { planMensual: 0, planAnual: 0 };

  const planSemanalSnap = await getDoc(doc(db, CONFIG, 'planSemanal'));
  const planSemanal: PlanSemanal = planSemanalSnap.exists()
    ? (planSemanalSnap.data() as PlanSemanal)
    : { Lunes: 0, Martes: 0, Miércoles: 0, Jueves: 0, Viernes: 0, Sábado: 0, Domingo: 0 };

  const planesEspSnap = await getDoc(doc(db, CONFIG, 'planesEspeciales'));
  const planesEspeciales: PlanesEspeciales = planesEspSnap.exists()
    ? (planesEspSnap.data() as PlanesEspeciales)
    : {};

  return { tiposCemento, planes, planSemanal, planesEspeciales };
}

export async function guardarTiposYPlanes(tiposCemento: TipoCemento[], planes: Planes): Promise<void> {
  const db = getDb();
  await setDoc(doc(db, CONFIG, 'tiposCemento'), { lista: tiposCemento });
  await setDoc(doc(db, CONFIG, 'planes'), planes);
}

export async function guardarPlanSemanal(planSemanal: PlanSemanal): Promise<void> {
  await setDoc(doc(getDb(), CONFIG, 'planSemanal'), planSemanal);
}

export async function guardarPlanesEspeciales(planesEspeciales: PlanesEspeciales): Promise<void> {
  await setDoc(doc(getDb(), CONFIG, 'planesEspeciales'), planesEspeciales);
}

export async function guardarDia(datos: DatosDia): Promise<void> {
  const db = getDb();
  await setDoc(
    doc(db, DIARIOS, datos.fecha),
    { ...datos, timestamp: serverTimestamp() },
    { merge: true }
  );
}

export async function cargarDia(fecha: string): Promise<DatosDia | null> {
  const snap = await getDoc(doc(getDb(), DIARIOS, fecha));
  return snap.exists() ? (snap.data() as DatosDia) : null;
}

function rangoMes(fechaStr: string): { start: string; end: string } {
  const [year, month] = fechaStr.split('-').map(Number);
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  return { start, end };
}

async function sumarDespachosRango(start: string, end: string): Promise<number> {
  const db = getDb();
  const q = query(collection(db, DIARIOS), where('fecha', '>=', start), where('fecha', '<=', end));
  const snap = await getDocs(q);
  let total = 0;
  snap.forEach((d) => { total += totalDia((d.data().despachos as DatosDia['despachos']) || []); });
  return total;
}

export async function acumuladoMes(fechaStr: string): Promise<number> {
  const { start, end } = rangoMes(fechaStr);
  return sumarDespachosRango(start, end);
}

export async function acumuladoMesAnterior(fechaStr: string): Promise<number> {
  const fecha = new Date(fechaStr);
  fecha.setMonth(fecha.getMonth() - 1);
  const start = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-01`;
  const end = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).toISOString().slice(0, 10);
  return sumarDespachosRango(start, end);
}

export interface PuntoEvolucion { label: string; real: number; plan: number; }

export async function ultimos7Dias(
  fechaStr: string,
  planSemanal: PlanSemanal,
  planesEspeciales: PlanesEspeciales,
  planDiarioFn: (f: string, ps: PlanSemanal, pe: PlanesEspeciales) => number
): Promise<PuntoEvolucion[]> {
  const fecha = new Date(fechaStr);
  const dias: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(fecha);
    d.setDate(fecha.getDate() - i);
    dias.push(d.toISOString().slice(0, 10));
  }
  const puntos: PuntoEvolucion[] = [];
  for (const f of dias) {
    const dia = await cargarDia(f);
    const real = dia ? totalDia(dia.despachos || []) : 0;
    puntos.push({ label: f.slice(5), real, plan: planDiarioFn(f, planSemanal, planesEspeciales) });
  }
  return puntos;
}
