# Vista B — Dashboard Planta Yura "con superpoderes" (Supabase) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la Vista B: un superset de la Vista A (todo lo operativo de A **más** bolsas, ventas, despacho por familia y comparativa multi-anual 2024/2025/2026) sobre Supabase/Postgres, dentro de la misma app SvelteKit, bajo rutas `/avanzado`.

**Architecture:** Misma app SvelteKit de la Vista A. Vista B añade un backend Supabase (Postgres) con esquema relacional (parte diario → despacho/ventas/operativo), vistas SQL para analítica, seed histórico desde el Excel, tipos TS autogenerados, y rutas `/avanzado` que reutilizan los componentes y la lógica pura de la Vista A. Cliente `@supabase/supabase-js` con RLS permisiva (sin auth, como la Vista A).

**Tech Stack:** SvelteKit + Svelte 5 (runes), TypeScript, Supabase (Postgres + `@supabase/supabase-js`), Tailwind CSS v4, Chart.js v4, Vitest.

**DEPENDENCIA:** Este plan asume que la **Vista A ya está implementada** en el mismo repo (existen `src/lib/components/*`, `src/lib/calc.ts`, `src/lib/stores.ts`, `src/lib/constants.ts`, `src/routes/+layout.svelte`, tema Yura en `src/app.css`). Si Vista A no está mergeada, ejecutar primero su plan.

**Referencia de datos:** `index.html` y los Excel en la raíz. Los valores de seed de este plan se extrajeron de `02. Reporte Despacho Dia 2025v1 (004).xlsx` (hoja `21.05` comparativa y `Plan ventas 2026`).

---

## Decisiones de alcance (cerradas)
- **Captura:** Vista B captura el **parte diario completo** (todo lo de A: despacho, máquinas, temporales, Silo 8, vehículos; planes) **+ bolsas por tipo + ventas**. Es "A con superpoderes". (Implica doble captura del despacho respecto a la Vista A en Firebase — aceptado.)
- **Histórico:** se **siembra 2024 y 2025** (totales mensuales de despacho) desde el Excel. El 2026+ se computa en vivo desde la captura (sin solape con el histórico).
- **Provisioning:** el proyecto Supabase se **crea como paso del plan** (Task 1), vía el MCP de Supabase, confirmando coste.

## File Structure (lo que añade Vista B)
```
supabase/
  migrations/
    0001_schema.sql        # tablas
    0002_views.sql         # vistas analíticas
    0003_seed.sql          # tipos+familia, masters, histórico, plan
src/
  lib/
    supabase/
      client.ts            # createClient (browser, PUBLIC_ env)
      types.gen.ts         # tipos generados desde el esquema
    repo_b.ts              # API tipada sobre Supabase
    calc_b.ts              # cálculos puros extra (familia, peso prom., variación, cumplimiento)
    calc_b.test.ts         # tests Vitest
  routes/
    avanzado/
      +layout.svelte       # subnav Vista B
      +page.svelte         # dashboard avanzado
      registro/+page.svelte# captura completa (A + bolsas + ventas)
.env                       # PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY
```

---

## Task 1: Crear proyecto Supabase, cliente y variables de entorno

**Files:**
- Create: `.env`, `.env.example`
- Create: `src/lib/supabase/client.ts`
- Modify: `.gitignore` (asegurar que `.env` está ignorado)

- [ ] **Step 1: Instalar el SDK de Supabase**

Run:
```bash
npm install @supabase/supabase-js
```

- [ ] **Step 2: Crear el proyecto Supabase vía MCP (confirmando coste)**

Usar las herramientas MCP de Supabase en este orden:
1. `list_organizations` → tomar el `id` de la organización.
2. `get_cost` con `type: "project"` y el `organization_id` → obtener `amount` y confirmar con `confirm_cost` (devuelve un `confirm_cost_id`).
3. `create_project` con `name: "planta-yura-vistab"`, `organization_id`, `confirm_cost_id`, `region` cercana (p. ej. `us-east-1` o `sa-east-1`).
4. Esperar a que el estado sea activo; `get_project_url` y `get_publishable_keys` para la URL y la anon/publishable key.

Expected: proyecto creado, URL y anon key disponibles.

> Alternativa sin MCP: crear el proyecto en https://supabase.com/dashboard manualmente y copiar URL + anon key.

- [ ] **Step 3: Crear `.env` y `.env.example`**

`.env` (rellenar con los valores reales del Step 2):
```
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
```
`.env.example`:
```
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 4: Asegurar `.env` ignorado en git**

Verificar que `.gitignore` contiene `.env`. Si no, añadir la línea `.env`.

- [ ] **Step 5: Crear `src/lib/supabase/client.ts`**

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
  }
  return _client;
}
```

- [ ] **Step 6: Verificar build**

Run:
```bash
npm run build
```
Expected: build correcto (las vars `PUBLIC_*` deben existir en `.env`).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .env.example .gitignore src/lib/supabase/client.ts
git commit -m "feat(vistaB): SDK Supabase, cliente y env (proyecto creado)"
```

---

## Task 2: Migración de esquema (tablas)

**Files:**
- Create: `supabase/migrations/0001_schema.sql`

- [ ] **Step 1: Escribir `supabase/migrations/0001_schema.sql`**

```sql
-- Masters
create table tipo_cemento (
  id            bigint generated always as identity primary key,
  nombre        text not null unique,
  familia       text not null default 'OTRO',
  presentacion  text not null default 'bolsa42.5',
  peso_kg       numeric,
  activo        boolean not null default true,
  orden         int not null default 0
);

create table maquina (
  id          text primary key,         -- H1..H5, V
  nombre      text not null,
  ratio_ideal int not null
);

create table temporal (
  id        bigint generated always as identity primary key,
  nombre    text not null unique,
  capacidad numeric not null
);

-- Parte diario (cabecera)
create table parte_diario (
  id                bigint generated always as identity primary key,
  fecha             date not null unique,
  veh_llamado       int not null default 0,
  veh_proceso       int not null default 0,
  veh_playa         int not null default 0,
  acumulado_ajuste  numeric not null default 0,
  comentario        text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Líneas operativas / comerciales
create table despacho (
  id        bigint generated always as identity primary key,
  parte_id  bigint not null references parte_diario(id) on delete cascade,
  tipo_id   bigint not null references tipo_cemento(id),
  bolsas    numeric not null default 0,
  tm        numeric not null default 0,
  unique (parte_id, tipo_id)
);

create table venta_diaria (
  parte_id        bigint primary key references parte_diario(id) on delete cascade,
  nacional_tm     numeric not null default 0,
  export_tm       numeric not null default 0,
  a_construir_tm  numeric not null default 0
);

create table maquina_registro (
  parte_id        bigint not null references parte_diario(id) on delete cascade,
  maquina_id      text not null references maquina(id),
  horas_maquina   numeric not null default 0,
  ratio_ecs       int not null default 0,
  operativos      int not null default 0,
  comentario      text not null default '',
  averia_critica  text not null default 'verde',
  primary key (parte_id, maquina_id)
);

create table temporal_registro (
  parte_id     bigint not null references parte_diario(id) on delete cascade,
  temporal_id  bigint not null references temporal(id),
  inventario   numeric not null default 0,
  primary key (parte_id, temporal_id)
);

create table compuerta_registro (
  parte_id   bigint not null references parte_diario(id) on delete cascade,
  numero     int not null,
  horas      numeric not null default 0,
  comentario text not null default '',
  primary key (parte_id, numero)
);

-- Planes
create table plan_semanal (
  dia text primary key,  -- Lunes..Domingo
  tm  numeric not null default 0
);

create table plan_especial (
  fecha date primary key,
  tm    numeric not null default 0
);

create table plan_anual (
  anio          int primary key,
  plan_mensual  numeric not null default 0,
  plan_anual    numeric not null default 0
);

create table plan_ventas_familia (
  anio    int not null,
  mes     int not null check (mes between 1 and 12),
  familia text not null,
  tm      numeric not null default 0,
  primary key (anio, mes, familia)
);

-- Histórico de despacho mensual (años sin captura en vivo)
create table resumen_mensual_historico (
  anio        int not null,
  mes         int not null check (mes between 1 and 12),
  despacho_tm numeric not null,
  primary key (anio, mes)
);

-- updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_parte_updated
  before update on parte_diario
  for each row execute function set_updated_at();

-- RLS permisiva (sin auth, paridad con la Vista A abierta). DEUDA DE SEGURIDAD conocida.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($p$create policy "anon_all_%1$s" on public.%1$I for all to anon using (true) with check (true);$p$, t);
  end loop;
end $$;
```

- [ ] **Step 2: Aplicar la migración**

Vía MCP: `apply_migration` con `name: "0001_schema"` y el SQL anterior.
Alternativa CLI: `npx supabase db push` (con proyecto enlazado).
Expected: tablas creadas sin error.

- [ ] **Step 3: Verificar tablas**

Vía MCP: `list_tables` (schema `public`).
Expected: aparecen las 14 tablas creadas.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_schema.sql
git commit -m "feat(vistaB): esquema Supabase (tablas + RLS permisiva)"
```

---

## Task 3: Seed (tipos+familia, masters, histórico, plan)

**Files:**
- Create: `supabase/migrations/0003_seed.sql`

- [ ] **Step 1: Escribir `supabase/migrations/0003_seed.sql`**

```sql
-- Masters: máquinas (idénticas a index.html / Vista A)
insert into maquina (id, nombre, ratio_ideal) values
  ('H1','Haver 1',2400),('H2','Haver 2',3600),('H3','Haver 3',3900),
  ('H4','Haver 4',3900),('H5','Haver 5',3900),('V','Ventomatic',4300)
on conflict (id) do nothing;

-- Masters: temporales
insert into temporal (nombre, capacidad) values
  ('Temporal 1',2142),('Temporal 2',1890),('Misti',3006)
on conflict (nombre) do nothing;

-- Tipos de cemento con familia + presentación (mapeo best-effort de la lista por defecto)
insert into tipo_cemento (nombre, familia, presentacion, peso_kg, orden) values
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

-- Plan anual base (TOTAL plan 2026 ≈ suma de families; plan mensual indicativo = media)
insert into plan_anual (anio, plan_mensual, plan_anual) values
  (2026, 227210.594, 2726927.128)
on conflict (anio) do nothing;

-- Histórico despacho mensual 2024 y 2025 (TM) — del Excel hoja 21.05
insert into resumen_mensual_historico (anio, mes, despacho_tm) values
  (2024,1,204007.803),(2024,2,186305.944),(2024,3,199570.192),(2024,4,205343.728),
  (2024,5,209473.774),(2024,6,196506.860),(2024,7,219516.239),(2024,8,232937.965),
  (2024,9,231021.168),(2024,10,237591.573),(2024,11,215275.195),(2024,12,210045.588),
  (2025,1,190629.128),(2025,2,182874.285),(2025,3,197224.221),(2025,4,198970.758),
  (2025,5,212393.173),(2025,6,204590.000),(2025,7,222445.377),(2025,8,233567.971),
  (2025,9,234732.794),(2025,10,249609.074),(2025,11,242524.660),(2025,12,246279.444)
on conflict (anio, mes) do nothing;

-- Plan de ventas 2026 por familia (TM) — del Excel "Plan ventas 2026"
insert into plan_ventas_familia (anio, mes, familia, tm) values
  (2026,1,'gris_interno',192165.921),(2026,2,'gris_interno',179398.291),(2026,3,'gris_interno',194439.503),(2026,4,'gris_interno',198128.393),(2026,5,'gris_interno',210381.445),(2026,6,'gris_interno',199416.328),(2026,7,'gris_interno',215756.383),(2026,8,'gris_interno',223685.985),(2026,9,'gris_interno',235307.857),(2026,10,'gris_interno',237702.911),(2026,11,'gris_interno',226591.308),(2026,12,'gris_interno',225590.553),
  (2026,1,'gris_externo',11767.984),(2026,2,'gris_externo',12151.620),(2026,3,'gris_externo',12304.489),(2026,4,'gris_externo',11090.411),(2026,5,'gris_externo',10741.801),(2026,6,'gris_externo',12014.853),(2026,7,'gris_externo',13546.815),(2026,8,'gris_externo',12963.620),(2026,9,'gris_externo',12577.404),(2026,10,'gris_externo',13332.059),(2026,11,'gris_externo',13791.964),(2026,12,'gris_externo',13624.230),
  (2026,1,'blanco',1470),(2026,2,'blanco',1520),(2026,3,'blanco',1540),(2026,4,'blanco',1600),(2026,5,'blanco',1650),(2026,6,'blanco',1680),(2026,7,'blanco',1740),(2026,8,'blanco',1810),(2026,9,'blanco',1835),(2026,10,'blanco',1865),(2026,11,'blanco',1865),(2026,12,'blanco',1880),
  (2026,1,'filler',1425),(2026,2,'filler',1475),(2026,3,'filler',1500),(2026,4,'filler',1400),(2026,5,'filler',1500),(2026,6,'filler',1500),(2026,7,'filler',1600),(2026,8,'filler',1500),(2026,9,'filler',1500),(2026,10,'filler',1600),(2026,11,'filler',1500),(2026,12,'filler',1500)
on conflict (anio, mes, familia) do nothing;

-- Plan semanal inicial (vacío en 0; se edita en la UI)
insert into plan_semanal (dia, tm) values
  ('Lunes',0),('Martes',0),('Miércoles',0),('Jueves',0),('Viernes',0),('Sábado',0),('Domingo',0)
on conflict (dia) do nothing;
```

- [ ] **Step 2: Aplicar el seed**

Vía MCP: `apply_migration` con `name: "0003_seed"` y el SQL anterior.
Expected: filas insertadas sin error.

- [ ] **Step 3: Verificar conteos**

Vía MCP: `execute_sql` con:
```sql
select
  (select count(*) from tipo_cemento) tipos,
  (select count(*) from resumen_mensual_historico) hist,
  (select count(*) from plan_ventas_familia) plan;
```
Expected: `tipos=18`, `hist=24`, `plan=48`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0003_seed.sql
git commit -m "feat(vistaB): seed (tipos+familia, masters, histórico 2024/25, plan 2026)"
```

---

## Task 4: Vistas analíticas SQL

**Files:**
- Create: `supabase/migrations/0002_views.sql`

- [ ] **Step 1: Escribir `supabase/migrations/0002_views.sql`**

```sql
-- Participación por tipo de un parte (día)
create or replace view v_participacion_dia as
select
  p.fecha,
  tc.nombre as tipo,
  tc.familia,
  d.bolsas,
  d.tm,
  case when sum(d.tm) over (partition by p.fecha) = 0 then 0
       else d.tm / sum(d.tm) over (partition by p.fecha) * 100 end as pct
from parte_diario p
join despacho d on d.parte_id = p.id
join tipo_cemento tc on tc.id = d.tipo_id;

-- Despacho por familia y fecha
create or replace view v_despacho_por_familia as
select p.fecha, tc.familia,
       sum(d.bolsas) as bolsas,
       sum(d.tm) as tm
from parte_diario p
join despacho d on d.parte_id = p.id
join tipo_cemento tc on tc.id = d.tipo_id
group by p.fecha, tc.familia;

-- Despacho mensual en vivo (desde captura)
create or replace view v_despacho_mensual_live as
select extract(year from p.fecha)::int as anio,
       extract(month from p.fecha)::int as mes,
       sum(d.tm) as despacho_tm
from parte_diario p
join despacho d on d.parte_id = p.id
group by 1, 2;

-- Despacho mensual combinado (histórico + vivo). Sin solape: histórico solo 2024/2025.
create or replace view v_despacho_mensual as
select anio, mes, despacho_tm from resumen_mensual_historico
union all
select anio, mes, despacho_tm from v_despacho_mensual_live;

-- Comparativa anual: una fila por mes/año (formato largo, el cliente pivota)
create or replace view v_comparativa_anual as
select anio, mes, despacho_tm from v_despacho_mensual order by mes, anio;

-- Plan vs real mensual (plan total por mes = suma de familias)
create or replace view v_plan_vs_real as
select pv.anio, pv.mes,
       sum(pv.tm) as plan_tm,
       coalesce(l.despacho_tm, 0) as real_tm,
       case when sum(pv.tm) = 0 then 0
            else coalesce(l.despacho_tm,0) / sum(pv.tm) * 100 end as cumplimiento_pct
from plan_ventas_familia pv
left join v_despacho_mensual_live l on l.anio = pv.anio and l.mes = pv.mes
group by pv.anio, pv.mes, l.despacho_tm;
```

- [ ] **Step 2: Aplicar la migración de vistas**

Vía MCP: `apply_migration` con `name: "0002_views"` y el SQL anterior.
Expected: vistas creadas sin error.

- [ ] **Step 3: Verificar una vista**

Vía MCP: `execute_sql` con:
```sql
select anio, count(*) from v_comparativa_anual group by anio order by anio;
```
Expected: filas para 2024 (12) y 2025 (12) como mínimo.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_views.sql
git commit -m "feat(vistaB): vistas analíticas (participación, familia, comparativa, plan vs real)"
```

---

## Task 5: Tipos generados + repositorio Supabase

**Files:**
- Create: `src/lib/supabase/types.gen.ts`
- Create: `src/lib/repo_b.ts`

- [ ] **Step 1: Generar tipos TypeScript del esquema**

Vía MCP: `generate_typescript_types` → guardar la salida en `src/lib/supabase/types.gen.ts`.
Alternativa CLI: `npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.gen.ts`.
Expected: archivo con `export type Database = {...}`.

- [ ] **Step 2: Crear `src/lib/repo_b.ts`**

```ts
import { getSupabase } from './supabase/client';

export interface DespachoLineaB { tipo_id: number; nombre: string; familia: string; bolsas: number; tm: number; }
export interface VentaDia { nacional_tm: number; export_tm: number; a_construir_tm: number; }
export interface MaquinaRegB { maquina_id: string; horas_maquina: number; ratio_ecs: number; operativos: number; comentario: string; averia_critica: string; }
export interface TemporalRegB { temporal_id: number; inventario: number; }
export interface CompuertaRegB { numero: number; horas: number; comentario: string; }

export interface ParteCompleto {
  fecha: string;
  veh_llamado: number; veh_proceso: number; veh_playa: number;
  acumulado_ajuste: number; comentario: string;
  despachos: DespachoLineaB[];
  venta: VentaDia;
  maquinas: MaquinaRegB[];
  temporales: TemporalRegB[];
  compuertas: CompuertaRegB[];
}

export interface TipoB { id: number; nombre: string; familia: string; presentacion: string; orden: number; }

export async function getTipos(): Promise<TipoB[]> {
  const { data, error } = await getSupabase()
    .from('tipo_cemento').select('id,nombre,familia,presentacion,orden')
    .eq('activo', true).order('orden');
  if (error) throw error;
  return data ?? [];
}

async function getParteId(fecha: string): Promise<number | null> {
  const { data } = await getSupabase().from('parte_diario').select('id').eq('fecha', fecha).maybeSingle();
  return data?.id ?? null;
}

export async function guardarParte(p: ParteCompleto): Promise<void> {
  const sb = getSupabase();
  const { data: parte, error: e1 } = await sb.from('parte_diario').upsert({
    fecha: p.fecha, veh_llamado: p.veh_llamado, veh_proceso: p.veh_proceso, veh_playa: p.veh_playa,
    acumulado_ajuste: p.acumulado_ajuste, comentario: p.comentario
  }, { onConflict: 'fecha' }).select('id').single();
  if (e1) throw e1;
  const parteId = parte.id as number;

  // Reemplazar hijos del parte
  await sb.from('despacho').delete().eq('parte_id', parteId);
  if (p.despachos.length) {
    const { error } = await sb.from('despacho').insert(
      p.despachos.map((d) => ({ parte_id: parteId, tipo_id: d.tipo_id, bolsas: d.bolsas, tm: d.tm }))
    );
    if (error) throw error;
  }
  await sb.from('venta_diaria').upsert({ parte_id: parteId, ...p.venta }, { onConflict: 'parte_id' });

  await sb.from('maquina_registro').delete().eq('parte_id', parteId);
  if (p.maquinas.length) await sb.from('maquina_registro').insert(p.maquinas.map((m) => ({ parte_id: parteId, ...m })));

  await sb.from('temporal_registro').delete().eq('parte_id', parteId);
  if (p.temporales.length) await sb.from('temporal_registro').insert(p.temporales.map((t) => ({ parte_id: parteId, ...t })));

  await sb.from('compuerta_registro').delete().eq('parte_id', parteId);
  if (p.compuertas.length) await sb.from('compuerta_registro').insert(p.compuertas.map((c) => ({ parte_id: parteId, ...c })));
}

export interface ParticipacionRow { tipo: string; familia: string; bolsas: number; tm: number; pct: number; }
export async function getParticipacionDia(fecha: string): Promise<ParticipacionRow[]> {
  const { data, error } = await getSupabase().from('v_participacion_dia').select('*').eq('fecha', fecha);
  if (error) throw error;
  return (data ?? []) as ParticipacionRow[];
}

export interface FamiliaRow { familia: string; bolsas: number; tm: number; }
export async function getDespachoPorFamilia(fecha: string): Promise<FamiliaRow[]> {
  const { data, error } = await getSupabase().from('v_despacho_por_familia').select('familia,bolsas,tm').eq('fecha', fecha);
  if (error) throw error;
  return (data ?? []) as FamiliaRow[];
}

export interface ComparativaRow { anio: number; mes: number; despacho_tm: number; }
export async function getComparativaAnual(): Promise<ComparativaRow[]> {
  const { data, error } = await getSupabase().from('v_comparativa_anual').select('*');
  if (error) throw error;
  return (data ?? []) as ComparativaRow[];
}

export interface PlanVsRealRow { anio: number; mes: number; plan_tm: number; real_tm: number; cumplimiento_pct: number; }
export async function getPlanVsReal(anio: number): Promise<PlanVsRealRow[]> {
  const { data, error } = await getSupabase().from('v_plan_vs_real').select('*').eq('anio', anio).order('mes');
  if (error) throw error;
  return (data ?? []) as PlanVsRealRow[];
}

export async function cargarParte(fecha: string): Promise<ParteCompleto | null> {
  const sb = getSupabase();
  const id = await getParteId(fecha);
  if (!id) return null;
  const [{ data: cab }, desp, venta, maq, temp, comp] = await Promise.all([
    sb.from('parte_diario').select('*').eq('id', id).single(),
    sb.from('despacho').select('tipo_id,bolsas,tm,tipo_cemento(nombre,familia)').eq('parte_id', id),
    sb.from('venta_diaria').select('*').eq('parte_id', id).maybeSingle(),
    sb.from('maquina_registro').select('*').eq('parte_id', id),
    sb.from('temporal_registro').select('*').eq('parte_id', id),
    sb.from('compuerta_registro').select('*').eq('parte_id', id)
  ]);
  return {
    fecha,
    veh_llamado: cab?.veh_llamado ?? 0, veh_proceso: cab?.veh_proceso ?? 0, veh_playa: cab?.veh_playa ?? 0,
    acumulado_ajuste: cab?.acumulado_ajuste ?? 0, comentario: cab?.comentario ?? '',
    despachos: (desp.data ?? []).map((d: any) => ({ tipo_id: d.tipo_id, nombre: d.tipo_cemento?.nombre ?? '', familia: d.tipo_cemento?.familia ?? '', bolsas: d.bolsas, tm: d.tm })),
    venta: { nacional_tm: venta.data?.nacional_tm ?? 0, export_tm: venta.data?.export_tm ?? 0, a_construir_tm: venta.data?.a_construir_tm ?? 0 },
    maquinas: (maq.data ?? []) as any,
    temporales: (temp.data ?? []) as any,
    compuertas: (comp.data ?? []) as any
  };
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
git add src/lib/supabase/types.gen.ts src/lib/repo_b.ts
git commit -m "feat(vistaB): tipos generados y repositorio Supabase"
```

---

## Task 6: Cálculos puros extra (TDD)

**Files:**
- Create: `src/lib/calc_b.ts`
- Test: `src/lib/calc_b.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Crear `src/lib/calc_b.test.ts`:
```ts
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
```

- [ ] **Step 2: Ejecutar tests para verificar que fallan**

Run:
```bash
npx vitest run src/lib/calc_b.test.ts
```
Expected: FAIL (no existe `./calc_b`).

- [ ] **Step 3: Implementar `src/lib/calc_b.ts`**

```ts
export function pesoPromedioKg(tm: number, bolsas: number): number {
  if (!bolsas) return 0;
  return (tm * 1000) / bolsas;
}

export function variacionPct(actual: number, base: number): number {
  if (!base) return 0;
  return ((actual - base) / base) * 100;
}

export function cumplimiento(real: number, plan: number): number {
  if (!plan) return 0;
  return (real / plan) * 100;
}

export function totalFamilia(filas: { familia: string; bolsas: number; tm: number }[]): number {
  return filas.reduce((s, f) => s + (Number(f.tm) || 0), 0);
}

export interface FilaComparativa { anio: number; mes: number; despacho_tm: number; }
export interface MesPivot { mes: number; valores: Record<number, number>; }

export function pivotComparativa(rows: FilaComparativa[]): MesPivot[] {
  const porMes = new Map<number, Record<number, number>>();
  for (const r of rows) {
    if (!porMes.has(r.mes)) porMes.set(r.mes, {});
    porMes.get(r.mes)![r.anio] = r.despacho_tm;
  }
  return [...porMes.keys()].sort((a, b) => a - b).map((mes) => ({ mes, valores: porMes.get(mes)! }));
}
```

- [ ] **Step 4: Ejecutar tests para verificar que pasan**

Run:
```bash
npx vitest run src/lib/calc_b.test.ts
```
Expected: PASS (todos).

- [ ] **Step 5: Commit**

```bash
git add src/lib/calc_b.ts src/lib/calc_b.test.ts
git commit -m "feat(vistaB): cálculos puros extra con tests (peso prom., variación, cumplimiento, pivot)"
```

---

## Task 7: Navegación A/B y layout de Vista B

**Files:**
- Modify: `src/routes/+layout.svelte` (añadir enlace a `/avanzado`)
- Create: `src/routes/avanzado/+layout.svelte`

- [ ] **Step 1: Añadir enlace a Vista B en el nav global**

En `src/routes/+layout.svelte`, en el array `tabs`, añadir una entrada al final:
```ts
    { href: '/avanzado', label: '🚀 Vista Avanzada' }
```
(El resaltado activo ya compara `$page.url.pathname`; para que se marque en subrutas, cambiar la condición de esa pestaña a `$page.url.pathname.startsWith('/avanzado')`. Implementación: en el `{#each}` usar
`const activo = t.href === '/avanzado' ? $page.url.pathname.startsWith('/avanzado') : $page.url.pathname === t.href;`
dentro de un bloque y aplicar `activo` a la clase.)

Código del `{#each}` resultante:
```svelte
    {#each tabs as t}
      {@const activo = t.href === '/avanzado' ? $page.url.pathname.startsWith('/avanzado') : $page.url.pathname === t.href}
      <a href={t.href}
        class="flex-1 px-4 py-4 text-center font-semibold transition
          {activo ? 'border-b-[3px] border-yura bg-white text-yura' : 'text-slate-600'}">
        {t.label}
      </a>
    {/each}
```

- [ ] **Step 2: Crear subnav de Vista B `src/routes/avanzado/+layout.svelte`**

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  let { children } = $props();
  const sub = [
    { href: '/avanzado', label: 'Dashboard avanzado' },
    { href: '/avanzado/registro', label: 'Registro completo' }
  ];
</script>

<div class="mb-5 flex gap-2">
  {#each sub as s}
    <a href={s.href}
      class="rounded-full px-4 py-2 text-sm font-semibold
        {$page.url.pathname === s.href ? 'bg-yura text-white' : 'bg-slate-200 text-slate-700'}">
      {s.label}
    </a>
  {/each}
</div>

{@render children()}
```

- [ ] **Step 3: Verificar build**

Run:
```bash
npm run build
```
Expected: build correcto.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+layout.svelte src/routes/avanzado/+layout.svelte
git commit -m "feat(vistaB): navegación A/B y subnav de Vista Avanzada"
```

---

## Task 8: Registro completo (Vista B)

**Files:**
- Create: `src/routes/avanzado/registro/+page.svelte`

- [ ] **Step 1: Implementar `src/routes/avanzado/registro/+page.svelte`**

(Captura todo lo de A **+ bolsas por tipo + ventas**, contra Supabase. Reutiliza `SectionCard`, `Toast`, `StatusBadge`, `calc.ts`, `constants.ts` de la Vista A.)
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import SectionCard from '$lib/components/SectionCard.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { toast } from '$lib/components/toastStore';
  import { MAQUINAS, TEMPORALES } from '$lib/constants';
  import { rendimiento, utilizacion, porcentajeLleno } from '$lib/calc';
  import { pesoPromedioKg } from '$lib/calc_b';
  import { getTipos, guardarParte, cargarParte, type TipoB } from '$lib/repo_b';
  import { fechaSeleccionada } from '$lib/stores';

  interface LineaUI { tipo_id: number; nombre: string; familia: string; bolsas: number; tm: number; }

  let tipos = $state<TipoB[]>([]);
  let lineas = $state<LineaUI[]>([]);
  let venta = $state({ nacional_tm: 0, export_tm: 0, a_construir_tm: 0 });
  let maquinas = $state(MAQUINAS.map((m) => ({ maquina_id: m.id, nombre: m.nombre, ratio_ideal: m.ratio_ideal, horas_maquina: 0, ratio_ecs: 0, operativos: 0, comentario: '', averia_critica: 'verde' })));
  let temporalesUI = $state(TEMPORALES.map((t, i) => ({ temporal_id: i + 1, nombre: t.nombre, capacidad: t.capacidad, inventario: 0 })));
  let compuertas = $state(Array.from({ length: 8 }, (_, i) => ({ numero: i + 1, horas: 0, comentario: '' })));
  let veh = $state({ llamado: 0, proceso: 0, playa: 0 });
  let acumuladoAjuste = $state(0);
  let comentario = $state('');

  const totalTm = $derived(lineas.reduce((s, l) => s + (Number(l.tm) || 0), 0));
  const totalBolsas = $derived(lineas.reduce((s, l) => s + (Number(l.bolsas) || 0), 0));
  const ventaTotal = $derived((Number(venta.nacional_tm) || 0) + (Number(venta.export_tm) || 0));

  onMount(async () => {
    tipos = await getTipos();
    lineas = tipos.map((t) => ({ tipo_id: t.id, nombre: t.nombre, familia: t.familia, bolsas: 0, tm: 0 }));
    await recargar();
  });

  async function recargar() {
    const fecha = get(fechaSeleccionada);
    const p = await cargarParte(fecha);
    if (!p) return;
    lineas = tipos.map((t) => {
      const d = p.despachos.find((x) => x.tipo_id === t.id);
      return { tipo_id: t.id, nombre: t.nombre, familia: t.familia, bolsas: d?.bolsas ?? 0, tm: d?.tm ?? 0 };
    });
    venta = { ...p.venta };
    maquinas = MAQUINAS.map((m) => {
      const r = p.maquinas.find((x) => x.maquina_id === m.id);
      return { maquina_id: m.id, nombre: m.nombre, ratio_ideal: m.ratio_ideal,
        horas_maquina: r?.horas_maquina ?? 0, ratio_ecs: r?.ratio_ecs ?? 0, operativos: r?.operativos ?? 0,
        comentario: r?.comentario ?? '', averia_critica: r?.averia_critica ?? 'verde' };
    });
    temporalesUI = TEMPORALES.map((t, i) => {
      const r = p.temporales.find((x) => x.temporal_id === i + 1);
      return { temporal_id: i + 1, nombre: t.nombre, capacidad: t.capacidad, inventario: r?.inventario ?? 0 };
    });
    compuertas = compuertas.map((c) => {
      const r = p.compuertas.find((x) => x.numero === c.numero);
      return r ? { numero: c.numero, horas: r.horas, comentario: r.comentario } : c;
    });
    veh = { llamado: p.veh_llamado, proceso: p.veh_proceso, playa: p.veh_playa };
    acumuladoAjuste = p.acumulado_ajuste;
    comentario = p.comentario;
  }

  async function guardar() {
    const fecha = get(fechaSeleccionada);
    if (!fecha) return toast('Seleccione una fecha', true);
    await guardarParte({
      fecha,
      veh_llamado: veh.llamado, veh_proceso: veh.proceso, veh_playa: veh.playa,
      acumulado_ajuste: Number(acumuladoAjuste) || 0, comentario,
      despachos: $state.snapshot(lineas).map((l) => ({ tipo_id: l.tipo_id, nombre: l.nombre, familia: l.familia, bolsas: Number(l.bolsas) || 0, tm: Number(l.tm) || 0 })),
      venta: $state.snapshot(venta),
      maquinas: $state.snapshot(maquinas).map((m) => ({ maquina_id: m.maquina_id, horas_maquina: m.horas_maquina, ratio_ecs: m.ratio_ecs, operativos: m.operativos, comentario: m.comentario, averia_critica: m.averia_critica })),
      temporales: $state.snapshot(temporalesUI).map((t) => ({ temporal_id: t.temporal_id, inventario: t.inventario })),
      compuertas: $state.snapshot(compuertas)
    });
    toast(`Parte guardado para ${fecha}`);
  }
</script>

<Toast />

<SectionCard title="🚚 Despacho por tipo (bolsas + TM)">
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead><tr class="bg-slate-100 text-left"><th class="p-2">Tipo</th><th class="p-2">Familia</th><th class="p-2">Bolsas</th><th class="p-2">TM</th><th class="p-2">Peso prom. (kg)</th></tr></thead>
      <tbody>
        {#each lineas as l}
          <tr>
            <td class="border-b border-slate-200 p-2">{l.nombre}</td>
            <td class="border-b border-slate-200 p-2"><span class="rounded bg-slate-100 px-2 py-0.5 text-xs">{l.familia}</span></td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="1" class="w-28 rounded-xl border border-slate-300 px-2 py-1" bind:value={l.bolsas} /></td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="0.01" class="w-28 rounded-xl border border-slate-300 px-2 py-1" bind:value={l.tm} /></td>
            <td class="border-b border-slate-200 p-2">{pesoPromedioKg(l.tm, l.bolsas).toFixed(2)}</td>
          </tr>
        {/each}
      </tbody>
      <tfoot><tr class="font-bold"><td class="p-2">Total</td><td></td><td class="p-2">{totalBolsas}</td><td class="p-2">{totalTm.toFixed(2)}</td><td></td></tr></tfoot>
    </table>
  </div>
</SectionCard>

<SectionCard title="💰 Ventas del día (TM)">
  <div class="flex flex-wrap items-end gap-5">
    <div class="flex-1"><label class="block text-sm">Nacional:</label><input type="number" step="0.01" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={venta.nacional_tm} /></div>
    <div class="flex-1"><label class="block text-sm">Exportación:</label><input type="number" step="0.01" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={venta.export_tm} /></div>
    <div class="flex-1"><label class="block text-sm">A construir:</label><input type="number" step="0.01" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={venta.a_construir_tm} /></div>
    <div class="flex-1"><strong>Total ventas: {ventaTotal.toFixed(2)} TM</strong></div>
  </div>
</SectionCard>

<SectionCard title="⚙️ Máquinas embolsadoras">
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead><tr class="bg-slate-100 text-left"><th class="p-2">Máquina</th><th class="p-2">Horas</th><th class="p-2">Ratio ECS</th><th class="p-2">Ratio Ideal</th><th class="p-2">Operativos</th><th class="p-2">Rend.</th><th class="p-2">Util.</th><th class="p-2">Comentario</th><th class="p-2">Estado</th></tr></thead>
      <tbody>
        {#each maquinas as m}
          <tr>
            <td class="border-b border-slate-200 p-2">{m.nombre}</td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="0.01" class="w-20 rounded-xl border border-slate-300 px-2 py-1" bind:value={m.horas_maquina} /></td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="1" class="w-20 rounded-xl border border-slate-300 px-2 py-1" bind:value={m.ratio_ecs} /></td>
            <td class="border-b border-slate-200 p-2">{m.ratio_ideal}</td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="1" class="w-16 rounded-xl border border-slate-300 px-2 py-1" bind:value={m.operativos} /></td>
            <td class="border-b border-slate-200 p-2">{rendimiento(m.ratio_ecs, m.ratio_ideal).toFixed(1)}%</td>
            <td class="border-b border-slate-200 p-2">{utilizacion(m.horas_maquina).toFixed(1)}%</td>
            <td class="border-b border-slate-200 p-2"><input class="w-32 rounded-xl border border-slate-300 px-2 py-1" bind:value={m.comentario} /></td>
            <td class="border-b border-slate-200 p-2">
              <select class="rounded-xl border border-slate-300 px-2 py-1" bind:value={m.averia_critica}>
                <option value="verde">🟢 Operativo</option><option value="amarillo">🟡 En reparación</option><option value="rojo">🔴 Avería</option>
              </select>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</SectionCard>

<SectionCard title="🏬 Temporales">
  {#each temporalesUI as t}
    <div class="mb-4 flex flex-wrap items-center gap-5">
      <div class="flex-[2]"><strong>{t.nombre}</strong> — Capacidad: {t.capacidad} TM</div>
      <div class="flex-1"><label class="block text-sm">Inventario (TM):</label><input type="number" step="0.01" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={t.inventario} /></div>
      <div class="flex-1">% lleno: {porcentajeLleno(t.inventario, t.capacidad).toFixed(1)}%</div>
    </div>
  {/each}
</SectionCard>

<SectionCard title="🗄️ Silo 8 - Compuertas">
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead><tr class="bg-slate-100 text-left"><th class="p-2">Compuerta</th><th class="p-2">Horas</th><th class="p-2">Comentario</th></tr></thead>
      <tbody>
        {#each compuertas as c}
          <tr>
            <td class="border-b border-slate-200 p-2">Compuerta {c.numero}</td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="0.5" class="w-20 rounded-xl border border-slate-300 px-2 py-1" bind:value={c.horas} /></td>
            <td class="border-b border-slate-200 p-2"><input class="w-full rounded-xl border border-slate-300 px-2 py-1" bind:value={c.comentario} /></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</SectionCard>

<SectionCard title="🚗 Vehículos y observaciones">
  <div class="flex flex-wrap items-end gap-5">
    <div class="flex-1"><label class="block text-sm">Llamado:</label><input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={veh.llamado} /></div>
    <div class="flex-1"><label class="block text-sm">Proceso:</label><input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={veh.proceso} /></div>
    <div class="flex-1"><label class="block text-sm">Playa:</label><input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={veh.playa} /></div>
    <div class="flex-1"><label class="block text-sm">Ajuste acumulado:</label><input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={acumuladoAjuste} /></div>
  </div>
  <div class="mt-4"><label class="block text-sm">Comentario general:</label><textarea rows="2" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={comentario}></textarea></div>
</SectionCard>

<div class="mt-5 flex justify-end gap-4">
  <button class="rounded-full bg-yura px-6 py-3 font-bold text-white" onclick={guardar}>💾 Guardar parte</button>
  <button class="rounded-full bg-slate-200 px-6 py-3 font-bold" onclick={recargar}>⬇️ Recargar fecha</button>
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
git add src/routes/avanzado/registro/+page.svelte
git commit -m "feat(vistaB): registro completo (despacho+bolsas+ventas+operativo) sobre Supabase"
```

---

## Task 9: Dashboard avanzado (Vista B)

**Files:**
- Create: `src/routes/avanzado/+page.svelte`

- [ ] **Step 1: Implementar `src/routes/avanzado/+page.svelte`**

(KPIs comerciales + participación con bolsas/% + despacho por familia + comparativa multi-anual + plan vs real. Reutiliza `KPICard`, `SectionCard`, `Toast`, Chart.js.)
```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { Chart, registerables } from 'chart.js';
  import SectionCard from '$lib/components/SectionCard.svelte';
  import KPICard from '$lib/components/KPICard.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { variacionPct, cumplimiento, pivotComparativa, type FilaComparativa } from '$lib/calc_b';
  import {
    getParticipacionDia, getDespachoPorFamilia, getComparativaAnual, getPlanVsReal,
    type ParticipacionRow, type FamiliaRow, type PlanVsRealRow
  } from '$lib/repo_b';
  import { fechaSeleccionada } from '$lib/stores';

  Chart.register(...registerables);

  let cargando = $state(true);
  let parti = $state<ParticipacionRow[]>([]);
  let familias = $state<FamiliaRow[]>([]);
  let comparativa = $state<FilaComparativa[]>([]);
  let planVsReal = $state<PlanVsRealRow[]>([]);
  let canvasComp: HTMLCanvasElement;
  let chartComp: Chart | null = null;

  const totalDiaTm = $derived(parti.reduce((s, p) => s + (Number(p.tm) || 0), 0));
  const totalDiaBolsas = $derived(parti.reduce((s, p) => s + (Number(p.bolsas) || 0), 0));
  const anioActual = $derived(Number(get(fechaSeleccionada).slice(0, 4)));

  onMount(load);
  $effect(() => { $fechaSeleccionada; load(); });
  onDestroy(() => chartComp?.destroy());

  async function load() {
    cargando = true;
    const fecha = get(fechaSeleccionada);
    const anio = Number(fecha.slice(0, 4));
    [parti, familias, comparativa, planVsReal] = await Promise.all([
      getParticipacionDia(fecha), getDespachoPorFamilia(fecha), getComparativaAnual(), getPlanVsReal(anio)
    ]);
    cargando = false;
    renderComparativa();
  }

  function renderComparativa() {
    if (!canvasComp) return;
    const pivot = pivotComparativa(comparativa);
    const labels = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const anios = [...new Set(comparativa.map((r) => r.anio))].sort();
    const colores: Record<number, string> = {};
    const paleta = ['#94a3b8', '#eab308', '#034694', '#10b981'];
    anios.forEach((a, i) => (colores[a] = paleta[i % paleta.length]));
    const datasets = anios.map((a) => ({
      label: String(a),
      data: labels.map((_, idx) => pivot.find((p) => p.mes === idx + 1)?.valores[a] ?? null),
      backgroundColor: colores[a]
    }));
    if (chartComp) chartComp.destroy();
    chartComp = new Chart(canvasComp.getContext('2d')!, {
      type: 'bar',
      data: { labels, datasets },
      options: { responsive: true, maintainAspectRatio: true }
    });
  }

  // Cumplimiento acumulado del año vs plan (suma de meses con dato real)
  const cumplAnual = $derived.by(() => {
    const real = planVsReal.reduce((s, r) => s + (Number(r.real_tm) || 0), 0);
    const plan = planVsReal.reduce((s, r) => s + (Number(r.plan_tm) || 0), 0);
    return cumplimiento(real, plan);
  });
</script>

<Toast />

{#if cargando}
  <p class="p-6 text-center text-slate-500">Cargando…</p>
{:else}
  <div class="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
    <KPICard value={`${totalDiaTm.toFixed(2)} TM`} label="Despacho del día" />
    <KPICard value={`${totalDiaBolsas}`} label="Bolsas del día" />
    <KPICard value={`${familias.length}`} label="Familias despachadas" />
    <KPICard value={`${cumplAnual.toFixed(1)}%`} label="Cumplimiento plan (año)" />
  </div>

  <SectionCard title="📊 Participación por tipo (bolsas, TM, %)">
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead><tr class="bg-slate-100 text-left"><th class="p-2">Tipo</th><th class="p-2">Familia</th><th class="p-2">Bolsas</th><th class="p-2">TM</th><th class="p-2">%</th></tr></thead>
        <tbody>
          {#each parti as p}
            <tr class={p.pct > 10 ? 'bg-[#fff3cd] font-bold text-[#b85c00]' : ''}>
              <td class="border-b border-slate-200 p-2">{p.tipo}</td>
              <td class="border-b border-slate-200 p-2">{p.familia}</td>
              <td class="border-b border-slate-200 p-2">{p.bolsas}</td>
              <td class="border-b border-slate-200 p-2">{Number(p.tm).toFixed(2)}</td>
              <td class="border-b border-slate-200 p-2">{Number(p.pct).toFixed(1)}%</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </SectionCard>

  <SectionCard title="🏷️ Despacho por familia">
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead><tr class="bg-slate-100 text-left"><th class="p-2">Familia</th><th class="p-2">Bolsas</th><th class="p-2">TM</th><th class="p-2">% del día</th></tr></thead>
        <tbody>
          {#each familias as f}
            <tr>
              <td class="border-b border-slate-200 p-2">{f.familia}</td>
              <td class="border-b border-slate-200 p-2">{f.bolsas}</td>
              <td class="border-b border-slate-200 p-2">{Number(f.tm).toFixed(2)}</td>
              <td class="border-b border-slate-200 p-2">{totalDiaTm ? ((Number(f.tm) / totalDiaTm) * 100).toFixed(1) : '0'}%</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </SectionCard>

  <SectionCard title="📈 Comparativa de despacho mensual por año">
    <canvas bind:this={canvasComp} class="max-h-[320px]"></canvas>
  </SectionCard>

  <SectionCard title="🎯 Plan vs Real {anioActual} (por mes)">
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead><tr class="bg-slate-100 text-left"><th class="p-2">Mes</th><th class="p-2">Plan (TM)</th><th class="p-2">Real (TM)</th><th class="p-2">Cumplimiento</th></tr></thead>
        <tbody>
          {#each planVsReal as r}
            <tr>
              <td class="border-b border-slate-200 p-2">{r.mes}</td>
              <td class="border-b border-slate-200 p-2">{Number(r.plan_tm).toFixed(0)}</td>
              <td class="border-b border-slate-200 p-2">{Number(r.real_tm).toFixed(0)}</td>
              <td class="border-b border-slate-200 p-2">{Number(r.cumplimiento_pct).toFixed(1)}%</td>
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
git add src/routes/avanzado/+page.svelte
git commit -m "feat(vistaB): dashboard avanzado (participación, familia, comparativa anual, plan vs real)"
```

---

## Task 10: Verificación final

**Files:** ninguno nuevo (verificación).

- [ ] **Step 1: Ejecutar toda la suite de tests**

Run:
```bash
npx vitest run
```
Expected: PASS (incluye `calc.test.ts` de A y `calc_b.test.ts` de B).

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
- Nav global muestra "🚀 Vista Avanzada" y resalta en subrutas.
- `/avanzado/registro`: capturar despacho con bolsas+TM, ventas, máquinas/temporales/Silo8/vehículos; guardar; recargar fecha → persiste en Supabase.
- `/avanzado`: KPIs comerciales, participación con bolsas/%, despacho por familia, gráfico comparativa multi-anual (2024/2025 sembrados + año en curso), tabla plan vs real.
Ctrl+C para salir.

- [ ] **Step 4: Verificar datos en Supabase**

Vía MCP: `execute_sql` con `select * from v_despacho_por_familia where fecha = '<fecha probada>';`
Expected: filas coherentes con lo capturado.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore(vistaB): verificación final Vista B"
```

---

## Self-Review (completado por el autor del plan)

- **Cobertura del alcance:** bolsas+% (Tasks 8/9, vista `v_participacion_dia`); ventas (Tasks 2/8); despacho por familia (vista `v_despacho_por_familia`, Task 9); comparativa multi-anual con histórico sembrado (Tasks 3/4/9); superset operativo de A — máquinas/temporales/Silo8/vehículos (Tasks 2/8). ✅
- **Placeholders:** sin "TBD/TODO"; SQL y código completos; seed con valores reales del Excel. ✅
- **Consistencia de tipos:** `ParteCompleto`, `TipoB`, `ParticipacionRow`, `FamiliaRow`, `ComparativaRow`/`FilaComparativa`, `PlanVsRealRow` y firmas (`pivotComparativa`, `cumplimiento`, `pesoPromedioKg`) coinciden entre `repo_b.ts`, `calc_b.ts` y las páginas. ✅
- **Dependencia declarada:** requiere la Vista A mergeada (componentes, `calc.ts`, `stores.ts`, `constants.ts`, layout, tema). ✅
- **Notas:** RLS permisiva (deuda de seguridad, sin auth, igual que A); histórico sembrado solo 2024/2025 para evitar solape con el cómputo en vivo 2026+; el campo `operativos` por máquina se añade en B (no existía en A).
```
