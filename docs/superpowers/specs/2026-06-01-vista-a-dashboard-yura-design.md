# Vista A — Dashboard Planta Yura (SvelteKit, port fiel de index.html)

Fecha: 2026-06-01
Estado: Aprobado (diseño)

## 1. Contexto y objetivo

Existe un dashboard operativo de la Planta Yura implementado como página única
(`index.html`, HTML/JS vanilla + Firebase Firestore). Captura manualmente los datos
del día y calcula KPIs sobre lo capturado.

El proyecto global tiene dos vistas:

- **Vista A (este spec)**: port **fiel 1:1** de `index.html` a SvelteKit, con la
  **misma lógica, mismos campos y mismo backend Firebase**, mejorando arquitectura
  (tipada, reactiva, componentizada) y presentación/UX.
- **Vista B (futuro, fuera de alcance aquí)**: versión extendida con campos
  adicionales de los Excel (bolsas + %, ventas, comparativa multi-anual, despacho por
  familia), sobre Supabase/Postgres.

Este spec cubre **únicamente la Vista A al 100%**.

## 2. Alcance

### Dentro de alcance
- Reconstrucción completa de `index.html` en SvelteKit (Svelte 5 + runes).
- Despliegue como **SPA estática** (`adapter-static`), portable como el HTML actual.
- **Firebase Firestore client-side intacto**: mismo proyecto `lluvias-18b0b`, mismas
  colecciones `planta_datos_diarios` y `planta_config`, mismo esquema de documentos.
- Captura manual (sin parsers de Excel/ERP).
- Mejoras de visibilidad/UX que **no** cambian campos ni datos.

### Fuera de alcance
- Vista B y cualquier campo extra de los Excel.
- Migración de backend, autenticación, importación de Excel/ERP.
- Cambios al modelo de datos de Firestore.

## 3. Backend y modelo de datos (sin cambios)

Se reutiliza la configuración Firebase existente y el esquema actual de Firestore.

Colección `planta_config` (documentos):
- `tiposCemento` → `{ lista: [{ nombre }] }`
- `planes` → `{ planMensual, planAnual }`
- `planSemanal` → `{ Lunes..Domingo: number }`
- `planesEspeciales` → `{ "YYYY-MM-DD": number }`

Colección `planta_datos_diarios` (doc id = fecha `YYYY-MM-DD`):
```
{
  fecha,
  despachos: [{ tipo, tm }],
  maquinas: [{ id, nombre, horasMaquina, ratioECS, ratioIdeal, comentario, averiaCritica }],
  temporales: [{ nombre, capacidad, inventario }],
  compuertas: [{ numero, horas, comentario }],
  vehiculos: { llamado, proceso, playa },
  acumuladoAjuste,
  comentarioGeneral,
  timestamp
}
```

### Datos fijos (constantes, idénticos al original)
- Máquinas: H1=2400, H2=3600, H3=3900, H4=3900, H5=3900, V (Ventomatic)=4300.
- Temporales: Temporal 1=2142, Temporal 2=1890, Misti=3006 (capacidad en TM).
- Lista por defecto de tipos de cemento (la del `loadConfig` actual) cuando Firestore
  no tiene `tiposCemento`.

## 4. Arquitectura

### Rutas (reemplazan los tabs con `display:none`)
- `/` o `/dashboard` — Dashboard KPIs (landing).
- `/registro` — Registro Diario.
- `/config` — Configuración.
- `+layout.svelte`: header azul Yura + barra de fecha global + navegación.

### Capa de datos
- `src/lib/firebase.ts`: inicializa Firebase app + Firestore (solo en navegador).
- `src/lib/repo.ts`: API tipada que encapsula Firestore:
  - `getConfig()`, `guardarTiposYPlanes()`, `guardarPlanSemanal()`,
    `guardarPlanesEspeciales()`
  - `guardarDia(fecha, datos)`, `cargarDia(fecha)`
  - `acumuladoMes(fecha)`, `acumuladoMesAnterior(fecha)`, `ultimos7Dias(fecha)`
- `src/lib/types.ts`: `DatosDia`, `Maquina`, `Temporal`, `Compuerta`, `Vehiculos`,
  `Config`, `PlanSemanal`, etc.
- `src/lib/calc.ts`: **funciones puras testeables** (sin Firestore ni DOM):
  - `rendimiento(ratioECS, ratioIdeal)` → %
  - `utilizacion(horas)` → % sobre 24h
  - `porcentajeLleno(inventario, capacidad)` → %
  - `participaciones(despachos)` → [{ tipo, tm, pct }], con flag destacado >10%
  - `totalDia(despachos)`, `totalVehiculos(v)`
  - `rendimientoPromedio(maquinas)`
  - `planDiario(fecha, planSemanal, planesEspeciales)` (especial gana al semanal)
- `src/lib/constants.ts`: máquinas, temporales, tipos por defecto.

### Estado
- Runes (`$state` / `$derived`): los cálculos se recalculan automáticamente al editar
  (elimina el `querySelector`/recálculo manual del original).

### Gráficos
- Chart.js (v4) envuelto en componente `ChartCanvas.svelte` (paridad y fiabilidad).
  Gráfico de evolución: barras despacho real + línea plan diario (mismo del original).

### Componentes reutilizables
`KPICard`, `DataTable`, `StatusBadge` (🟢🟡🔴), `ChartCanvas`, `Toast`,
`SectionCard` (la tarjeta con header de sección).

## 5. Funcionalidad (paridad completa con index.html)

### Registro Diario (`/registro`)
- Tabla despachos por tipo (TM), editable; agregar/eliminar tipo.
- Temporales: inventario editable, % lleno calculado, capacidad fija mostrada.
- Máquinas: horas, ratio ECS (editables), ratio ideal (fijo), rendimiento y
  utilización (calculados), comentario técnico, estado crítico (select 🟢/🟡/🔴).
- Silo 8: 8 compuertas con horas + comentario.
- Vehículos: llamado / proceso / playa, total calculado.
- Acumulado mes (auto desde Firestore) + ajuste manual; comentario general.
- Botones: guardar día / cargar datos de fecha.

### Dashboard KPIs (`/` )
- 5 KPIs: despacho del día (TM), % vs plan mensual, acumulado mes, vs mes anterior,
  rendimiento promedio máquinas.
- Tabla participación por tipo con fila destacada cuando pct > 10%.
- Acumulado del mes.
- Gráfico evolución últimos 7 días (real vs plan diario).
- Resumen máquinas (horas, ratio ECS, rendimiento, estado).
- Resumen Silo 8 (horas + comentario por compuerta).

### Configuración (`/config`)
- Plan semanal por día (Lunes..Domingo).
- Planes especiales por fecha (agregar/actualizar/eliminar/guardar).
- Plan mensual y anual.
- Lista maestra de tipos de cemento (agregar/eliminar/editar/guardar).
- Datos fijos informativos (capacidades temporales, ratios ideales) — solo lectura.

## 6. Mejoras de visibilidad (no cambian campos ni datos)
- Componentes reutilizables y código tipado.
- Estados de carga / vacío / error (el original solo tiene toasts).
- Tablas responsive y mejor jerarquía visual en móvil.
- Recalculo reactivo inmediato; feedback claro al guardar/cargar.
- Identidad visual Yura conservada (azul `#034694`).

## 7. Stack y calidad
- SvelteKit + Svelte 5 (runes), Vite, `adapter-static` (SPA fallback).
- Firebase Web SDK modular (v9+), client-side.
- **Tailwind CSS v4** con tokens del tema Yura.
- Chart.js v4.
- **Vitest** para `calc.ts` (lógica pura: rendimiento, utilización, % participación,
  acumulado mensual, plan diario por día/especial).

## 8. Estructura de carpetas
```
src/
  lib/
    firebase.ts
    repo.ts
    types.ts
    calc.ts
    constants.ts
    components/
      KPICard.svelte
      DataTable.svelte
      StatusBadge.svelte
      ChartCanvas.svelte
      SectionCard.svelte
      Toast.svelte
  routes/
    +layout.svelte
    +page.svelte            # dashboard
    registro/+page.svelte
    config/+page.svelte
```

## 9. Criterios de aceptación
- Las tres pantallas reproducen exactamente los campos y cálculos de `index.html`.
- Guardar/cargar contra Firestore usa el mismo esquema de documentos (interoperable
  con datos creados por el `index.html` actual).
- Cálculos cubiertos por tests unitarios en `calc.ts` y coinciden con el original.
- App buildea y se sirve como estática.
- Diseño responsive (móvil y escritorio).
