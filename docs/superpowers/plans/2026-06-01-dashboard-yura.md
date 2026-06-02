# Dashboard Planta Yura "Operations Cockpit" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la app única del dashboard de la Planta Yura: captura manual completa (despacho con bolsas+TM, ventas, máquinas, temporales, Silo 8, vehículos, planes) y analítica (participación, familia, comparativa multi-anual, plan vs real) sobre Supabase, con un rediseño UX/UI "Operations Cockpit" responsive (móvil/tablet/escritorio) y modo claro/oscuro.

**Architecture:** SvelteKit (Svelte 5 + runes) como SPA estática. Backend Supabase (Postgres) con esquema relacional + vistas analíticas + seed real del Excel. Lógica de cálculo en funciones puras testeables (`calc.ts`). UI con sistema de diseño basado en tokens semánticos (light/dark), componentes reutilizables responsive, Chart.js e iconos Lucide. Navegación adaptativa: sidebar en escritorio, bottom-nav en móvil.

**Tech Stack:** SvelteKit, Svelte 5 (runes), TypeScript, Vite, `@sveltejs/adapter-static`, Tailwind CSS v4, `@supabase/supabase-js`, Chart.js v4, `lucide-svelte`, Vitest. Fuentes: Archivo (display), IBM Plex Sans (cuerpo), IBM Plex Mono (datos).

**No Firebase. Sin selector de vistas.** Rutas: `/` (dashboard), `/registro`, `/config`. **Paridad total con index.html** (incluida Configuración) + extensiones.

**Referencia:** `index.html` y los Excel en la raíz. Seed extraído de `02. Reporte Despacho Dia 2025v1 (004).xlsx` (hojas `21.05` y `Plan ventas 2026`).

---

## File Structure
```
src/
  app.html                 # script anti-flash de tema + preconnect fonts
  app.css                  # tokens light/dark, fuentes, blueprint, base
  lib/
    constants.ts           # MAQUINAS, TEMPORALES, DIAS_SEMANA
    types.ts               # interfaces de dominio
    calc.ts                # funciones puras (TDD)
    calc.test.ts
    theme.ts               # set/toggle/persist tema
    stores.ts              # fechaSeleccionada
    supabase/
      client.ts
      types.gen.ts
    repo.ts                # acceso tipado a Supabase
    components/
      KPICard.svelte
      CountUp.svelte
      Sparkline.svelte
      StatusBadge.svelte
      SectionCard.svelte
      ResponsiveTable.svelte
      Skeleton.svelte
      EmptyState.svelte
      Toast.svelte
      toastStore.ts
      ThemeToggle.svelte
      ChartCard.svelte
  routes/
    +layout.svelte         # AppShell: sidebar/topbar/bottom-nav + tema
    +layout.ts             # ssr=false, prerender=false
    +page.svelte           # dashboard
    registro/+page.svelte
    config/+page.svelte
supabase/migrations/{0001_schema,0002_views,0003_seed}.sql
.env / .env.example
```

---

## Task 1: Scaffold + sistema de diseño (tokens, fuentes, tema anti-flash)

**Files:** scaffold completo; `src/app.html`, `src/app.css`, `svelte.config.js`.

- [ ] **Step 1: Git init**

```bash
git init
git add docs && git commit -m "chore: spec y plan dashboard Yura"
```

- [ ] **Step 2: Scaffold SvelteKit + add-ons**

```bash
npx sv create . --template minimal --types ts --no-add-ons
npx sv add tailwindcss vitest --no-install
npm install
npm install @supabase/supabase-js chart.js lucide-svelte
npm install -D @sveltejs/adapter-static
```
Expected: proyecto creado, deps instaladas.

- [ ] **Step 3: adapter-static en `svelte.config.js`**

```js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: { adapter: adapter({ fallback: 'index.html' }) }
};
export default config;
```

- [ ] **Step 4: `src/app.html` (anti-flash de tema + preconnect fuentes)**

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#034694" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <script>
      try {
        var t = localStorage.getItem('theme') ||
          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.dataset.theme = t;
      } catch (e) {}
    </script>
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 5: `src/app.css` (tokens, fuentes, blueprint, base)**

```css
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
@import 'tailwindcss';

@theme inline {
  --color-primary: var(--c-primary);
  --color-on-primary: var(--c-on-primary);
  --color-secondary: var(--c-secondary);
  --color-accent: var(--c-accent);
  --color-bg: var(--c-bg);
  --color-surface: var(--c-surface);
  --color-surface-2: var(--c-surface-2);
  --color-ink: var(--c-ink);
  --color-muted-ink: var(--c-muted-ink);
  --color-border: var(--c-border);
  --color-success: var(--c-success);
  --color-warning: var(--c-warning);
  --color-danger: var(--c-danger);
  --font-display: 'Archivo', sans-serif;
  --font-sans: 'IBM Plex Sans', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}

:root {
  --c-primary:#034694; --c-on-primary:#ffffff; --c-secondary:#2563eb; --c-accent:#d97706;
  --c-bg:#f6f8fb; --c-surface:#ffffff; --c-surface-2:#f1f5f9; --c-ink:#0f172a;
  --c-muted-ink:#64748b; --c-border:#e2e8f0; --c-success:#16a34a; --c-warning:#d97706; --c-danger:#dc2626;
}
[data-theme='dark'] {
  --c-primary:#3b82f6; --c-on-primary:#0b1220; --c-secondary:#60a5fa; --c-accent:#f59e0b;
  --c-bg:#0b1220; --c-surface:#111a2e; --c-surface-2:#16213a; --c-ink:#e2e8f0;
  --c-muted-ink:#94a3b8; --c-border:#23304b; --c-success:#22c55e; --c-warning:#f59e0b; --c-danger:#f87171;
}

html { font-family: var(--font-sans); }
body { background: var(--c-bg); color: var(--c-ink); }
h1,h2,h3 { font-family: var(--font-display); }
.font-data { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

.bp-grid {
  background-image:
    linear-gradient(to right, var(--c-border) 1px, transparent 1px),
    linear-gradient(to bottom, var(--c-border) 1px, transparent 1px);
  background-size: 28px 28px;
  opacity: .25;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```

- [ ] **Step 6: Build**

```bash
npm run build
```
Expected: build correcto.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold + sistema de diseño Operations Cockpit (tokens light/dark, fuentes, blueprint)"
```

---

## Task 2: Tipos y constantes

**Files:** Create `src/lib/types.ts`, `src/lib/constants.ts`.

- [ ] **Step 1: `src/lib/types.ts`**

```ts
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
```

- [ ] **Step 2: `src/lib/constants.ts`**

```ts
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
```

- [ ] **Step 3: Typecheck**

```bash
npm run check
```
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/constants.ts
git commit -m "feat: tipos y constantes de dominio"
```

---

## Task 3: Cálculos puros (TDD)

**Files:** Create `src/lib/calc.ts`, `src/lib/calc.test.ts`.

- [ ] **Step 1: Tests que fallan — `src/lib/calc.test.ts`**

```ts
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
```

- [ ] **Step 2: Verificar fallo**

```bash
npx vitest run src/lib/calc.test.ts
```
Expected: FAIL (no existe `./calc`).

- [ ] **Step 3: `src/lib/calc.ts`**

```ts
import { DIA_POR_INDICE } from './constants';

export function rendimiento(ratioECS: number, ratioIdeal: number): number {
  return ratioIdeal ? (ratioECS / ratioIdeal) * 100 : 0;
}
export function utilizacion(horas: number): number { return (horas / 24) * 100; }
export function porcentajeLleno(inv: number, cap: number): number { return cap ? (inv / cap) * 100 : 0; }
export function pesoPromedioKg(tm: number, bolsas: number): number { return bolsas ? (tm * 1000) / bolsas : 0; }
export function variacionPct(actual: number, base: number): number { return base ? ((actual - base) / base) * 100 : 0; }
export function cumplimiento(real: number, plan: number): number { return plan ? (real / plan) * 100 : 0; }
export function totalTm(rows: { tm: number }[]): number { return rows.reduce((s, r) => s + (Number(r.tm) || 0), 0); }
export function totalBolsas(rows: { bolsas: number }[]): number { return rows.reduce((s, r) => s + (Number(r.bolsas) || 0), 0); }

export interface FilaComparativa { anio: number; mes: number; despacho_tm: number; }
export interface MesPivot { mes: number; valores: Record<number, number>; }
export function pivotComparativa(rows: FilaComparativa[]): MesPivot[] {
  const m = new Map<number, Record<number, number>>();
  for (const r of rows) { if (!m.has(r.mes)) m.set(r.mes, {}); m.get(r.mes)![r.anio] = r.despacho_tm; }
  return [...m.keys()].sort((a, b) => a - b).map((mes) => ({ mes, valores: m.get(mes)! }));
}

export function rendimientoPromedio(maquinas: { ratio_ecs: number; ratio_ideal: number }[]): number {
  if (!maquinas.length) return 0;
  return maquinas.reduce((s, m) => s + rendimiento(m.ratio_ecs, m.ratio_ideal), 0) / maquinas.length;
}

// Plan especial (por fecha) gana sobre el plan semanal (por día de semana).
export function planDiario(fecha: string, semanal: Record<string, number>, especiales: Record<string, number>): number {
  if (especiales[fecha] !== undefined) return especiales[fecha];
  const dia = DIA_POR_INDICE[new Date(fecha).getDay()];
  return semanal[dia] || 0;
}
```

- [ ] **Step 4: Verificar pase**

```bash
npx vitest run src/lib/calc.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calc.ts src/lib/calc.test.ts
git commit -m "feat: cálculos puros con tests (TDD)"
```

---

## Task 4: Supabase — proyecto, cliente y env

**Files:** Create `.env`, `.env.example`, `src/lib/supabase/client.ts`; Modify `.gitignore`.

- [ ] **Step 1: Crear el proyecto Supabase (MCP, confirmando coste)**

Con las herramientas MCP de Supabase:
1. `list_organizations` → `organization_id`.
2. `get_cost` (type `project`) → `confirm_cost` → `confirm_cost_id`.
3. `create_project` `name: "planta-yura"`, `organization_id`, `confirm_cost_id`, región cercana.
4. `get_project_url` + `get_publishable_keys` → URL y anon key.

> Alternativa: crear en el dashboard de Supabase y copiar URL + anon key.

- [ ] **Step 2: `.env` (valores reales) y `.env.example`**

`.env`:
```
PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```
`.env.example`:
```
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 3: Asegurar `.env` en `.gitignore`** (añadir la línea `.env` si falta).

- [ ] **Step 4: `src/lib/supabase/client.ts`**

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

let _c: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (!_c) _c = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
  return _c;
}
```

- [ ] **Step 5: Build** (`npm run build`) — Expected: correcto.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .env.example .gitignore src/lib/supabase/client.ts
git commit -m "feat: Supabase (proyecto, cliente, env)"
```

---

## Task 5: Esquema (migración)

**Files:** Create `supabase/migrations/0001_schema.sql`.

- [ ] **Step 1: Escribir `0001_schema.sql`** — *(mismo esquema relacional; ver bloque)*

```sql
create table tipo_cemento (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  familia text not null default 'OTRO',
  presentacion text not null default 'bolsa42.5',
  peso_kg numeric, activo boolean not null default true, orden int not null default 0
);
create table maquina ( id text primary key, nombre text not null, ratio_ideal int not null );
create table temporal ( id bigint generated always as identity primary key, nombre text not null unique, capacidad numeric not null );
create table parte_diario (
  id bigint generated always as identity primary key,
  fecha date not null unique,
  veh_llamado int not null default 0, veh_proceso int not null default 0, veh_playa int not null default 0,
  acumulado_ajuste numeric not null default 0, comentario text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table despacho (
  id bigint generated always as identity primary key,
  parte_id bigint not null references parte_diario(id) on delete cascade,
  tipo_id bigint not null references tipo_cemento(id),
  bolsas numeric not null default 0, tm numeric not null default 0,
  unique (parte_id, tipo_id)
);
create table venta_diaria (
  parte_id bigint primary key references parte_diario(id) on delete cascade,
  nacional_tm numeric not null default 0, export_tm numeric not null default 0, a_construir_tm numeric not null default 0
);
create table maquina_registro (
  parte_id bigint not null references parte_diario(id) on delete cascade,
  maquina_id text not null references maquina(id),
  horas_maquina numeric not null default 0, ratio_ecs int not null default 0, operativos int not null default 0,
  comentario text not null default '', averia_critica text not null default 'verde',
  primary key (parte_id, maquina_id)
);
create table temporal_registro (
  parte_id bigint not null references parte_diario(id) on delete cascade,
  temporal_id bigint not null references temporal(id),
  inventario numeric not null default 0,
  primary key (parte_id, temporal_id)
);
create table compuerta_registro (
  parte_id bigint not null references parte_diario(id) on delete cascade,
  numero int not null, horas numeric not null default 0, comentario text not null default '',
  primary key (parte_id, numero)
);
create table plan_semanal ( dia text primary key, tm numeric not null default 0 );
create table plan_especial ( fecha date primary key, tm numeric not null default 0 );
create table plan_anual ( anio int primary key, plan_mensual numeric not null default 0, plan_anual numeric not null default 0 );
create table plan_ventas_familia ( anio int not null, mes int not null check (mes between 1 and 12), familia text not null, tm numeric not null default 0, primary key (anio, mes, familia) );
create table resumen_mensual_historico ( anio int not null, mes int not null check (mes between 1 and 12), despacho_tm numeric not null, primary key (anio, mes) );

create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
create trigger trg_parte_updated before update on parte_diario for each row execute function set_updated_at();

-- RLS permisiva (sin auth — DEUDA DE SEGURIDAD conocida)
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($p$create policy "anon_all_%1$s" on public.%1$I for all to anon using (true) with check (true);$p$, t);
  end loop;
end $$;
```

- [ ] **Step 2: Aplicar** — MCP `apply_migration` name `0001_schema`. Expected: sin error.
- [ ] **Step 3: Verificar** — MCP `list_tables` → 14 tablas.
- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_schema.sql
git commit -m "feat: esquema Supabase + RLS permisiva"
```

---

## Task 6: Vistas analíticas

**Files:** Create `supabase/migrations/0002_views.sql`.

- [ ] **Step 1: Escribir `0002_views.sql`**

```sql
create or replace view v_participacion_dia as
select p.fecha, tc.nombre as tipo, tc.familia, d.bolsas, d.tm,
  case when sum(d.tm) over (partition by p.fecha)=0 then 0
       else d.tm / sum(d.tm) over (partition by p.fecha) * 100 end as pct
from parte_diario p join despacho d on d.parte_id=p.id join tipo_cemento tc on tc.id=d.tipo_id;

create or replace view v_despacho_por_familia as
select p.fecha, tc.familia, sum(d.bolsas) as bolsas, sum(d.tm) as tm
from parte_diario p join despacho d on d.parte_id=p.id join tipo_cemento tc on tc.id=d.tipo_id
group by p.fecha, tc.familia;

create or replace view v_despacho_mensual_live as
select extract(year from p.fecha)::int as anio, extract(month from p.fecha)::int as mes, sum(d.tm) as despacho_tm
from parte_diario p join despacho d on d.parte_id=p.id group by 1,2;

create or replace view v_despacho_mensual as
select anio, mes, despacho_tm from resumen_mensual_historico
union all select anio, mes, despacho_tm from v_despacho_mensual_live;

create or replace view v_comparativa_anual as
select anio, mes, despacho_tm from v_despacho_mensual order by mes, anio;

create or replace view v_plan_vs_real as
select pv.anio, pv.mes, sum(pv.tm) as plan_tm, coalesce(l.despacho_tm,0) as real_tm,
  case when sum(pv.tm)=0 then 0 else coalesce(l.despacho_tm,0)/sum(pv.tm)*100 end as cumplimiento_pct
from plan_ventas_familia pv
left join v_despacho_mensual_live l on l.anio=pv.anio and l.mes=pv.mes
group by pv.anio, pv.mes, l.despacho_tm;
```

- [ ] **Step 2: Aplicar** — MCP `apply_migration` name `0002_views`. Expected: sin error.
- [ ] **Step 3: Verificar** — MCP `execute_sql`: `select count(*) from v_comparativa_anual;` (≥0, sin error).
- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_views.sql
git commit -m "feat: vistas analíticas Supabase"
```

---

## Task 7: Seed (datos reales del Excel)

**Files:** Create `supabase/migrations/0003_seed.sql`.

- [ ] **Step 1: Escribir `0003_seed.sql`**

```sql
insert into maquina (id,nombre,ratio_ideal) values
  ('H1','Haver 1',2400),('H2','Haver 2',3600),('H3','Haver 3',3900),('H4','Haver 4',3900),('H5','Haver 5',3900),('V','Ventomatic',4300)
on conflict (id) do nothing;

insert into temporal (nombre,capacidad) values ('Temporal 1',2142),('Temporal 2',1890),('Misti',3006)
on conflict (nombre) do nothing;

insert into tipo_cemento (nombre,familia,presentacion,peso_kg,orden) values
  ('CEM. FRONTERA GU X 42.5 KG','GU','bolsa42.5',42.5,1),
  ('CEMENTO FRONTERA IP x 42.5 KG','IP','bolsa42.5',42.5,2),
  ('CEMENTO HS+R X 42.5 KG RUMI','HS','bolsa42.5',42.5,3),
  ('CEMENTO PORTLAND TIPO I X 42.5 KG YURA','TIPO I','bolsa42.5',42.5,4),
  ('CEMENTO YURA ANTISALITRE (MS) X 42.5 KG','MS','bolsa42.5',42.5,5),
  ('CEMENTO YURA MAX (HS) X 42.5KG','HS','bolsa42.5',42.5,6),
  ('CEMENTO YURA PRO (HE) 42.5KG','HE','bolsa42.5',42.5,7),
  ('CEMENTO YURA PRO EXPORT BRASIL x 42.5 kg','HE','bolsa42.5',42.5,8),
  ('CEMENTO BLANCO X 25 KG YURA NACIONAL','BLANCO','bolsa25',25,9),
  ('CEMENTO YURA PRO (HE) BBx1.5TM INC.ENV','HE','bigbag',1500,10),
  ('CEM ALT REST IN HE BB1.5TM YURA ENV CHIL','HE','bigbag',1500,11),
  ('CEM. PORT. PUZ. IP BBx1.5TM INC.ENV YURA','IP','bigbag',1500,12),
  ('CEM.YURA ANTISALITRE MS BBx1.5TM INC.ENV','MS','bigbag',1500,13),
  ('CEMENTO YURA MAX BBx1.5TM INC.ENV','HS','bigbag',1500,14),
  ('CEM. PORT. I BBx1.5TM INC.ENV YURA','TIPO I','bigbag',1500,15),
  ('CEMENTO YURA PRO (HE) GRANEL EN BOMBONA','HE','granel',null,16),
  ('CEMENTO YURA IP A GRANEL EN BOMBONA','IP','granel',null,17),
  ('CEMENTO YURA MAX GRANEL BOMBONA','HS','granel',null,18)
on conflict (nombre) do nothing;

insert into plan_anual (anio,plan_mensual,plan_anual) values (2026,227210.594,2726927.128) on conflict (anio) do nothing;

insert into resumen_mensual_historico (anio,mes,despacho_tm) values
  (2024,1,204007.803),(2024,2,186305.944),(2024,3,199570.192),(2024,4,205343.728),(2024,5,209473.774),(2024,6,196506.860),(2024,7,219516.239),(2024,8,232937.965),(2024,9,231021.168),(2024,10,237591.573),(2024,11,215275.195),(2024,12,210045.588),
  (2025,1,190629.128),(2025,2,182874.285),(2025,3,197224.221),(2025,4,198970.758),(2025,5,212393.173),(2025,6,204590.000),(2025,7,222445.377),(2025,8,233567.971),(2025,9,234732.794),(2025,10,249609.074),(2025,11,242524.660),(2025,12,246279.444)
on conflict (anio,mes) do nothing;

insert into plan_ventas_familia (anio,mes,familia,tm) values
  (2026,1,'gris_interno',192165.921),(2026,2,'gris_interno',179398.291),(2026,3,'gris_interno',194439.503),(2026,4,'gris_interno',198128.393),(2026,5,'gris_interno',210381.445),(2026,6,'gris_interno',199416.328),(2026,7,'gris_interno',215756.383),(2026,8,'gris_interno',223685.985),(2026,9,'gris_interno',235307.857),(2026,10,'gris_interno',237702.911),(2026,11,'gris_interno',226591.308),(2026,12,'gris_interno',225590.553),
  (2026,1,'gris_externo',11767.984),(2026,2,'gris_externo',12151.620),(2026,3,'gris_externo',12304.489),(2026,4,'gris_externo',11090.411),(2026,5,'gris_externo',10741.801),(2026,6,'gris_externo',12014.853),(2026,7,'gris_externo',13546.815),(2026,8,'gris_externo',12963.620),(2026,9,'gris_externo',12577.404),(2026,10,'gris_externo',13332.059),(2026,11,'gris_externo',13791.964),(2026,12,'gris_externo',13624.230),
  (2026,1,'blanco',1470),(2026,2,'blanco',1520),(2026,3,'blanco',1540),(2026,4,'blanco',1600),(2026,5,'blanco',1650),(2026,6,'blanco',1680),(2026,7,'blanco',1740),(2026,8,'blanco',1810),(2026,9,'blanco',1835),(2026,10,'blanco',1865),(2026,11,'blanco',1865),(2026,12,'blanco',1880),
  (2026,1,'filler',1425),(2026,2,'filler',1475),(2026,3,'filler',1500),(2026,4,'filler',1400),(2026,5,'filler',1500),(2026,6,'filler',1500),(2026,7,'filler',1600),(2026,8,'filler',1500),(2026,9,'filler',1500),(2026,10,'filler',1600),(2026,11,'filler',1500),(2026,12,'filler',1500)
on conflict (anio,mes,familia) do nothing;

insert into plan_semanal (dia,tm) values ('Lunes',0),('Martes',0),('Miércoles',0),('Jueves',0),('Viernes',0),('Sábado',0),('Domingo',0)
on conflict (dia) do nothing;
```

- [ ] **Step 2: Aplicar** — MCP `apply_migration` name `0003_seed`. Expected: sin error.
- [ ] **Step 3: Verificar** — MCP `execute_sql`:
```sql
select (select count(*) from tipo_cemento) tipos, (select count(*) from resumen_mensual_historico) hist, (select count(*) from plan_ventas_familia) plan;
```
Expected: `tipos=18, hist=24, plan=48`.
- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0003_seed.sql
git commit -m "feat: seed real del Excel (tipos+familia, histórico, plan)"
```

---

## Task 8: Tipos generados + repositorio

**Files:** Create `src/lib/supabase/types.gen.ts`, `src/lib/repo.ts`.

- [ ] **Step 1: Generar tipos** — MCP `generate_typescript_types` → guardar en `src/lib/supabase/types.gen.ts`. (Alt: `npx supabase gen types typescript --project-id <ref>`.)

- [ ] **Step 2: `src/lib/repo.ts`**

```ts
import { getSupabase } from './supabase/client';
import type { ParteCompleto, TipoB, PlanSemanal, PlanesEspeciales, Planes } from './types';

export async function getTipos(): Promise<TipoB[]> {
  const { data, error } = await getSupabase().from('tipo_cemento')
    .select('id,nombre,familia,presentacion,orden').eq('activo', true).order('orden');
  if (error) throw error;
  return (data ?? []) as TipoB[];
}

export async function guardarParte(p: ParteCompleto): Promise<void> {
  const sb = getSupabase();
  const { data: parte, error } = await sb.from('parte_diario').upsert({
    fecha: p.fecha, veh_llamado: p.veh_llamado, veh_proceso: p.veh_proceso, veh_playa: p.veh_playa,
    acumulado_ajuste: p.acumulado_ajuste, comentario: p.comentario
  }, { onConflict: 'fecha' }).select('id').single();
  if (error) throw error;
  const id = parte.id as number;
  await sb.from('despacho').delete().eq('parte_id', id);
  if (p.despachos.length) {
    const { error: e } = await sb.from('despacho').insert(p.despachos.map((d) => ({ parte_id: id, tipo_id: d.tipo_id, bolsas: d.bolsas, tm: d.tm })));
    if (e) throw e;
  }
  await sb.from('venta_diaria').upsert({ parte_id: id, ...p.venta }, { onConflict: 'parte_id' });
  await sb.from('maquina_registro').delete().eq('parte_id', id);
  if (p.maquinas.length) await sb.from('maquina_registro').insert(p.maquinas.map((m) => ({ parte_id: id, ...m })));
  await sb.from('temporal_registro').delete().eq('parte_id', id);
  if (p.temporales.length) await sb.from('temporal_registro').insert(p.temporales.map((t) => ({ parte_id: id, ...t })));
  await sb.from('compuerta_registro').delete().eq('parte_id', id);
  if (p.compuertas.length) await sb.from('compuerta_registro').insert(p.compuertas.map((c) => ({ parte_id: id, ...c })));
}

export async function cargarParte(fecha: string): Promise<ParteCompleto | null> {
  const sb = getSupabase();
  const { data: cab } = await sb.from('parte_diario').select('*').eq('fecha', fecha).maybeSingle();
  if (!cab) return null;
  const id = cab.id as number;
  const [desp, venta, maq, temp, comp] = await Promise.all([
    sb.from('despacho').select('tipo_id,bolsas,tm,tipo_cemento(nombre,familia)').eq('parte_id', id),
    sb.from('venta_diaria').select('*').eq('parte_id', id).maybeSingle(),
    sb.from('maquina_registro').select('*').eq('parte_id', id),
    sb.from('temporal_registro').select('*').eq('parte_id', id),
    sb.from('compuerta_registro').select('*').eq('parte_id', id)
  ]);
  return {
    fecha,
    veh_llamado: cab.veh_llamado, veh_proceso: cab.veh_proceso, veh_playa: cab.veh_playa,
    acumulado_ajuste: cab.acumulado_ajuste, comentario: cab.comentario,
    despachos: (desp.data ?? []).map((d: any) => ({ tipo_id: d.tipo_id, nombre: d.tipo_cemento?.nombre ?? '', familia: d.tipo_cemento?.familia ?? '', bolsas: d.bolsas, tm: d.tm })),
    venta: { nacional_tm: venta.data?.nacional_tm ?? 0, export_tm: venta.data?.export_tm ?? 0, a_construir_tm: venta.data?.a_construir_tm ?? 0 },
    maquinas: (maq.data ?? []) as any, temporales: (temp.data ?? []) as any, compuertas: (comp.data ?? []) as any
  };
}

export interface ParticipacionRow { tipo: string; familia: string; bolsas: number; tm: number; pct: number; }
export async function getParticipacionDia(fecha: string): Promise<ParticipacionRow[]> {
  const { data, error } = await getSupabase().from('v_participacion_dia').select('*').eq('fecha', fecha);
  if (error) throw error; return (data ?? []) as ParticipacionRow[];
}
export interface FamiliaRow { familia: string; bolsas: number; tm: number; }
export async function getDespachoPorFamilia(fecha: string): Promise<FamiliaRow[]> {
  const { data, error } = await getSupabase().from('v_despacho_por_familia').select('familia,bolsas,tm').eq('fecha', fecha);
  if (error) throw error; return (data ?? []) as FamiliaRow[];
}
export interface ComparativaRow { anio: number; mes: number; despacho_tm: number; }
export async function getComparativaAnual(): Promise<ComparativaRow[]> {
  const { data, error } = await getSupabase().from('v_comparativa_anual').select('*');
  if (error) throw error; return (data ?? []) as ComparativaRow[];
}
export interface PlanVsRealRow { anio: number; mes: number; plan_tm: number; real_tm: number; cumplimiento_pct: number; }
export async function getPlanVsReal(anio: number): Promise<PlanVsRealRow[]> {
  const { data, error } = await getSupabase().from('v_plan_vs_real').select('*').eq('anio', anio).order('mes');
  if (error) throw error; return (data ?? []) as PlanVsRealRow[];
}
export async function getUltimosDespachosDiarios(desde: string, hasta: string): Promise<{ fecha: string; tm: number }[]> {
  const { data, error } = await getSupabase().from('v_participacion_dia').select('fecha,tm').gte('fecha', desde).lte('fecha', hasta);
  if (error) throw error;
  const m = new Map<string, number>();
  for (const r of (data ?? []) as { fecha: string; tm: number }[]) m.set(r.fecha, (m.get(r.fecha) ?? 0) + Number(r.tm || 0));
  return [...m.entries()].map(([fecha, tm]) => ({ fecha, tm })).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// ----- Configuración -----
export async function getPlanSemanal(): Promise<PlanSemanal> {
  const { data } = await getSupabase().from('plan_semanal').select('dia,tm');
  const m: PlanSemanal = {};
  for (const r of (data ?? []) as { dia: string; tm: number }[]) m[r.dia] = r.tm;
  return m;
}
export async function guardarPlanSemanal(p: PlanSemanal): Promise<void> {
  const rows = Object.entries(p).map(([dia, tm]) => ({ dia, tm }));
  const { error } = await getSupabase().from('plan_semanal').upsert(rows, { onConflict: 'dia' });
  if (error) throw error;
}
export async function getPlanesEspeciales(): Promise<PlanesEspeciales> {
  const { data } = await getSupabase().from('plan_especial').select('fecha,tm');
  const m: PlanesEspeciales = {};
  for (const r of (data ?? []) as { fecha: string; tm: number }[]) m[r.fecha] = r.tm;
  return m;
}
export async function guardarPlanEspecial(fecha: string, tm: number): Promise<void> {
  const { error } = await getSupabase().from('plan_especial').upsert({ fecha, tm }, { onConflict: 'fecha' });
  if (error) throw error;
}
export async function eliminarPlanEspecial(fecha: string): Promise<void> {
  const { error } = await getSupabase().from('plan_especial').delete().eq('fecha', fecha);
  if (error) throw error;
}
export async function getPlanAnual(anio: number): Promise<Planes> {
  const { data } = await getSupabase().from('plan_anual').select('plan_mensual,plan_anual').eq('anio', anio).maybeSingle();
  return { planMensual: data?.plan_mensual ?? 0, planAnual: data?.plan_anual ?? 0 };
}
export async function guardarPlanAnual(anio: number, planMensual: number, planAnual: number): Promise<void> {
  const { error } = await getSupabase().from('plan_anual').upsert({ anio, plan_mensual: planMensual, plan_anual: planAnual }, { onConflict: 'anio' });
  if (error) throw error;
}
export async function crearTipo(nombre: string, familia = 'OTRO', presentacion = 'bolsa42.5'): Promise<void> {
  const { error } = await getSupabase().from('tipo_cemento').insert({ nombre, familia, presentacion });
  if (error) throw error;
}
export async function actualizarTipo(id: number, campos: { nombre?: string; familia?: string }): Promise<void> {
  const { error } = await getSupabase().from('tipo_cemento').update(campos).eq('id', id);
  if (error) throw error;
}
export async function eliminarTipo(id: number): Promise<void> {
  // borrado lógico (preserva integridad con despachos históricos)
  const { error } = await getSupabase().from('tipo_cemento').update({ activo: false }).eq('id', id);
  if (error) throw error;
}

// ----- Helpers de dashboard (paridad index.html) -----
// Despacho mensual combinado (histórico 2024/25 + vivo 2026+); sin solape.
export async function despachoMes(anio: number, mes: number): Promise<number> {
  const { data } = await getSupabase().from('v_despacho_mensual').select('despacho_tm').eq('anio', anio).eq('mes', mes);
  return (data ?? []).reduce((s: number, r: any) => s + Number(r.despacho_tm || 0), 0);
}

export interface MaquinaDiaRow { nombre: string; horas_maquina: number; ratio_ecs: number; ratio_ideal: number; averia_critica: string; }
export async function getMaquinasDia(fecha: string): Promise<MaquinaDiaRow[]> {
  const sb = getSupabase();
  const { data: cab } = await sb.from('parte_diario').select('id').eq('fecha', fecha).maybeSingle();
  if (!cab) return [];
  const { data } = await sb.from('maquina_registro').select('maquina_id,horas_maquina,ratio_ecs,averia_critica,maquina(nombre,ratio_ideal)').eq('parte_id', cab.id);
  return (data ?? []).map((m: any) => ({ nombre: m.maquina?.nombre ?? m.maquina_id, horas_maquina: m.horas_maquina, ratio_ecs: m.ratio_ecs, ratio_ideal: m.maquina?.ratio_ideal ?? 0, averia_critica: m.averia_critica }));
}

export async function getCompuertasDia(fecha: string): Promise<{ numero: number; horas: number; comentario: string }[]> {
  const sb = getSupabase();
  const { data: cab } = await sb.from('parte_diario').select('id').eq('fecha', fecha).maybeSingle();
  if (!cab) return [];
  const { data } = await sb.from('compuerta_registro').select('numero,horas,comentario').eq('parte_id', cab.id).order('numero');
  return (data ?? []) as { numero: number; horas: number; comentario: string }[];
}
```

- [ ] **Step 3: Typecheck** (`npm run check`) — Expected: sin errores.
- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/types.gen.ts src/lib/repo.ts
git commit -m "feat: tipos generados y repositorio Supabase"
```

---

## Task 9: Componentes del sistema de diseño

**Files:** Create los componentes en `src/lib/components/` + `theme.ts` + `stores.ts` + `toastStore.ts`.

- [ ] **Step 1: `src/lib/theme.ts`**

```ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function inicial(): 'light' | 'dark' {
  if (!browser) return 'light';
  return (document.documentElement.dataset.theme as 'light' | 'dark') || 'light';
}
export const theme = writable<'light' | 'dark'>(inicial());
export function toggleTheme() {
  theme.update((t) => {
    const next = t === 'dark' ? 'light' : 'dark';
    if (browser) { document.documentElement.dataset.theme = next; localStorage.setItem('theme', next); }
    return next;
  });
}
```

- [ ] **Step 2: `src/lib/stores.ts`**

```ts
import { writable } from 'svelte/store';
export const fechaSeleccionada = writable<string>(new Date().toISOString().slice(0, 10));
```

- [ ] **Step 3: `src/lib/components/toastStore.ts`**

```ts
import { writable } from 'svelte/store';
export interface ToastMsg { id: number; texto: string; error: boolean; }
export const toasts = writable<ToastMsg[]>([]);
let n = 1;
export function toast(texto: string, error = false) {
  const id = n++;
  toasts.update((a) => [...a, { id, texto, error }]);
  setTimeout(() => toasts.update((a) => a.filter((t) => t.id !== id)), 3500);
}
```

- [ ] **Step 4: `src/lib/components/Toast.svelte`**

```svelte
<script lang="ts">
  import { toasts } from './toastStore';
  import { CircleCheck, CircleAlert } from 'lucide-svelte';
</script>

<div class="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[1000] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite">
  {#each $toasts as t (t.id)}
    <div class="pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-on-primary shadow-lg {t.error ? 'bg-danger' : 'bg-primary'}">
      {#if t.error}<CircleAlert size={18} />{:else}<CircleCheck size={18} />{/if}
      {t.texto}
    </div>
  {/each}
</div>
```

- [ ] **Step 5: `src/lib/components/ThemeToggle.svelte`**

```svelte
<script lang="ts">
  import { theme, toggleTheme } from '$lib/theme';
  import { Sun, Moon } from 'lucide-svelte';
</script>

<button onclick={toggleTheme} aria-label="Cambiar tema"
  class="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface text-ink transition hover:bg-surface-2">
  {#if $theme === 'dark'}<Sun size={20} />{:else}<Moon size={20} />{/if}
</button>
```

- [ ] **Step 6: `src/lib/components/CountUp.svelte`**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  let { value = 0, decimals = 0, duration = 700 } = $props<{ value: number; decimals?: number; duration?: number }>();
  let shown = $state(0);
  function fmt(n: number) { return n.toLocaleString('es-PE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }); }
  function animate(to: number) {
    if (!browser || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { shown = to; return; }
    const from = shown, start = performance.now();
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      shown = from + (to - from) * (1 - Math.pow(1 - p, 3));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  onMount(() => animate(value));
  $effect(() => { animate(value); });
</script>

<span class="font-data">{fmt(shown)}</span>
```

- [ ] **Step 7: `src/lib/components/Sparkline.svelte`**

```svelte
<script lang="ts">
  let { data = [], width = 96, height = 28 } = $props<{ data: number[]; width?: number; height?: number }>();
  const puntos = $derived.by(() => {
    if (!data.length) return '';
    const max = Math.max(...data, 1), min = Math.min(...data, 0), span = max - min || 1;
    return data.map((v, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * width;
      const y = height - ((v - min) / span) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  });
</script>

<svg {width} {height} viewBox={`0 0 ${width} ${height}`} class="overflow-visible" aria-hidden="true">
  <polyline points={puntos} fill="none" stroke="var(--c-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>
```

- [ ] **Step 8: `src/lib/components/KPICard.svelte`**

```svelte
<script lang="ts">
  import CountUp from './CountUp.svelte';
  import Sparkline from './Sparkline.svelte';
  import { TrendingUp, TrendingDown } from 'lucide-svelte';
  let { label, value, decimals = 0, suffix = '', trend = null, spark = [] } =
    $props<{ label: string; value: number; decimals?: number; suffix?: string; trend?: number | null; spark?: number[] }>();
  const up = $derived(trend !== null && trend >= 0);
</script>

<div class="rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:shadow-md">
  <div class="flex items-start justify-between gap-2">
    <span class="text-xs font-medium uppercase tracking-wide text-muted-ink">{label}</span>
    {#if spark.length}<Sparkline data={spark} />{/if}
  </div>
  <div class="mt-2 text-2xl font-extrabold text-ink lg:text-3xl">
    <CountUp {value} {decimals} />{suffix}
  </div>
  {#if trend !== null}
    <div class="mt-1 flex items-center gap-1 text-xs font-semibold {up ? 'text-success' : 'text-danger'}">
      {#if up}<TrendingUp size={14} />{:else}<TrendingDown size={14} />{/if}
      {up ? '+' : ''}{trend.toFixed(1)}%
    </div>
  {/if}
</div>
```

- [ ] **Step 9: `src/lib/components/StatusBadge.svelte`**

```svelte
<script lang="ts">
  let { estado } = $props<{ estado: string }>();
  const cfg: Record<string, { c: string; t: string }> = {
    verde: { c: 'bg-success', t: 'Operativo' },
    amarillo: { c: 'bg-warning', t: 'En reparación' },
    rojo: { c: 'bg-danger', t: 'Avería' }
  };
  const s = $derived(cfg[estado] ?? cfg.verde);
</script>

<span class="inline-flex items-center gap-2 text-sm">
  <span class="h-2.5 w-2.5 rounded-full {s.c}"></span>{s.t}
</span>
```

- [ ] **Step 10: `src/lib/components/SectionCard.svelte`**

```svelte
<script lang="ts">
  let { title, children } = $props();
</script>

<section class="mb-5 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
  <header class="border-b border-border px-4 py-3 lg:px-5">
    <h2 class="text-sm font-bold uppercase tracking-wide text-primary">{title}</h2>
  </header>
  <div class="p-4 lg:p-5">{@render children()}</div>
</section>
```

- [ ] **Step 11: `src/lib/components/Skeleton.svelte`**

```svelte
<script lang="ts">
  let { class: cls = 'h-6 w-full' } = $props<{ class?: string }>();
</script>

<div class="animate-pulse rounded-md bg-surface-2 {cls}"></div>
```

- [ ] **Step 12: `src/lib/components/EmptyState.svelte`**

```svelte
<script lang="ts">
  import { Inbox } from 'lucide-svelte';
  let { titulo, descripcion = '' } = $props<{ titulo: string; descripcion?: string }>();
</script>

<div class="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
  <div class="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted-ink"><Inbox size={24} /></div>
  <p class="font-semibold text-ink">{titulo}</p>
  {#if descripcion}<p class="max-w-sm text-sm text-muted-ink">{descripcion}</p>{/if}
</div>
```

- [ ] **Step 13: `src/lib/components/ResponsiveTable.svelte`** (tabla en ≥md, tarjetas en móvil)

```svelte
<script lang="ts">
  interface Col { key: string; label: string; mono?: boolean; }
  let { columns, rows, rowClass = () => '' } =
    $props<{ columns: Col[]; rows: Record<string, any>[]; rowClass?: (r: Record<string, any>) => string }>();
</script>

<!-- Escritorio / tablet -->
<div class="hidden overflow-x-auto md:block">
  <table class="w-full border-collapse text-sm">
    <thead>
      <tr class="border-b border-border text-left text-muted-ink">
        {#each columns as c}<th class="px-3 py-2 font-semibold uppercase tracking-wide">{c.label}</th>{/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as r}
        <tr class="border-b border-border transition hover:bg-surface-2 {rowClass(r)}">
          {#each columns as c}<td class="px-3 py-2 {c.mono ? 'font-data' : ''}">{r[c.key]}</td>{/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<!-- Móvil: tarjetas apiladas -->
<div class="flex flex-col gap-2 md:hidden">
  {#each rows as r}
    <div class="rounded-xl border border-border bg-surface-2/40 p-3 {rowClass(r)}">
      {#each columns as c, i}
        <div class="flex items-center justify-between gap-3 py-0.5 {i === 0 ? 'mb-1 font-semibold text-ink' : 'text-sm'}">
          {#if i !== 0}<span class="text-muted-ink">{c.label}</span>{/if}
          <span class={c.mono ? 'font-data' : ''}>{r[c.key]}</span>
        </div>
      {/each}
    </div>
  {/each}
</div>
```

- [ ] **Step 14: `src/lib/components/ChartCard.svelte`** (envoltura Chart.js responsive)

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables, type ChartConfiguration } from 'chart.js';
  Chart.register(...registerables);
  let { config } = $props<{ config: ChartConfiguration }>();
  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;
  function render() {
    if (!canvas) return;
    if (chart) chart.destroy();
    chart = new Chart(canvas.getContext('2d')!, config);
  }
  onMount(render);
  $effect(() => { config; render(); });
  onDestroy(() => chart?.destroy());
</script>

<div class="relative h-[280px] w-full lg:h-[320px]"><canvas bind:this={canvas}></canvas></div>
```

- [ ] **Step 15: Verificar build** (`npm run build`) — Expected: correcto.
- [ ] **Step 16: Commit**

```bash
git add src/lib/theme.ts src/lib/stores.ts src/lib/components
git commit -m "feat: componentes del sistema de diseño (KPI animado, sparkline, tabla responsive, tema, skeleton, toast, charts)"
```

---

## Task 10: AppShell (layout responsive: sidebar / topbar / bottom-nav)

**Files:** Create `src/routes/+layout.ts`, `src/routes/+layout.svelte`.

- [ ] **Step 1: `src/routes/+layout.ts`**

```ts
export const ssr = false;
export const prerender = false;
```

- [ ] **Step 2: `src/routes/+layout.svelte`**

```svelte
<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { fechaSeleccionada } from '$lib/stores';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { Factory, LayoutDashboard, ClipboardList, Settings } from 'lucide-svelte';

  let { children } = $props();
  const nav = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/registro', label: 'Registro', icon: ClipboardList },
    { href: '/config', label: 'Configuración', icon: Settings }
  ];
  const activo = (href: string) => $page.url.pathname === href;
</script>

<div class="relative min-h-dvh">
  <div class="bp-grid absolute inset-0 -z-10"></div>

  <!-- Sidebar (escritorio) -->
  <aside class="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface px-4 py-5 lg:flex">
    <div class="mb-8 flex items-center gap-2 text-primary">
      <Factory size={26} /><span class="font-display text-lg font-extrabold">Planta Yura</span>
    </div>
    <nav class="flex flex-col gap-1">
      {#each nav as n}
        <a href={n.href} aria-current={activo(n.href) ? 'page' : undefined}
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition
            {activo(n.href) ? 'bg-primary text-on-primary' : 'text-muted-ink hover:bg-surface-2 hover:text-ink'}">
          <n.icon size={20} />{n.label}
        </a>
      {/each}
    </nav>
  </aside>

  <div class="lg:pl-60">
    <!-- Top bar -->
    <header class="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur lg:px-6">
      <div class="flex items-center gap-2 text-primary lg:hidden">
        <Factory size={22} /><span class="font-display font-extrabold">Yura</span>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <label class="sr-only" for="fecha">Fecha</label>
        <input id="fecha" type="date" bind:value={$fechaSeleccionada}
          class="rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink" />
        <ThemeToggle />
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 pb-28 pt-5 lg:px-6 lg:pb-10">{@render children()}</main>
  </div>

  <!-- Bottom nav (móvil/tablet) -->
  <nav class="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
    {#each nav as n}
      <a href={n.href} aria-current={activo(n.href) ? 'page' : undefined}
        class="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold transition
          {activo(n.href) ? 'text-primary' : 'text-muted-ink'}">
        <n.icon size={22} />{n.label}
      </a>
    {/each}
  </nav>

  <Toast />
</div>
```

- [ ] **Step 3: Build** (`npm run build`) — Expected: correcto.
- [ ] **Step 4: Commit**

```bash
git add src/routes/+layout.svelte src/routes/+layout.ts
git commit -m "feat: AppShell responsive (sidebar escritorio, bottom-nav móvil, top bar, tema)"
```

---

## Task 11: Página Registro

**Files:** Create `src/routes/registro/+page.svelte`.

- [ ] **Step 1: Implementar `src/routes/registro/+page.svelte`**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import SectionCard from '$lib/components/SectionCard.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import { toast } from '$lib/components/toastStore';
  import { MAQUINAS, TEMPORALES } from '$lib/constants';
  import { rendimiento, utilizacion, porcentajeLleno, pesoPromedioKg, totalTm, totalBolsas } from '$lib/calc';
  import { getTipos, guardarParte, cargarParte, despachoMes } from '$lib/repo';
  import { fechaSeleccionada } from '$lib/stores';
  import { Save, RotateCcw } from 'lucide-svelte';

  interface LineaUI { tipo_id: number; nombre: string; familia: string; bolsas: number; tm: number; }
  let cargando = $state(true);
  let guardando = $state(false);
  let lineas = $state<LineaUI[]>([]);
  let venta = $state({ nacional_tm: 0, export_tm: 0, a_construir_tm: 0 });
  let maquinas = $state(MAQUINAS.map((m) => ({ maquina_id: m.id, nombre: m.nombre, ratio_ideal: m.ratio_ideal, horas_maquina: 0, ratio_ecs: 0, operativos: 0, comentario: '', averia_critica: 'verde' })));
  let temporalesUI = $state(TEMPORALES.map((t) => ({ temporal_id: t.id, nombre: t.nombre, capacidad: t.capacidad, inventario: 0 })));
  let compuertas = $state(Array.from({ length: 8 }, (_, i) => ({ numero: i + 1, horas: 0, comentario: '' })));
  let veh = $state({ llamado: 0, proceso: 0, playa: 0 });
  let acumuladoAjuste = $state(0);
  let comentario = $state('');
  let acumMes = $state(0);

  const tm = $derived(totalTm(lineas));
  const bolsas = $derived(totalBolsas(lineas));
  const ventaTotal = $derived((Number(venta.nacional_tm) || 0) + (Number(venta.export_tm) || 0));
  const totalVeh = $derived((Number(veh.llamado) || 0) + (Number(veh.proceso) || 0) + (Number(veh.playa) || 0));
  const acumuladoConAjuste = $derived(acumMes + (Number(acumuladoAjuste) || 0));

  let tipos: { id: number; nombre: string; familia: string }[] = [];
  onMount(async () => { tipos = await getTipos(); await recargar(); cargando = false; });
  $effect(() => { $fechaSeleccionada; if (!cargando) recargar(); });

  async function recargar() {
    const fecha = get(fechaSeleccionada);
    const [y, mo] = fecha.split('-').map(Number);
    acumMes = await despachoMes(y, mo);
    lineas = tipos.map((t) => ({ tipo_id: t.id, nombre: t.nombre, familia: t.familia, bolsas: 0, tm: 0 }));
    const p = await cargarParte(fecha);
    if (!p) {
      venta = { nacional_tm: 0, export_tm: 0, a_construir_tm: 0 };
      maquinas = MAQUINAS.map((m) => ({ maquina_id: m.id, nombre: m.nombre, ratio_ideal: m.ratio_ideal, horas_maquina: 0, ratio_ecs: 0, operativos: 0, comentario: '', averia_critica: 'verde' }));
      temporalesUI = TEMPORALES.map((t) => ({ temporal_id: t.id, nombre: t.nombre, capacidad: t.capacidad, inventario: 0 }));
      compuertas = Array.from({ length: 8 }, (_, i) => ({ numero: i + 1, horas: 0, comentario: '' }));
      veh = { llamado: 0, proceso: 0, playa: 0 }; acumuladoAjuste = 0; comentario = '';
      return;
    }
    lineas = tipos.map((t) => { const d = p.despachos.find((x) => x.tipo_id === t.id); return { tipo_id: t.id, nombre: t.nombre, familia: t.familia, bolsas: d?.bolsas ?? 0, tm: d?.tm ?? 0 }; });
    venta = { ...p.venta };
    maquinas = MAQUINAS.map((m) => { const r = p.maquinas.find((x: any) => x.maquina_id === m.id); return { maquina_id: m.id, nombre: m.nombre, ratio_ideal: m.ratio_ideal, horas_maquina: r?.horas_maquina ?? 0, ratio_ecs: r?.ratio_ecs ?? 0, operativos: r?.operativos ?? 0, comentario: r?.comentario ?? '', averia_critica: r?.averia_critica ?? 'verde' }; });
    temporalesUI = TEMPORALES.map((t) => { const r = p.temporales.find((x: any) => x.temporal_id === t.id); return { temporal_id: t.id, nombre: t.nombre, capacidad: t.capacidad, inventario: r?.inventario ?? 0 }; });
    compuertas = Array.from({ length: 8 }, (_, i) => { const r = p.compuertas.find((x) => x.numero === i + 1); return { numero: i + 1, horas: r?.horas ?? 0, comentario: r?.comentario ?? '' }; });
    veh = { llamado: p.veh_llamado, proceso: p.veh_proceso, playa: p.veh_playa };
    acumuladoAjuste = p.acumulado_ajuste; comentario = p.comentario;
  }

  async function guardar() {
    const fecha = get(fechaSeleccionada);
    if (!fecha) return toast('Seleccione una fecha', true);
    guardando = true;
    try {
      await guardarParte({
        fecha, veh_llamado: veh.llamado, veh_proceso: veh.proceso, veh_playa: veh.playa,
        acumulado_ajuste: Number(acumuladoAjuste) || 0, comentario,
        despachos: $state.snapshot(lineas).map((l) => ({ tipo_id: l.tipo_id, nombre: l.nombre, familia: l.familia, bolsas: Number(l.bolsas) || 0, tm: Number(l.tm) || 0 })),
        venta: $state.snapshot(venta),
        maquinas: $state.snapshot(maquinas).map((m) => ({ maquina_id: m.maquina_id, horas_maquina: m.horas_maquina, ratio_ecs: m.ratio_ecs, operativos: m.operativos, comentario: m.comentario, averia_critica: m.averia_critica })),
        temporales: $state.snapshot(temporalesUI).map((t) => ({ temporal_id: t.temporal_id, inventario: t.inventario })),
        compuertas: $state.snapshot(compuertas)
      });
      toast(`Parte guardado para ${fecha}`);
    } catch (e) { toast('Error al guardar', true); }
    finally { guardando = false; }
  }
</script>

<div class="mb-5 flex items-center justify-between gap-3">
  <h1 class="text-xl font-extrabold text-ink lg:text-2xl">Registro del día</h1>
  <div class="hidden gap-2 sm:flex">
    <button onclick={recargar} class="inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm font-bold text-ink"><RotateCcw size={16} /> Recargar</button>
    <button onclick={guardar} disabled={guardando} class="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-on-primary disabled:opacity-50"><Save size={16} /> {guardando ? 'Guardando…' : 'Guardar'}</button>
  </div>
</div>

{#if cargando}
  <div class="flex flex-col gap-3">{#each Array(4) as _}<Skeleton class="h-40 w-full rounded-2xl" />{/each}</div>
{:else}
  <SectionCard title="Despacho por tipo (bolsas + TM)">
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-sm">
        <thead><tr class="border-b border-border text-left text-muted-ink">
          <th class="px-2 py-2">Tipo</th><th class="px-2 py-2">Familia</th><th class="px-2 py-2">Bolsas</th><th class="px-2 py-2">TM</th><th class="px-2 py-2">Peso prom.</th>
        </tr></thead>
        <tbody>
          {#each lineas as l}
            <tr class="border-b border-border">
              <td class="px-2 py-1.5">{l.nombre}</td>
              <td class="px-2 py-1.5"><span class="rounded bg-surface-2 px-2 py-0.5 text-xs font-semibold">{l.familia}</span></td>
              <td class="px-2 py-1.5"><input type="number" inputmode="numeric" min="0" class="w-24 rounded-lg border border-border bg-surface px-2 py-1.5 font-data" bind:value={l.bolsas} /></td>
              <td class="px-2 py-1.5"><input type="number" inputmode="decimal" step="0.01" min="0" class="w-24 rounded-lg border border-border bg-surface px-2 py-1.5 font-data" bind:value={l.tm} /></td>
              <td class="px-2 py-1.5 font-data">{pesoPromedioKg(l.tm, l.bolsas).toFixed(2)}</td>
            </tr>
          {/each}
        </tbody>
        <tfoot><tr class="font-bold"><td class="px-2 py-2">Total</td><td></td><td class="px-2 py-2 font-data">{bolsas}</td><td class="px-2 py-2 font-data">{tm.toFixed(2)}</td><td></td></tr></tfoot>
      </table>
    </div>
  </SectionCard>

  <SectionCard title="Ventas del día (TM)">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label class="text-sm">Nacional<input type="number" inputmode="decimal" step="0.01" class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-data" bind:value={venta.nacional_tm} /></label>
      <label class="text-sm">Exportación<input type="number" inputmode="decimal" step="0.01" class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-data" bind:value={venta.export_tm} /></label>
      <label class="text-sm">A construir<input type="number" inputmode="decimal" step="0.01" class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-data" bind:value={venta.a_construir_tm} /></label>
      <div class="flex items-end"><span class="font-bold">Total: <span class="font-data">{ventaTotal.toFixed(2)}</span> TM</span></div>
    </div>
  </SectionCard>

  <SectionCard title="Máquinas embolsadoras">
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-sm">
        <thead><tr class="border-b border-border text-left text-muted-ink">
          <th class="px-2 py-2">Máquina</th><th class="px-2 py-2">Horas</th><th class="px-2 py-2">Ratio ECS</th><th class="px-2 py-2">Ideal</th><th class="px-2 py-2">Operativos</th><th class="px-2 py-2">Rend.</th><th class="px-2 py-2">Util.</th><th class="px-2 py-2">Estado</th>
        </tr></thead>
        <tbody>
          {#each maquinas as m}
            <tr class="border-b border-border">
              <td class="px-2 py-1.5 font-semibold">{m.nombre}</td>
              <td class="px-2 py-1.5"><input type="number" inputmode="decimal" step="0.01" class="w-20 rounded-lg border border-border bg-surface px-2 py-1.5 font-data" bind:value={m.horas_maquina} /></td>
              <td class="px-2 py-1.5"><input type="number" inputmode="numeric" class="w-20 rounded-lg border border-border bg-surface px-2 py-1.5 font-data" bind:value={m.ratio_ecs} /></td>
              <td class="px-2 py-1.5 font-data text-muted-ink">{m.ratio_ideal}</td>
              <td class="px-2 py-1.5"><input type="number" inputmode="numeric" class="w-16 rounded-lg border border-border bg-surface px-2 py-1.5 font-data" bind:value={m.operativos} /></td>
              <td class="px-2 py-1.5 font-data">{rendimiento(m.ratio_ecs, m.ratio_ideal).toFixed(1)}%</td>
              <td class="px-2 py-1.5 font-data">{utilizacion(m.horas_maquina).toFixed(1)}%</td>
              <td class="px-2 py-1.5">
                <select class="rounded-lg border border-border bg-surface px-2 py-1.5" bind:value={m.averia_critica}>
                  <option value="verde">Operativo</option><option value="amarillo">Reparación</option><option value="rojo">Avería</option>
                </select>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </SectionCard>

  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <SectionCard title="Temporales">
      {#each temporalesUI as t}
        <div class="mb-3 flex flex-wrap items-center gap-3">
          <div class="min-w-32 flex-1 font-semibold">{t.nombre}<span class="block text-xs font-normal text-muted-ink">Cap. {t.capacidad} TM</span></div>
          <label class="text-sm">Inventario<input type="number" inputmode="decimal" step="0.01" class="mt-1 block w-32 rounded-lg border border-border bg-surface px-2 py-1.5 font-data" bind:value={t.inventario} /></label>
          <div class="font-data text-sm">{porcentajeLleno(t.inventario, t.capacidad).toFixed(1)}%</div>
        </div>
      {/each}
    </SectionCard>

    <SectionCard title="Silo 8 — Compuertas">
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {#each compuertas as c}
          <div class="flex items-center gap-2 rounded-lg border border-border p-2">
            <span class="w-24 text-sm font-semibold">Compuerta {c.numero}</span>
            <input type="number" inputmode="decimal" step="0.5" class="w-16 rounded-lg border border-border bg-surface px-2 py-1 font-data" bind:value={c.horas} />
            <input class="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-1 text-sm" placeholder="comentario" bind:value={c.comentario} />
          </div>
        {/each}
      </div>
    </SectionCard>
  </div>

  <SectionCard title="Vehículos y observaciones">
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <label class="text-sm">Llamado<input type="number" inputmode="numeric" class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-data" bind:value={veh.llamado} /></label>
      <label class="text-sm">Proceso<input type="number" inputmode="numeric" class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-data" bind:value={veh.proceso} /></label>
      <label class="text-sm">Playa<input type="number" inputmode="numeric" class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-data" bind:value={veh.playa} /></label>
      <div class="flex items-end font-bold">Total: <span class="ml-1 font-data">{totalVeh}</span></div>
    </div>
    <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <span class="block text-sm">Acumulado del mes (auto + ajuste)</span>
        <div class="mt-1 rounded-lg border border-border bg-surface-2 px-3 py-2 font-data font-bold">{acumuladoConAjuste.toFixed(2)} TM</div>
      </div>
      <label class="block text-sm">Ajuste manual del acumulado<input type="number" inputmode="numeric" class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-data" bind:value={acumuladoAjuste} /></label>
    </div>
    <label class="mt-4 block text-sm">Comentario general<textarea rows="2" class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2" bind:value={comentario}></textarea></label>
  </SectionCard>

  <!-- Acciones móviles (sticky) -->
  <div class="sticky bottom-24 z-10 mt-4 flex gap-2 sm:hidden">
    <button onclick={recargar} class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-surface-2 px-4 py-3 text-sm font-bold text-ink shadow"><RotateCcw size={16} /> Recargar</button>
    <button onclick={guardar} disabled={guardando} class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-on-primary shadow disabled:opacity-50"><Save size={16} /> {guardando ? 'Guardando…' : 'Guardar'}</button>
  </div>
{/if}
```

- [ ] **Step 2: Build** (`npm run build`) — Expected: correcto.
- [ ] **Step 3: Commit**

```bash
git add src/routes/registro/+page.svelte
git commit -m "feat: página Registro (captura completa, responsive, autosave UX)"
```

---

## Task 12: Página Dashboard

**Files:** Create `src/routes/+page.svelte`.

- [ ] **Step 1: Implementar `src/routes/+page.svelte`**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import KPICard from '$lib/components/KPICard.svelte';
  import SectionCard from '$lib/components/SectionCard.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import ResponsiveTable from '$lib/components/ResponsiveTable.svelte';
  import ChartCard from '$lib/components/ChartCard.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import { totalTm, totalBolsas, cumplimiento, pivotComparativa, rendimiento, rendimientoPromedio, variacionPct, planDiario } from '$lib/calc';
  import { MESES_CORTOS } from '$lib/constants';
  import {
    getParticipacionDia, getDespachoPorFamilia, getComparativaAnual, getPlanVsReal, getUltimosDespachosDiarios,
    getMaquinasDia, getCompuertasDia, getPlanAnual, getPlanSemanal, getPlanesEspeciales, despachoMes,
    type ParticipacionRow, type FamiliaRow, type ComparativaRow, type PlanVsRealRow, type MaquinaDiaRow
  } from '$lib/repo';
  import { fechaSeleccionada } from '$lib/stores';
  import type { PlanSemanal, PlanesEspeciales, Planes } from '$lib/types';

  let cargando = $state(true);
  let parti = $state<ParticipacionRow[]>([]);
  let familias = $state<FamiliaRow[]>([]);
  let comparativa = $state<ComparativaRow[]>([]);
  let planVsReal = $state<PlanVsRealRow[]>([]);
  let maquinas = $state<MaquinaDiaRow[]>([]);
  let compuertas = $state<{ numero: number; horas: number; comentario: string }[]>([]);
  let planes = $state<Planes>({ planMensual: 0, planAnual: 0 });
  let planSemanal = $state<PlanSemanal>({});
  let planesEspeciales = $state<PlanesEspeciales>({});
  let acumMes = $state(0);
  let acumMesAnt = $state(0);
  let evol = $state<{ label: string; real: number; plan: number }[]>([]);

  const tmDia = $derived(totalTm(parti));
  const bolsasDia = $derived(totalBolsas(parti));
  const pctPlanMensual = $derived(planes.planMensual ? (tmDia / planes.planMensual) * 100 : 0);
  const vsMesAnt = $derived(variacionPct(acumMes, acumMesAnt));
  const rendProm = $derived(rendimientoPromedio(maquinas.map((m) => ({ ratio_ecs: m.ratio_ecs, ratio_ideal: m.ratio_ideal }))));
  const sparkReal = $derived(evol.map((e) => e.real));

  // CSS vars -> color para Chart.js
  function cssVar(name: string) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  const chartEvolucion = $derived.by(() => ({
    type: 'bar' as const,
    data: {
      labels: evol.map((e) => e.label),
      datasets: [
        { label: 'Despacho real (TM)', data: evol.map((e) => e.real), backgroundColor: cssVar('--c-primary') || '#034694' },
        { label: 'Plan diario (TM)', type: 'line' as const, data: evol.map((e) => e.plan), borderColor: cssVar('--c-accent') || '#d97706', borderDash: [5, 5], fill: false, tension: 0.1 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const } } }
  }));

  const chartComparativa = $derived.by(() => {
    const pivot = pivotComparativa(comparativa);
    const anios = [...new Set(comparativa.map((r) => r.anio))].sort();
    const paleta = ['#94a3b8', cssVar('--c-accent') || '#d97706', cssVar('--c-primary') || '#034694', cssVar('--c-success') || '#16a34a'];
    return {
      type: 'bar' as const,
      data: {
        labels: [...MESES_CORTOS],
        datasets: anios.map((a, i) => ({ label: String(a), backgroundColor: paleta[i % paleta.length], data: MESES_CORTOS.map((_, idx) => pivot.find((p) => p.mes === idx + 1)?.valores[a] ?? null) }))
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const } } }
    };
  });

  const chartFamilias = $derived.by(() => ({
    type: 'doughnut' as const,
    data: {
      labels: familias.map((f) => f.familia),
      datasets: [{ data: familias.map((f) => Number(f.tm)), backgroundColor: ['#034694','#2563eb','#d97706','#16a34a','#dc2626','#94a3b8','#7c3aed','#0891b2','#ca8a04'] }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' as const } } }
  }));

  onMount(load);
  $effect(() => { $fechaSeleccionada; load(); });

  async function load() {
    cargando = true;
    const fecha = get(fechaSeleccionada);
    const anio = Number(fecha.slice(0, 4));
    const [y, mo] = fecha.split('-').map(Number);
    const d = new Date(fecha); const desde = new Date(d); desde.setDate(d.getDate() - 6);
    const [pp, ff, cc, pvr, serie, maq, comp, am, plA, plS, plE] = await Promise.all([
      getParticipacionDia(fecha), getDespachoPorFamilia(fecha), getComparativaAnual(), getPlanVsReal(anio),
      getUltimosDespachosDiarios(desde.toISOString().slice(0, 10), fecha), getMaquinasDia(fecha), getCompuertasDia(fecha),
      despachoMes(y, mo), getPlanAnual(anio), getPlanSemanal(), getPlanesEspeciales()
    ]);
    parti = pp; familias = ff; comparativa = cc; planVsReal = pvr; maquinas = maq; compuertas = comp;
    acumMes = am; planes = plA; planSemanal = plS; planesEspeciales = plE;
    const mAnt = mo === 1 ? 12 : mo - 1, yAnt = mo === 1 ? y - 1 : y;
    acumMesAnt = await despachoMes(yAnt, mAnt);
    const dias: string[] = [];
    for (let i = 6; i >= 0; i--) { const x = new Date(d); x.setDate(d.getDate() - i); dias.push(x.toISOString().slice(0, 10)); }
    const real = new Map(serie.map((s) => [s.fecha, s.tm]));
    evol = dias.map((f) => ({ label: f.slice(5), real: real.get(f) ?? 0, plan: planDiario(f, planSemanal, planesEspeciales) }));
    cargando = false;
  }
</script>

<h1 class="mb-5 text-xl font-extrabold text-ink lg:text-2xl">Dashboard — {$fechaSeleccionada}</h1>

{#if cargando}
  <div class="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">{#each Array(6) as _}<Skeleton class="h-28 rounded-2xl" />{/each}</div>
  <Skeleton class="mt-5 h-72 rounded-2xl" />
{:else}
  <!-- KPIs originales del index.html + bolsas -->
  <div class="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
    <KPICard label="Despacho del día" value={tmDia} decimals={2} suffix=" TM" spark={sparkReal} />
    <KPICard label="vs Plan Mensual" value={pctPlanMensual} decimals={1} suffix="%" />
    <KPICard label="Acumulado Mes" value={acumMes} decimals={2} suffix=" TM" />
    <KPICard label="vs Mes Anterior" value={vsMesAnt} decimals={1} suffix="%" />
    <KPICard label="Rendimiento Máquinas" value={rendProm} decimals={1} suffix="%" />
    <KPICard label="Bolsas del día" value={bolsasDia} />
  </div>

  <div class="mt-5">
    <SectionCard title="Evolución últimos 7 días — real vs plan diario">
      <ChartCard config={chartEvolucion} />
    </SectionCard>
  </div>

  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <SectionCard title="Despacho por familia">
      {#if familias.length}<ChartCard config={chartFamilias} />
      {:else}<EmptyState titulo="Sin datos del día" descripcion="Registra el parte para ver el desglose por familia." />{/if}
    </SectionCard>

    <SectionCard title="Despachos del día (TM) — alta demanda destacada (>10%)">
      {#if parti.length}
        <ResponsiveTable
          columns={[ {key:'tipo',label:'Tipo'}, {key:'familia',label:'Familia'}, {key:'bolsas',label:'Bolsas',mono:true}, {key:'tm',label:'TM',mono:true}, {key:'pct',label:'%',mono:true} ]}
          rows={parti.map((p) => ({ tipo: p.tipo, familia: p.familia, bolsas: p.bolsas, tm: Number(p.tm).toFixed(2), pct: Number(p.pct).toFixed(1) + '%', _hot: p.pct > 10 }))}
          rowClass={(r) => r._hot ? 'bg-warning/10 font-semibold text-warning' : ''} />
        <div class="mt-3 text-sm"><strong>Acumulado del mes:</strong> <span class="font-data">{acumMes.toFixed(2)}</span> TM</div>
      {:else}<EmptyState titulo="Sin despachos" />{/if}
    </SectionCard>
  </div>

  <!-- Resumen máquinas (paridad index.html) con estado -->
  <SectionCard title="Resumen máquinas (rendimiento y estado)">
    {#if maquinas.length}
      <div class="hidden overflow-x-auto md:block">
        <table class="w-full border-collapse text-sm">
          <thead><tr class="border-b border-border text-left text-muted-ink">
            <th class="px-3 py-2">Máquina</th><th class="px-3 py-2">Horas</th><th class="px-3 py-2">Ratio ECS</th><th class="px-3 py-2">Rendimiento</th><th class="px-3 py-2">Estado</th>
          </tr></thead>
          <tbody>
            {#each maquinas as m}
              <tr class="border-b border-border">
                <td class="px-3 py-2 font-semibold">{m.nombre}</td>
                <td class="px-3 py-2 font-data">{m.horas_maquina}</td>
                <td class="px-3 py-2 font-data">{m.ratio_ecs}</td>
                <td class="px-3 py-2 font-data">{rendimiento(m.ratio_ecs, m.ratio_ideal).toFixed(1)}%</td>
                <td class="px-3 py-2"><StatusBadge estado={m.averia_critica} /></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="flex flex-col gap-2 md:hidden">
        {#each maquinas as m}
          <div class="rounded-xl border border-border bg-surface-2/40 p-3">
            <div class="mb-1 flex items-center justify-between font-semibold"><span>{m.nombre}</span><StatusBadge estado={m.averia_critica} /></div>
            <div class="flex justify-between text-sm text-muted-ink"><span>Horas</span><span class="font-data text-ink">{m.horas_maquina}</span></div>
            <div class="flex justify-between text-sm text-muted-ink"><span>Ratio ECS</span><span class="font-data text-ink">{m.ratio_ecs}</span></div>
            <div class="flex justify-between text-sm text-muted-ink"><span>Rendimiento</span><span class="font-data text-ink">{rendimiento(m.ratio_ecs, m.ratio_ideal).toFixed(1)}%</span></div>
          </div>
        {/each}
      </div>
    {:else}<EmptyState titulo="Sin datos de máquinas" descripcion="Registra el parte del día." />{/if}
  </SectionCard>

  <!-- Resumen Silo 8 (paridad index.html) -->
  <SectionCard title="Resumen Silo 8 — horas por compuerta">
    {#if compuertas.length}
      <ResponsiveTable
        columns={[ {key:'comp',label:'Compuerta'}, {key:'horas',label:'Horas trabajadas',mono:true}, {key:'com',label:'Comentario'} ]}
        rows={compuertas.map((c) => ({ comp: `Compuerta ${c.numero}`, horas: c.horas, com: c.comentario || '-' }))} />
    {:else}<EmptyState titulo="Sin datos de Silo 8" />{/if}
  </SectionCard>

  <SectionCard title="Comparativa de despacho mensual por año">
    <ChartCard config={chartComparativa} />
  </SectionCard>

  <SectionCard title="Plan vs Real {$fechaSeleccionada.slice(0,4)}">
    {#if planVsReal.length}
      <ResponsiveTable
        columns={[ {key:'mes',label:'Mes'}, {key:'plan',label:'Plan (TM)',mono:true}, {key:'real',label:'Real (TM)',mono:true}, {key:'cumpl',label:'Cumplimiento',mono:true} ]}
        rows={planVsReal.map((r) => ({ mes: MESES_CORTOS[r.mes-1], plan: Number(r.plan_tm).toFixed(0), real: Number(r.real_tm).toFixed(0), cumpl: Number(r.cumplimiento_pct).toFixed(1) + '%' }))} />
    {:else}<EmptyState titulo="Sin plan cargado" />{/if}
  </SectionCard>
{/if}
```

- [ ] **Step 2: Build** (`npm run build`) — Expected: correcto.
- [ ] **Step 3: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: dashboard (5 KPIs, evolución 7d vs plan, resumen máquinas y Silo 8, donut familias, comparativa multi-anual, plan vs real)"
```

---

## Task 13: Página Configuración (paridad index.html)

**Files:** Create `src/routes/config/+page.svelte`.

- [ ] **Step 1: Implementar `src/routes/config/+page.svelte`**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import SectionCard from '$lib/components/SectionCard.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import { toast } from '$lib/components/toastStore';
  import { MAQUINAS, TEMPORALES, DIAS_SEMANA } from '$lib/constants';
  import {
    getTipos, crearTipo, actualizarTipo, eliminarTipo,
    getPlanSemanal, guardarPlanSemanal, getPlanesEspeciales, guardarPlanEspecial, eliminarPlanEspecial,
    getPlanAnual, guardarPlanAnual
  } from '$lib/repo';
  import { fechaSeleccionada } from '$lib/stores';
  import type { TipoB, PlanSemanal, PlanesEspeciales } from '$lib/types';
  import { Save, Plus, Trash2 } from 'lucide-svelte';

  const FAMILIAS = ['GU','IP','HE','HS','MS','TIPO I','BLANCO','FILLER','OTRO'];
  let cargando = $state(true);
  let tipos = $state<TipoB[]>([]);
  let planSemanal = $state<PlanSemanal>({});
  let planesEspeciales = $state<PlanesEspeciales>({});
  let planMensual = $state(0);
  let planAnual = $state(0);
  let nuevaFecha = $state('');
  let nuevoValor = $state<number | null>(null);
  let nuevoTipo = $state('');

  const fechasEsp = $derived(Object.keys(planesEspeciales).sort());
  const anio = $derived(Number(get(fechaSeleccionada).slice(0, 4)));

  onMount(async () => { await recargar(); cargando = false; });

  async function recargar() {
    const a = Number(get(fechaSeleccionada).slice(0, 4));
    const [t, ps, pe, pa] = await Promise.all([getTipos(), getPlanSemanal(), getPlanesEspeciales(), getPlanAnual(a)]);
    tipos = t; planSemanal = { ...ps }; planesEspeciales = { ...pe };
    planMensual = pa.planMensual; planAnual = pa.planAnual;
    for (const d of DIAS_SEMANA) if (planSemanal[d] === undefined) planSemanal[d] = 0;
  }

  async function salvarSemanal() { await guardarPlanSemanal($state.snapshot(planSemanal)); toast('Plan semanal guardado'); }
  async function salvarAnual() { await guardarPlanAnual(anio, Number(planMensual) || 0, Number(planAnual) || 0); toast('Planes mensual/anual guardados'); }

  async function addEspecial() {
    if (!nuevaFecha || nuevoValor === null || isNaN(Number(nuevoValor))) return toast('Seleccione fecha y valor válido', true);
    await guardarPlanEspecial(nuevaFecha, Number(nuevoValor));
    planesEspeciales = { ...planesEspeciales, [nuevaFecha]: Number(nuevoValor) };
    nuevaFecha = ''; nuevoValor = null; toast('Plan especial guardado');
  }
  async function quitarEspecial(fecha: string) {
    await eliminarPlanEspecial(fecha);
    const { [fecha]: _, ...resto } = planesEspeciales; planesEspeciales = resto; toast('Plan especial eliminado');
  }

  async function addTipo() {
    const nombre = nuevoTipo.trim();
    if (!nombre) return toast('Escriba un nombre de tipo', true);
    await crearTipo(nombre); nuevoTipo = ''; await recargar(); toast('Tipo agregado');
  }
  async function salvarTipo(t: TipoB) { await actualizarTipo(t.id, { nombre: t.nombre, familia: t.familia }); toast('Tipo actualizado'); }
  async function quitarTipo(id: number) { await eliminarTipo(id); tipos = tipos.filter((x) => x.id !== id); toast('Tipo eliminado'); }
</script>

<h1 class="mb-5 text-xl font-extrabold text-ink lg:text-2xl">Configuración</h1>

{#if cargando}
  <div class="flex flex-col gap-3">{#each Array(4) as _}<Skeleton class="h-40 rounded-2xl" />{/each}</div>
{:else}
  <SectionCard title="Plan diario por día de semana (TM)">
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {#each DIAS_SEMANA as dia}
        <label class="text-sm">{dia}<input type="number" inputmode="numeric" class="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-2 font-data" bind:value={planSemanal[dia]} /></label>
      {/each}
    </div>
    <button onclick={salvarSemanal} class="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-on-primary"><Save size={16} /> Guardar plan semanal</button>
  </SectionCard>

  <SectionCard title="Plan especial para fecha específica (TM)">
    <div class="flex flex-wrap items-end gap-3">
      <label class="text-sm">Fecha<input type="date" class="mt-1 block rounded-lg border border-border bg-surface px-3 py-2" bind:value={nuevaFecha} /></label>
      <label class="text-sm">Plan (TM)<input type="number" inputmode="numeric" class="mt-1 block w-32 rounded-lg border border-border bg-surface px-3 py-2 font-data" bind:value={nuevoValor} /></label>
      <button onclick={addEspecial} class="inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm font-bold text-ink"><Plus size={16} /> Agregar/Actualizar</button>
    </div>
    <div class="mt-4">
      {#if fechasEsp.length === 0}
        <p class="text-sm text-muted-ink">No hay planes especiales definidos.</p>
      {:else}
        <div class="flex flex-col gap-2">
          {#each fechasEsp as f}
            <div class="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
              <span class="font-data">{f}</span>
              <span class="font-data text-muted-ink">{planesEspeciales[f]} TM</span>
              <button onclick={() => quitarEspecial(f)} aria-label="Eliminar" class="ml-auto grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-danger"><Trash2 size={16} /></button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </SectionCard>

  <SectionCard title="Planes mensual y anual (TM)">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label class="text-sm">Plan mensual<input type="number" inputmode="numeric" class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-data" bind:value={planMensual} /></label>
      <label class="text-sm">Plan anual<input type="number" inputmode="numeric" class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-data" bind:value={planAnual} /></label>
    </div>
    <button onclick={salvarAnual} class="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-on-primary"><Save size={16} /> Guardar planes</button>
  </SectionCard>

  <SectionCard title="Tipos de cemento (lista maestra)">
    <div class="mb-3 flex flex-wrap items-end gap-2">
      <label class="flex-1 text-sm">Nuevo tipo<input class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2" bind:value={nuevoTipo} placeholder="Nombre del tipo" /></label>
      <button onclick={addTipo} class="inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm font-bold text-ink"><Plus size={16} /> Agregar</button>
    </div>
    <div class="flex flex-col gap-2">
      {#each tipos as t (t.id)}
        <div class="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2">
          <input class="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm" bind:value={t.nombre} />
          <select class="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm" bind:value={t.familia}>
            {#each FAMILIAS as fa}<option value={fa}>{fa}</option>{/each}
          </select>
          <button onclick={() => salvarTipo(t)} aria-label="Guardar tipo" class="grid h-9 w-9 place-items-center rounded-lg bg-primary text-on-primary"><Save size={16} /></button>
          <button onclick={() => quitarTipo(t.id)} aria-label="Eliminar tipo" class="grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-danger"><Trash2 size={16} /></button>
        </div>
      {/each}
    </div>
  </SectionCard>

  <SectionCard title="Datos fijos del sistema">
    <p class="mb-1 font-semibold">Capacidades de temporales (fijas):</p>
    <ul class="mb-3 ml-5 list-disc text-sm text-muted-ink">{#each TEMPORALES as t}<li>{t.nombre}: {t.capacidad} TM</li>{/each}</ul>
    <p class="mb-1 font-semibold">Ratios ideales de máquinas (fijos):</p>
    <ul class="ml-5 list-disc text-sm text-muted-ink">{#each MAQUINAS as m}<li>{m.nombre}: Ratio Ideal = {m.ratio_ideal}</li>{/each}</ul>
    <p class="mt-2 text-xs text-muted-ink">Valores predefinidos; no se modifican desde la interfaz.</p>
  </SectionCard>
{/if}
```

- [ ] **Step 2: Build** (`npm run build`) — Expected: correcto.
- [ ] **Step 3: Commit**

```bash
git add src/routes/config/+page.svelte
git commit -m "feat: página Configuración (plan semanal/especial/mensual-anual, tipos editables, datos fijos)"
```

---

## Task 14: Verificación final

- [ ] **Step 1: Tests** — `npx vitest run` → PASS (`calc.test.ts`). Eliminar tests demo del scaffold si sobran.
- [ ] **Step 2: Typecheck + build** — `npm run check && npm run build` → sin errores.
- [ ] **Step 3: Verificación manual** — `npm run preview` y comprobar:
  - **Responsive** a 375 / 768 / 1024 / 1440: sidebar en ≥1024, bottom-nav (3 ítems) en <1024, tablas → tarjetas en móvil, sin scroll horizontal.
  - **Tema**: toggle claro/oscuro persiste y sin flash al recargar; contraste legible en ambos.
  - **Dashboard (paridad index.html)**: los **5 KPIs** (despacho día, % vs plan mensual, acumulado mes, vs mes anterior, rendimiento máquinas) + bolsas; **evolución 7 días real vs plan**; **resumen máquinas con estado**; **resumen Silo 8**; además donut familias, comparativa multi-anual (2024/2025 sembrados), plan vs real.
  - **Registro**: capturar y guardar; recargar fecha → persiste en Supabase; totales en vivo; **acumulado del mes (auto + ajuste)** visible.
  - **Configuración (paridad index.html)**: plan semanal, planes especiales (agregar/eliminar), plan mensual/anual, tipos (agregar/editar/eliminar), datos fijos.
  - **Reduced-motion** activado: sin animaciones bruscas.
- [ ] **Step 4: Verificar datos** — MCP `execute_sql`: `select * from v_despacho_por_familia where fecha='<fecha>';` coherente.
- [ ] **Step 5: README**

```markdown
# Dashboard Planta Yura — Operations Cockpit
SvelteKit + Supabase. Captura manual y analítica de despacho de cemento.
## Desarrollo
- `npm run dev` / `npm run build` / `npm run preview` / `npx vitest run`
## Rutas: `/` (dashboard), `/registro`, `/config`
## Requiere `.env` con PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY.
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: verificación final, README y limpieza"
```

---

## Self-Review (completado por el autor del plan)

- **Paridad index.html (verificada función por función):**
  - Registro: despacho por tipo, temporales+%lleno, máquinas (rend/util/estado), Silo 8, vehículos+total, **acumulado mes auto+ajuste**, comentario, guardar/cargar → Task 11. ✅
  - Dashboard: **5 KPIs** (despacho día, % vs plan mensual, acumulado mes, vs mes anterior, rendimiento promedio), participación con destacado >10%, **evolución 7d real vs plan**, **resumen máquinas+estado**, **resumen Silo 8** → Task 12. ✅
  - Configuración: plan semanal, planes especiales (add/editar/eliminar), plan mensual/anual, **tipos editables (add/edit/delete)**, datos fijos → Task 13. ✅
- **Cobertura de extensiones:** bolsas+ventas+familia (Tasks 11/12), comparativa multi-anual + plan vs real + seed real (Tasks 6/7/8/12). ✅
- **Diseño/responsive/interacción:** tokens light/dark + fuentes + blueprint (Task 1); sidebar/bottom-nav (3 ítems) + tablas→tarjetas (Tasks 9/10/11/12); KPIs animados, sparkline, donut, skeletons, toasts, tema (Tasks 9/12/13). ✅
- **Placeholders:** sin "TBD/TODO"; SQL y componentes completos; seed con valores reales. ✅
- **Consistencia de tipos:** `ParteCompleto`, `TipoB`, `Planes`, `PlanSemanal`, `PlanesEspeciales`, `ParticipacionRow`, `FamiliaRow`, `ComparativaRow`, `PlanVsRealRow`, `MaquinaDiaRow`, y firmas (`planDiario`, `rendimientoPromedio`, `despachoMes`, `getMaquinasDia`, `getCompuertasDia`, `getPlan*`) coinciden entre `repo.ts`, `calc.ts`, componentes y páginas. ✅
- **Accesibilidad:** focus/contraste por tokens AA, `aria-label` en botones de icono, `aria-live` en toasts, `prefers-reduced-motion` en CSS y CountUp, targets ≥44px, color + icono/signo (no color solo). ✅
- **Notas:** RLS permisiva (deuda de seguridad, sin auth); histórico solo 2024/2025 (sin solape con cómputo en vivo 2026+).
```
