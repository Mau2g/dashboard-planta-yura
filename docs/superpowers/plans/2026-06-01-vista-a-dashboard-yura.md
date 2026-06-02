# Vista A — Dashboard Planta Yura Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir el dashboard `index.html` de la Planta Yura como app SvelteKit (Svelte 5 + runes), con paridad 1:1 de campos y cálculos, mismo backend Firebase Firestore, mejor arquitectura y UX.

**Architecture:** SvelteKit SPA estática (`adapter-static`), Firebase Firestore client-side intacto (proyecto `lluvias-18b0b`, colecciones `planta_datos_diarios` y `planta_config`). Lógica de cálculo aislada en funciones puras testeables (`calc.ts`); acceso a Firestore encapsulado en `repo.ts`; estado reactivo con runes; tres rutas (`/`, `/registro`, `/config`) bajo un layout común.

**Tech Stack:** SvelteKit, Svelte 5 (runes), TypeScript, Vite, Tailwind CSS v4, Chart.js v4, Firebase Web SDK v9+ (modular), Vitest, `@sveltejs/adapter-static`.

**Nota de referencia:** El archivo fuente `index.html` está en la raíz del proyecto. Consúltalo para verificar paridad exacta de textos, listas y comportamiento.

---

## File Structure

```
src/
  app.css                 # directivas Tailwind + tokens tema Yura
  lib/
    constants.ts          # MAQUINAS, TEMPORALES, TIPOS_DEFECTO, DIAS_SEMANA
    types.ts              # interfaces: DatosDia, Maquina, Temporal, Compuerta, Vehiculos, Config, etc.
    calc.ts               # funciones puras (rendimiento, utilizacion, participaciones, planDiario...)
    calc.test.ts          # tests Vitest de calc.ts
    firebase.ts           # init Firebase app + Firestore (browser-only)
    repo.ts               # API tipada sobre Firestore
    components/
      SectionCard.svelte
      KPICard.svelte
      StatusBadge.svelte
      Toast.svelte
      ChartCanvas.svelte
  routes/
    +layout.svelte        # header Yura + barra fecha + nav
    +layout.ts            # export const ssr=false, prerender=false (SPA)
    +page.svelte          # dashboard KPIs
    registro/+page.svelte # registro diario
    config/+page.svelte   # configuración
static/
svelte.config.js          # adapter-static + fallback SPA
```

---

## Task 1: Scaffold del proyecto SvelteKit

**Files:**
- Create: todo el esqueleto SvelteKit en la raíz del proyecto.
- Modify: `svelte.config.js`, `package.json`.

- [ ] **Step 1: Inicializar git**

Run:
```bash
git init
git add docs && git commit -m "chore: spec y plan Vista A"
```

- [ ] **Step 2: Scaffold SvelteKit (minimal + TS) en la raíz**

Run:
```bash
npx sv create . --template minimal --types ts --no-add-ons
```
Si pregunta por directorio no vacío, aceptar continuar. Expected: crea `src/`, `package.json`, `svelte.config.js`, `vite.config.ts`.

- [ ] **Step 3: Añadir Tailwind y Vitest vía sv add**

Run:
```bash
npx sv add tailwindcss vitest --no-install
npm install
```
Expected: `app.css` con directivas Tailwind, config de Vitest creada, dependencias instaladas.

- [ ] **Step 4: Instalar dependencias del proyecto**

Run:
```bash
npm install firebase chart.js
npm install -D @sveltejs/adapter-static
```
Expected: instaladas sin errores.

- [ ] **Step 5: Configurar adapter-static (SPA) en `svelte.config.js`**

Reemplazar el contenido por:
```js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ fallback: 'index.html' })
  }
};

export default config;
```

- [ ] **Step 6: Verificar build y dev**

Run:
```bash
npm run build
```
Expected: build correcto sin errores. (Si `npm run dev` se usa para verificación manual, Ctrl+C para salir.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold SvelteKit + Tailwind + Vitest + adapter-static"
```

---

## Task 2: Tipos y constantes

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/constants.ts`

- [ ] **Step 1: Crear `src/lib/types.ts`**

```ts
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
```

- [ ] **Step 2: Crear `src/lib/constants.ts`**

(Valores idénticos a `index.html`.)
```ts
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
```

- [ ] **Step 3: Verificar typecheck**

Run:
```bash
npm run check
```
Expected: sin errores de tipos.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/constants.ts
git commit -m "feat: tipos y constantes (paridad index.html)"
```

---

## Task 3: Funciones de cálculo puras (TDD)

**Files:**
- Create: `src/lib/calc.ts`
- Test: `src/lib/calc.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Crear `src/lib/calc.test.ts`:
```ts
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
```

- [ ] **Step 2: Ejecutar tests para verificar que fallan**

Run:
```bash
npx vitest run src/lib/calc.test.ts
```
Expected: FAIL (no existe `./calc`).

- [ ] **Step 3: Implementar `src/lib/calc.ts`**

```ts
import { DIA_POR_INDICE } from './constants';
import type { DespachoLinea, Vehiculos, PlanSemanal, PlanesEspeciales } from './types';

export function rendimiento(ratioECS: number, ratioIdeal: number): number {
  if (!ratioIdeal) return 0;
  return (ratioECS / ratioIdeal) * 100;
}

export function utilizacion(horas: number): number {
  return (horas / 24) * 100;
}

export function porcentajeLleno(inventario: number, capacidad: number): number {
  if (!capacidad) return 0;
  return (inventario / capacidad) * 100;
}

export function totalDia(despachos: DespachoLinea[]): number {
  return despachos.reduce((s, d) => s + (Number(d.tm) || 0), 0);
}

export interface Participacion { tipo: string; tm: number; pct: number; destacado: boolean; }

export function participaciones(despachos: DespachoLinea[]): Participacion[] {
  const total = totalDia(despachos);
  return despachos.map((d) => {
    const tm = Number(d.tm) || 0;
    const pct = total ? (tm / total) * 100 : 0;
    return { tipo: d.tipo, tm, pct, destacado: pct > 10 };
  });
}

export function totalVehiculos(v: Vehiculos): number {
  return (Number(v.llamado) || 0) + (Number(v.proceso) || 0) + (Number(v.playa) || 0);
}

export function rendimientoPromedio(maquinas: { ratioECS: number; ratioIdeal: number }[]): number {
  if (!maquinas.length) return 0;
  const sum = maquinas.reduce((s, m) => s + rendimiento(m.ratioECS, m.ratioIdeal), 0);
  return sum / maquinas.length;
}

export function planDiario(fechaStr: string, planSemanal: PlanSemanal, planesEspeciales: PlanesEspeciales): number {
  if (planesEspeciales[fechaStr] !== undefined) return planesEspeciales[fechaStr];
  const fecha = new Date(fechaStr);
  const dia = DIA_POR_INDICE[fecha.getDay()];
  return planSemanal[dia] || 0;
}
```

- [ ] **Step 4: Ejecutar tests para verificar que pasan**

Run:
```bash
npx vitest run src/lib/calc.test.ts
```
Expected: PASS (todos).

- [ ] **Step 5: Commit**

```bash
git add src/lib/calc.ts src/lib/calc.test.ts
git commit -m "feat: funciones de cálculo puras con tests (TDD)"
```

---

## Task 4: Capa Firebase + repositorio

**Files:**
- Create: `src/lib/firebase.ts`
- Create: `src/lib/repo.ts`

- [ ] **Step 1: Crear `src/lib/firebase.ts`**

(Misma config que `index.html`. SDK modular, solo navegador.)
```ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyC_fR_JLDFh8wAoNo6hMcyhg_N8Ra2_oaI',
  authDomain: 'lluvias-18b0b.firebaseapp.com',
  projectId: 'lluvias-18b0b',
  storageBucket: 'lluvias-18b0b.firebasestorage.app',
  messagingSenderId: '925381909831',
  appId: '1:925381909831:web:75e917c153c2f0db9f8062'
};

let app: FirebaseApp;
let dbInstance: Firestore;

export function getDb(): Firestore {
  if (!dbInstance) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
  }
  return dbInstance;
}
```

- [ ] **Step 2: Crear `src/lib/repo.ts`**

```ts
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
```

- [ ] **Step 3: Verificar typecheck**

Run:
```bash
npm run check
```
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/lib/firebase.ts src/lib/repo.ts
git commit -m "feat: capa Firebase y repositorio tipado"
```

---

## Task 5: Tema Tailwind + layout base

**Files:**
- Modify: `src/app.css`
- Create: `src/routes/+layout.ts`
- Modify/Create: `src/routes/+layout.svelte`

- [ ] **Step 1: Añadir tokens del tema Yura en `src/app.css`**

Tras la línea `@import 'tailwindcss';` existente, añadir:
```css
@theme {
  --color-yura: #034694;
  --color-yura-dark: #022d66;
}

body { background: #f0f2f5; color: #1e293b; }
```

- [ ] **Step 2: Forzar modo SPA en `src/routes/+layout.ts`**

```ts
export const ssr = false;
export const prerender = false;
```

- [ ] **Step 3: Crear el layout `src/routes/+layout.svelte`**

```svelte
<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { fechaSeleccionada } from '$lib/stores';

  let { children } = $props();

  const tabs = [
    { href: '/registro', label: '📝 Registro Diario' },
    { href: '/', label: '📊 Dashboard KPIs' },
    { href: '/config', label: '⚙️ Configuración' }
  ];
</script>

<div class="mx-auto max-w-[1400px] overflow-hidden rounded-[28px] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.1)] my-5">
  <header class="bg-gradient-to-br from-yura to-yura-dark px-5 py-5 text-center text-white">
    <h1 class="flex items-center justify-center gap-2 text-2xl font-bold">🏭 Gestión Integral Planta Yura</h1>
    <div class="mt-3 flex flex-wrap justify-center gap-3">
      <input type="date" bind:value={$fechaSeleccionada}
        class="rounded-full border border-white bg-white/20 px-4 py-2 text-sm text-white" />
    </div>
  </header>

  <nav class="flex border-b border-slate-200 bg-slate-50">
    {#each tabs as t}
      <a href={t.href}
        class="flex-1 px-4 py-4 text-center font-semibold transition
          {$page.url.pathname === t.href ? 'border-b-[3px] border-yura bg-white text-yura' : 'text-slate-600'}">
        {t.label}
      </a>
    {/each}
  </nav>

  <div class="p-6">
    {@render children()}
  </div>
</div>
```

- [ ] **Step 4: Crear store de fecha compartida `src/lib/stores.ts`**

```ts
import { writable } from 'svelte/store';

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export const fechaSeleccionada = writable<string>(hoy());
```

- [ ] **Step 5: Verificar build**

Run:
```bash
npm run build
```
Expected: build correcto.

- [ ] **Step 6: Commit**

```bash
git add src/app.css src/routes/+layout.svelte src/routes/+layout.ts src/lib/stores.ts
git commit -m "feat: tema Yura, layout base y store de fecha"
```

---

## Task 6: Componentes reutilizables

**Files:**
- Create: `src/lib/components/SectionCard.svelte`
- Create: `src/lib/components/KPICard.svelte`
- Create: `src/lib/components/StatusBadge.svelte`
- Create: `src/lib/components/Toast.svelte`
- Create: `src/lib/components/ChartCanvas.svelte`

- [ ] **Step 1: `SectionCard.svelte`**

```svelte
<script lang="ts">
  let { title, children } = $props();
</script>

<section class="mb-8 overflow-hidden rounded-[20px] border border-slate-200 bg-white">
  <div class="border-b border-slate-200 bg-slate-100 px-5 py-3.5 font-bold text-yura">{title}</div>
  <div class="p-5">{@render children()}</div>
</section>
```

- [ ] **Step 2: `KPICard.svelte`**

```svelte
<script lang="ts">
  let { value, label } = $props();
</script>

<div class="rounded-[20px] border-l-4 border-yura bg-slate-50 p-4 text-center">
  <div class="text-3xl font-extrabold text-yura">{value}</div>
  <div class="text-xs text-slate-600">{label}</div>
</div>
```

- [ ] **Step 3: `StatusBadge.svelte`**

```svelte
<script lang="ts">
  let { estado } = $props(); // 'verde' | 'amarillo' | 'rojo'
  const colores: Record<string, string> = {
    verde: 'bg-green-500', amarillo: 'bg-yellow-500', rojo: 'bg-red-500'
  };
  const textos: Record<string, string> = {
    verde: 'Operativo', amarillo: 'En reparación', rojo: 'Avería reportada'
  };
</script>

<span class="inline-flex items-center gap-2">
  <span class="inline-block h-5 w-5 rounded-full {colores[estado] ?? 'bg-green-500'}"></span>
  {textos[estado] ?? 'Operativo'}
</span>
```

- [ ] **Step 4: `Toast.svelte` (store + componente)**

Crear `src/lib/components/toastStore.ts`:
```ts
import { writable } from 'svelte/store';

export interface ToastMsg { id: number; texto: string; error: boolean; }
export const toasts = writable<ToastMsg[]>([]);
let nextId = 1;

export function toast(texto: string, error = false): void {
  const id = nextId++;
  toasts.update((arr) => [...arr, { id, texto, error }]);
  setTimeout(() => toasts.update((arr) => arr.filter((t) => t.id !== id)), 3000);
}
```

Crear `src/lib/components/Toast.svelte`:
```svelte
<script lang="ts">
  import { toasts } from './toastStore';
</script>

<div class="fixed bottom-5 left-5 right-5 z-[1000] flex flex-col gap-2">
  {#each $toasts as t (t.id)}
    <div class="rounded-full px-4 py-3 text-center text-white {t.error ? 'bg-red-700' : 'bg-yura'}">
      {t.texto}
    </div>
  {/each}
</div>
```

- [ ] **Step 5: `ChartCanvas.svelte`**

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import type { PuntoEvolucion } from '$lib/repo';

  Chart.register(...registerables);

  let { puntos } = $props<{ puntos: PuntoEvolucion[] }>();
  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  function render() {
    if (!canvas) return;
    if (chart) chart.destroy();
    chart = new Chart(canvas.getContext('2d')!, {
      type: 'bar',
      data: {
        labels: puntos.map((p) => p.label),
        datasets: [
          { label: 'Despacho real (TM)', data: puntos.map((p) => p.real), backgroundColor: '#034694' },
          { label: 'Plan diario (TM)', data: puntos.map((p) => p.plan), type: 'line',
            borderColor: '#eab308', borderDash: [5, 5], fill: false, tension: 0.1 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: true }
    });
  }

  onMount(render);
  $effect(() => { puntos; render(); });
  onDestroy(() => chart?.destroy());
</script>

<canvas bind:this={canvas} class="max-h-[300px]"></canvas>
```

- [ ] **Step 6: Verificar build**

Run:
```bash
npm run build
```
Expected: build correcto.

- [ ] **Step 7: Commit**

```bash
git add src/lib/components
git commit -m "feat: componentes reutilizables (SectionCard, KPICard, StatusBadge, Toast, ChartCanvas)"
```

---

## Task 7: Página Registro Diario

**Files:**
- Create: `src/routes/registro/+page.svelte`

- [ ] **Step 1: Implementar `src/routes/registro/+page.svelte`**

(Reproduce todas las secciones del registro de `index.html`, con estado runes y guardado/cargado contra Firestore.)
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import SectionCard from '$lib/components/SectionCard.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { toast } from '$lib/components/toastStore';
  import { MAQUINAS, TEMPORALES } from '$lib/constants';
  import { rendimiento, utilizacion, porcentajeLleno, totalVehiculos } from '$lib/calc';
  import { getConfig, guardarDia, cargarDia, acumuladoMes } from '$lib/repo';
  import { fechaSeleccionada } from '$lib/stores';
  import type { MaquinaRegistro, Temporal, Compuerta, TipoCemento } from '$lib/types';

  let tipos = $state<TipoCemento[]>([]);
  let tmPorTipo = $state<number[]>([]);
  let maquinas = $state<MaquinaRegistro[]>(
    MAQUINAS.map((m) => ({ id: m.id, nombre: m.nombre, horasMaquina: 0, ratioECS: 0, ratioIdeal: m.ratioIdeal, comentario: '', averiaCritica: 'verde' }))
  );
  let temporales = $state<Temporal[]>(TEMPORALES.map((t) => ({ ...t })));
  let compuertas = $state<Compuerta[]>(Array.from({ length: 8 }, (_, i) => ({ numero: i + 1, horas: 0, comentario: '' })));
  let vehiculos = $state({ llamado: 0, proceso: 0, playa: 0 });
  let acumuladoAjuste = $state(0);
  let comentarioGeneral = $state('');
  let acumuladoMesValor = $state(0);

  const totalVeh = $derived(totalVehiculos(vehiculos));
  const acumuladoConAjuste = $derived(acumuladoMesValor + (Number(acumuladoAjuste) || 0));

  onMount(async () => {
    const cfg = await getConfig();
    tipos = cfg.tiposCemento;
    tmPorTipo = tipos.map(() => 0);
    await recargar();
  });

  async function recargar() {
    const fecha = get(fechaSeleccionada);
    acumuladoMesValor = await acumuladoMes(fecha);
    const dia = await cargarDia(fecha);
    if (!dia) return;
    if (dia.despachos) {
      tmPorTipo = tipos.map((t) => {
        const d = dia.despachos.find((x) => x.tipo === t.nombre);
        return d ? d.tm : 0;
      });
    }
    if (dia.maquinas) maquinas = MAQUINAS.map((m) => {
      const r = dia.maquinas.find((x) => x.id === m.id);
      return r ? { ...r } : { id: m.id, nombre: m.nombre, horasMaquina: 0, ratioECS: 0, ratioIdeal: m.ratioIdeal, comentario: '', averiaCritica: 'verde' };
    });
    if (dia.temporales) temporales = TEMPORALES.map((t) => {
      const r = dia.temporales.find((x) => x.nombre === t.nombre);
      return { ...t, inventario: r ? r.inventario : 0 };
    });
    if (dia.compuertas) compuertas = compuertas.map((c) => {
      const r = dia.compuertas.find((x) => x.numero === c.numero);
      return r ? { ...r } : c;
    });
    if (dia.vehiculos) vehiculos = { ...dia.vehiculos };
    acumuladoAjuste = dia.acumuladoAjuste || 0;
    comentarioGeneral = dia.comentarioGeneral || '';
  }

  function agregarTipo() { tipos = [...tipos, { nombre: 'Nuevo tipo' }]; tmPorTipo = [...tmPorTipo, 0]; }
  function eliminarTipo(idx: number) {
    tipos = tipos.filter((_, i) => i !== idx);
    tmPorTipo = tmPorTipo.filter((_, i) => i !== idx);
  }

  async function guardar() {
    const fecha = get(fechaSeleccionada);
    if (!fecha) return toast('Seleccione una fecha', true);
    await guardarDia({
      fecha,
      despachos: tipos.map((t, i) => ({ tipo: t.nombre, tm: Number(tmPorTipo[i]) || 0 })),
      maquinas: $state.snapshot(maquinas),
      temporales: $state.snapshot(temporales),
      compuertas: $state.snapshot(compuertas),
      vehiculos: $state.snapshot(vehiculos),
      acumuladoAjuste: Number(acumuladoAjuste) || 0,
      comentarioGeneral
    });
    toast(`Datos guardados para ${fecha}`);
    acumuladoMesValor = await acumuladoMes(fecha);
  }

  async function cargar() {
    await recargar();
    toast(`Datos cargados para ${get(fechaSeleccionada)}`);
  }
</script>

<Toast />

<SectionCard title="🚚 Despacho por tipo de cemento (TM)">
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead><tr class="bg-slate-100">
        <th class="border-b border-slate-200 p-2 text-left">Tipo de cemento</th>
        <th class="border-b border-slate-200 p-2 text-left">TM despachadas</th>
        <th class="border-b border-slate-200 p-2"></th>
      </tr></thead>
      <tbody>
        {#each tipos as tipo, idx}
          <tr>
            <td class="border-b border-slate-200 p-2"><input class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={tipo.nombre} /></td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="0.01" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={tmPorTipo[idx]} /></td>
            <td class="border-b border-slate-200 p-2">
              <button class="rounded bg-slate-200 px-2 py-1" onclick={() => eliminarTipo(idx)}>🗑️</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <button class="mt-2.5 rounded-full bg-slate-200 px-4 py-2 font-bold" onclick={agregarTipo}>➕ Agregar tipo</button>
</SectionCard>

<SectionCard title="🏬 Inventario en Temporales">
  {#each temporales as temp}
    <div class="mb-4 flex flex-wrap items-center gap-5">
      <div class="flex-[2]"><strong>{temp.nombre}</strong><br />Capacidad: {temp.capacidad} TM</div>
      <div class="flex-1">
        <label class="block text-sm">Inventario actual (TM):</label>
        <input type="number" step="0.01" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={temp.inventario} />
      </div>
      <div class="flex-1">% lleno: {porcentajeLleno(temp.inventario, temp.capacidad).toFixed(1)}%</div>
    </div>
  {/each}
</SectionCard>

<SectionCard title="⚙️ Máquinas embolsadoras (H1-H5, Ventomatic)">
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead><tr class="bg-slate-100 text-left">
        <th class="p-2">Máquina</th><th class="p-2">Horas</th><th class="p-2">Ratio ECS</th><th class="p-2">Ratio Ideal</th>
        <th class="p-2">Rend. (%)</th><th class="p-2">Util. (%)</th><th class="p-2">Comentario</th><th class="p-2">Estado</th>
      </tr></thead>
      <tbody>
        {#each maquinas as m}
          <tr>
            <td class="border-b border-slate-200 p-2">{m.nombre}</td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="0.01" class="w-24 rounded-xl border border-slate-300 px-2 py-1" bind:value={m.horasMaquina} /></td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="1" class="w-24 rounded-xl border border-slate-300 px-2 py-1" bind:value={m.ratioECS} /></td>
            <td class="border-b border-slate-200 p-2">{m.ratioIdeal}</td>
            <td class="border-b border-slate-200 p-2">{rendimiento(m.ratioECS, m.ratioIdeal).toFixed(1)}%</td>
            <td class="border-b border-slate-200 p-2">{utilizacion(m.horasMaquina).toFixed(1)}%</td>
            <td class="border-b border-slate-200 p-2"><input class="w-36 rounded-xl border border-slate-300 px-2 py-1" bind:value={m.comentario} /></td>
            <td class="border-b border-slate-200 p-2">
              <select class="rounded-xl border border-slate-300 px-2 py-1" bind:value={m.averiaCritica}>
                <option value="verde">🟢 Operativo</option>
                <option value="amarillo">🟡 En reparación</option>
                <option value="rojo">🔴 Avería reportada</option>
              </select>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</SectionCard>

<SectionCard title="🗄️ Silo 8 - Compuertas">
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead><tr class="bg-slate-100 text-left"><th class="p-2">Compuerta</th><th class="p-2">Horas trabajadas</th><th class="p-2">Comentario</th></tr></thead>
      <tbody>
        {#each compuertas as c}
          <tr>
            <td class="border-b border-slate-200 p-2">Compuerta {c.numero}</td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="0.5" class="w-24 rounded-xl border border-slate-300 px-2 py-1" bind:value={c.horas} /></td>
            <td class="border-b border-slate-200 p-2"><input class="w-full rounded-xl border border-slate-300 px-2 py-1" bind:value={c.comentario} placeholder="falla/chuceada/normal" /></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</SectionCard>

<SectionCard title="🚗 Vehículos en planta">
  <div class="flex flex-wrap items-end gap-5">
    <div class="flex-1"><label class="block text-sm">En llamado:</label><input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={vehiculos.llamado} /></div>
    <div class="flex-1"><label class="block text-sm">En proceso:</label><input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={vehiculos.proceso} /></div>
    <div class="flex-1"><label class="block text-sm">En playa:</label><input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={vehiculos.playa} /></div>
    <div class="flex-1"><strong>Total: {totalVeh}</strong></div>
  </div>
</SectionCard>

<SectionCard title="📈 Acumulado del mes y observaciones">
  <div class="flex flex-wrap items-end gap-5">
    <div class="flex-1">
      <label class="block text-sm">Acumulado del mes (TM) - automático:</label>
      <input type="number" readonly class="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2" value={acumuladoConAjuste.toFixed(2)} />
    </div>
    <div class="flex-1">
      <label class="block text-sm">Ajuste manual:</label>
      <input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={acumuladoAjuste} />
    </div>
  </div>
  <div class="mt-4">
    <label class="block text-sm">Comentario técnico general del día:</label>
    <textarea rows="2" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={comentarioGeneral} placeholder="Observaciones, incidencias, etc."></textarea>
  </div>
</SectionCard>

<div class="mt-5 flex justify-end gap-4">
  <button class="rounded-full bg-yura px-6 py-3 font-bold text-white" onclick={guardar}>💾 Guardar datos del día</button>
  <button class="rounded-full bg-slate-200 px-6 py-3 font-bold" onclick={cargar}>⬇️ Cargar datos de fecha</button>
</div>
```

- [ ] **Step 2: Verificar build**

Run:
```bash
npm run build
```
Expected: build correcto.

- [ ] **Step 3: Commit**

```bash
git add src/routes/registro/+page.svelte
git commit -m "feat: página Registro Diario (paridad index.html)"
```

---

## Task 8: Página Dashboard KPIs

**Files:**
- Create: `src/routes/+page.svelte`

- [ ] **Step 1: Implementar `src/routes/+page.svelte`**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import SectionCard from '$lib/components/SectionCard.svelte';
  import KPICard from '$lib/components/KPICard.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import ChartCanvas from '$lib/components/ChartCanvas.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { toast } from '$lib/components/toastStore';
  import {
    totalDia, participaciones, rendimiento, rendimientoPromedio, planDiario
  } from '$lib/calc';
  import {
    getConfig, cargarDia, acumuladoMes, acumuladoMesAnterior, ultimos7Dias,
    type PuntoEvolucion, type ConfigCompleta
  } from '$lib/repo';
  import { fechaSeleccionada } from '$lib/stores';
  import type { DatosDia } from '$lib/types';

  let cargando = $state(true);
  let sinDatos = $state(false);
  let cfg = $state<ConfigCompleta | null>(null);
  let dia = $state<DatosDia | null>(null);
  let acumMes = $state(0);
  let vsMesAnt = $state<string>('N/D');
  let puntos = $state<PuntoEvolucion[]>([]);

  const total = $derived(dia ? totalDia(dia.despachos || []) : 0);
  const partis = $derived(dia ? participaciones(dia.despachos || []) : []);
  const pctPlan = $derived.by(() => {
    const pm = cfg?.planes.planMensual || 0;
    return pm ? ((total / pm) * 100).toFixed(1) + '%' : 'N/D';
  });
  const rendProm = $derived(dia ? rendimientoPromedio((dia.maquinas || []).map((m) => ({ ratioECS: m.ratioECS, ratioIdeal: m.ratioIdeal }))).toFixed(1) : '0');

  onMount(load);
  $effect(() => { $fechaSeleccionada; load(); });

  async function load() {
    cargando = true; sinDatos = false;
    const fecha = get(fechaSeleccionada);
    if (!cfg) cfg = await getConfig();
    dia = await cargarDia(fecha);
    if (!dia) { sinDatos = true; cargando = false; return; }
    acumMes = await acumuladoMes(fecha);
    const ant = await acumuladoMesAnterior(fecha);
    vsMesAnt = ant ? ((acumMes - ant) / ant * 100).toFixed(1) + '%' : 'N/D';
    puntos = await ultimos7Dias(fecha, cfg.planSemanal, cfg.planesEspeciales, planDiario);
    cargando = false;
  }
</script>

<Toast />

{#if cargando}
  <p class="p-6 text-center text-slate-500">Cargando…</p>
{:else if sinDatos}
  <p class="p-6 text-center text-slate-500">No hay datos para {$fechaSeleccionada}. Registra el día primero.</p>
{:else}
  <div class="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
    <KPICard value={`${total.toFixed(2)} TM`} label="Despacho del día" />
    <KPICard value={pctPlan} label="vs Plan Mensual" />
    <KPICard value={`${acumMes.toFixed(2)} TM`} label="Acumulado Mes" />
    <KPICard value={vsMesAnt} label="vs Mes Anterior" />
    <KPICard value={`${rendProm}%`} label="Rendimiento Promedio Máquinas" />
  </div>

  <SectionCard title="📊 Despachos del día (TM) – alta demanda destacada (>10%)">
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead><tr class="bg-slate-100 text-left"><th class="p-2">Tipo de cemento</th><th class="p-2">TM</th><th class="p-2">% participación</th></tr></thead>
        <tbody>
          {#each partis as p}
            <tr class={p.destacado ? 'bg-[#fff3cd] font-bold text-[#b85c00]' : ''}>
              <td class="border-b border-slate-200 p-2">{p.tipo}</td>
              <td class="border-b border-slate-200 p-2">{p.tm.toFixed(2)}</td>
              <td class="border-b border-slate-200 p-2">{p.pct.toFixed(1)}%</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <div class="mt-4"><strong>Acumulado del mes:</strong> {acumMes.toFixed(2)} TM</div>
  </SectionCard>

  <SectionCard title="📈 Evolución últimos 7 días (despacho total) vs Plan diario">
    <ChartCanvas {puntos} />
  </SectionCard>

  <SectionCard title="🔬 Resumen máquinas (rendimiento y estado)">
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead><tr class="bg-slate-100 text-left"><th class="p-2">Máquina</th><th class="p-2">Horas</th><th class="p-2">Ratio ECS</th><th class="p-2">Rendimiento</th><th class="p-2">Estado</th></tr></thead>
        <tbody>
          {#each dia.maquinas || [] as m}
            <tr>
              <td class="border-b border-slate-200 p-2">{m.nombre}</td>
              <td class="border-b border-slate-200 p-2">{m.horasMaquina}</td>
              <td class="border-b border-slate-200 p-2">{m.ratioECS}</td>
              <td class="border-b border-slate-200 p-2">{rendimiento(m.ratioECS, m.ratioIdeal).toFixed(1)}%</td>
              <td class="border-b border-slate-200 p-2"><StatusBadge estado={m.averiaCritica} /></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </SectionCard>

  <SectionCard title="🗄️ Resumen Silo 8 - Horas por compuerta">
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead><tr class="bg-slate-100 text-left"><th class="p-2">Compuerta</th><th class="p-2">Horas trabajadas</th><th class="p-2">Comentario</th></tr></thead>
        <tbody>
          {#each dia.compuertas || [] as c}
            <tr>
              <td class="border-b border-slate-200 p-2">Compuerta {c.numero}</td>
              <td class="border-b border-slate-200 p-2">{c.horas}</td>
              <td class="border-b border-slate-200 p-2">{c.comentario || '-'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </SectionCard>
{/if}
```

- [ ] **Step 2: Verificar build**

Run:
```bash
npm run build
```
Expected: build correcto.

- [ ] **Step 3: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: página Dashboard KPIs (paridad index.html)"
```

---

## Task 9: Página Configuración

**Files:**
- Create: `src/routes/config/+page.svelte`

- [ ] **Step 1: Implementar `src/routes/config/+page.svelte`**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import SectionCard from '$lib/components/SectionCard.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { toast } from '$lib/components/toastStore';
  import { MAQUINAS, TEMPORALES, DIAS_SEMANA } from '$lib/constants';
  import {
    getConfig, guardarTiposYPlanes, guardarPlanSemanal, guardarPlanesEspeciales
  } from '$lib/repo';
  import type { TipoCemento, PlanSemanal, PlanesEspeciales } from '$lib/types';

  let tipos = $state<TipoCemento[]>([]);
  let planMensual = $state(0);
  let planAnual = $state(0);
  let planSemanal = $state<PlanSemanal>({});
  let planesEspeciales = $state<PlanesEspeciales>({});
  let nuevaFecha = $state('');
  let nuevoValor = $state<number | null>(null);

  const fechasEsp = $derived(Object.keys(planesEspeciales).sort());

  onMount(async () => {
    const cfg = await getConfig();
    tipos = cfg.tiposCemento;
    planMensual = cfg.planes.planMensual;
    planAnual = cfg.planes.planAnual;
    planSemanal = { ...cfg.planSemanal };
    planesEspeciales = { ...cfg.planesEspeciales };
    for (const d of DIAS_SEMANA) if (planSemanal[d] === undefined) planSemanal[d] = 0;
  });

  async function guardarTipos() {
    await guardarTiposYPlanes($state.snapshot(tipos), { planMensual: Number(planMensual) || 0, planAnual: Number(planAnual) || 0 });
    toast('Planes y tipos guardados correctamente');
  }
  async function guardarSemanal() { await guardarPlanSemanal($state.snapshot(planSemanal)); toast('Plan semanal guardado'); }
  function agregarEspecial() {
    if (!nuevaFecha || nuevoValor === null || isNaN(Number(nuevoValor))) return toast('Seleccione fecha y valor válido', true);
    planesEspeciales = { ...planesEspeciales, [nuevaFecha]: Number(nuevoValor) };
    nuevaFecha = ''; nuevoValor = null;
    toast('Plan especial agregado (aún no guardado en BD)');
  }
  function eliminarEspecial(fecha: string) {
    const { [fecha]: _, ...resto } = planesEspeciales;
    planesEspeciales = resto;
  }
  async function guardarEspeciales() { await guardarPlanesEspeciales($state.snapshot(planesEspeciales)); toast('Planes especiales guardados'); }
  function agregarTipo() { tipos = [...tipos, { nombre: 'Nuevo tipo' }]; }
  function eliminarTipo(idx: number) { tipos = tipos.filter((_, i) => i !== idx); }
</script>

<Toast />

<SectionCard title="📅 Plan diario por día de semana (TM)">
  <div class="flex flex-wrap gap-4">
    {#each DIAS_SEMANA as dia}
      <div class="min-w-[120px]">
        <label class="block text-sm">{dia}:</label>
        <input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={planSemanal[dia]} />
      </div>
    {/each}
  </div>
  <button class="mt-2.5 rounded-full bg-yura px-4 py-2 font-bold text-white" onclick={guardarSemanal}>💾 Guardar plan semanal</button>
</SectionCard>

<SectionCard title="📆 Plan especial para fecha específica">
  <div class="flex flex-wrap items-end gap-5">
    <div class="flex-1"><label class="block text-sm">Fecha:</label><input type="date" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={nuevaFecha} /></div>
    <div class="flex-1"><label class="block text-sm">Plan especial (TM):</label><input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={nuevoValor} /></div>
    <div><button class="rounded-full bg-slate-200 px-4 py-2 font-bold" onclick={agregarEspecial}>Agregar/Actualizar</button></div>
  </div>
  <div class="mt-4">
    {#if fechasEsp.length === 0}
      <p>No hay planes especiales definidos.</p>
    {:else}
      <table class="w-full border-collapse">
        <thead><tr class="bg-slate-100 text-left"><th class="p-2">Fecha</th><th class="p-2">Plan especial (TM)</th><th class="p-2"></th></tr></thead>
        <tbody>
          {#each fechasEsp as f}
            <tr>
              <td class="border-b border-slate-200 p-2">{f}</td>
              <td class="border-b border-slate-200 p-2"><input type="number" class="w-32 rounded-xl border border-slate-300 px-2 py-1" bind:value={planesEspeciales[f]} /></td>
              <td class="border-b border-slate-200 p-2"><button class="rounded bg-slate-200 px-2 py-1" onclick={() => eliminarEspecial(f)}>🗑️</button></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
  <button class="mt-2.5 rounded-full bg-yura px-4 py-2 font-bold text-white" onclick={guardarEspeciales}>Guardar todos los planes especiales</button>
</SectionCard>

<SectionCard title="🗓️ Planes mensual y anual">
  <div class="flex flex-wrap items-end gap-5">
    <div class="flex-1"><label class="block text-sm">Plan mensual (TM):</label><input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={planMensual} /></div>
    <div class="flex-1"><label class="block text-sm">Plan anual (TM):</label><input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={planAnual} /></div>
  </div>
  <button class="mt-2.5 rounded-full bg-yura px-4 py-2 font-bold text-white" onclick={guardarTipos}>💾 Guardar planes</button>
</SectionCard>

<SectionCard title="📋 Tipos de cemento (lista maestra)">
  {#each tipos as tipo, idx}
    <div class="mb-2 flex items-center gap-4">
      <input class="flex-[4] rounded-xl border border-slate-300 px-3 py-2" bind:value={tipo.nombre} />
      <button class="rounded bg-slate-200 px-3 py-1.5" onclick={() => eliminarTipo(idx)}>Eliminar</button>
    </div>
  {/each}
  <button class="mr-2 mt-2.5 rounded-full bg-slate-200 px-4 py-2 font-bold" onclick={agregarTipo}>➕ Agregar nuevo tipo</button>
  <button class="mt-2.5 rounded-full bg-yura px-4 py-2 font-bold text-white" onclick={guardarTipos}>💾 Guardar lista de tipos</button>
</SectionCard>

<SectionCard title="ℹ️ Datos fijos del sistema">
  <p><strong>Capacidades de temporales (fijas):</strong></p>
  <ul class="ml-6 list-disc">
    {#each TEMPORALES as t}<li>{t.nombre}: {t.capacidad} TM</li>{/each}
  </ul>
  <p class="mt-3"><strong>Ratios ideales de máquinas (fijos):</strong></p>
  <ul class="ml-6 list-disc">
    {#each MAQUINAS as m}<li>{m.nombre}: Ratio Ideal = {m.ratioIdeal}</li>{/each}
  </ul>
  <p class="mt-2 text-sm text-slate-500">Estos valores están predefinidos y no se pueden modificar desde la interfaz.</p>
</SectionCard>
```

- [ ] **Step 2: Verificar build**

Run:
```bash
npm run build
```
Expected: build correcto.

- [ ] **Step 3: Commit**

```bash
git add src/routes/config/+page.svelte
git commit -m "feat: página Configuración (paridad index.html)"
```

---

## Task 10: Verificación final e índice

**Files:**
- Delete: `src/routes/page.svelte.test.ts` y `src/demo.spec.ts` si el scaffold los creó.
- Create: `README.md`

- [ ] **Step 1: Ejecutar toda la suite de tests**

Run:
```bash
npx vitest run
```
Expected: PASS (tests de `calc.test.ts`). Eliminar tests demo del scaffold si fallan o sobran.

- [ ] **Step 2: Typecheck + build completos**

Run:
```bash
npm run check && npm run build
```
Expected: sin errores.

- [ ] **Step 3: Verificación manual en navegador**

Run:
```bash
npm run preview
```
Verificar (abrir la URL local):
- `/registro`: editar despachos/máquinas/temporales/compuertas/vehículos, guardar y recargar la fecha → los datos persisten en Firestore.
- `/`: KPIs, tabla de participación con destacado >10%, gráfico 7 días, resúmenes.
- `/config`: editar y guardar plan semanal/especiales/mensual-anual/tipos.
Ctrl+C para salir.

- [ ] **Step 4: Crear `README.md`**

```markdown
# Dashboard Planta Yura — Vista A (SvelteKit)

Port fiel del `index.html` original a SvelteKit (Svelte 5 + runes), con backend
Firebase Firestore intacto (proyecto `lluvias-18b0b`).

## Desarrollo
- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción (SPA estática)
- `npm run preview` — previsualizar el build
- `npx vitest run` — tests

## Rutas
- `/` Dashboard KPIs · `/registro` Registro Diario · `/config` Configuración
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: verificación final, limpieza de tests demo y README"
```

---

## Self-Review (completado por el autor del plan)

- **Cobertura del spec:** Registro/Dashboard/Config cubiertos (Tasks 7/8/9); Firebase intacto (Task 4); datos fijos (Task 2); cálculos con tests (Task 3); tema Yura + SPA estática (Tasks 1/5); componentes reutilizables (Task 6). ✅
- **Placeholders:** sin "TBD/TODO"; todo el código está escrito. ✅
- **Consistencia de tipos:** `DatosDia`, `MaquinaRegistro`, `ConfigCompleta`, `PuntoEvolucion` y firmas (`rendimiento`, `planDiario`, `ultimos7Dias`) coinciden entre tareas. ✅
- **Nota de verificación:** los tests de UI no se automatizan (alcance de tests = `calc.ts`, según spec); la UI se valida con build + preview manual en Task 10.
```
