# Dashboard Planta Yura — "Operations Cockpit" (SvelteKit + Supabase)

Fecha: 2026-06-01
Estado: Aprobado (dirección de diseño)

## 1. Contexto y decisión

Partimos del `index.html` original (SPA vanilla + Firebase) y de los Excel operativos de la
Planta Yura (cemento). Tras evaluar alcance, **se descarta la "Vista A" (port fiel sobre
Firebase)**. La aplicación final es **una sola app rediseñada** ("Vista B con superpoderes")
sobre **Supabase/Postgres**, con captura manual y enfoque analítico, y un **rediseño UX/UI
"Operations Cockpit"** responsive (móvil / tablet / escritorio).

No se usa Firebase. No hay selector de vistas. Rutas raíz: `/` (dashboard) y `/registro`.

## 2. Alcance funcional (superset del original)
- **Despacho por tipo** con **bolsas + TM + % participación** y **peso promedio**.
- **Ventas** del día: nacional / exportación / a construir, con totales.
- **Despacho por familia** (IP, HE, HS, MS, GU, TIPO I, BLANCO, FILLER…) con donut.
- **Comparativa multi-anual 2024/2025/2026** por mes (histórico sembrado del Excel) y
  **plan vs real** mensual.
- **Operativo** (captura completa): máquinas embolsadoras (horas, ratio ECS, ratio ideal,
  rendimiento, utilización, operativos, comentario, estado 🟢🟡🔴), temporales (inventario,
  % lleno), Silo 8 (8 compuertas), vehículos (llamado/proceso/playa), planes
  (semanal / especiales / mensual / anual), tipos de cemento (lista maestra con familia).

## 3. Dirección de diseño "Operations Cockpit"
Estilo **Data-Dense Dashboard**, refinado e industrial, con identidad Yura. Claro por
defecto, **modo oscuro** conmutable y persistido.

### Tipografía (técnica, con carácter; no Inter/Roboto)
- **Display / titulares / números grandes:** `Archivo` (700/800).
- **Datos y tablas:** `IBM Plex Mono` (cifras tabulares — `font-variant-numeric: tabular-nums`).
- **Cuerpo / UI:** `IBM Plex Sans` (400/500/600).
- Carga con `display=swap`, preconnect a Google Fonts.

### Color (tokens semánticos, light/dark diseñados juntos)
Light: primary `#034694` (Yura), on-primary `#FFFFFF`, secondary `#2563EB`, accent `#D97706`,
background `#F6F8FB`, surface `#FFFFFF`, ink `#0F172A`, muted `#E9EEF6`, border `#E2E8F0`,
success `#16A34A`, warning `#D97706`, danger `#DC2626`.
Dark (desaturado, no invertido): background `#0B1220`, surface `#111A2E`, surface-2 `#16213A`,
border `#23304B`, ink `#E2E8F0`, primary `#3B82F6`, accent `#F59E0B`.
Contraste AA (≥4.5:1 texto normal). Color nunca como único indicador (siempre icono/signo).

### Atmósfera
Fondo con **rejilla "blueprint"** sutil (líneas finas vía CSS) + grano muy tenue; sombras de
elevación consistentes; radios coherentes (cards 16–20px). Sin ornamentación gratuita.

### Iconografía
**Lucide** (`lucide-svelte`), trazo consistente. **Cero emojis como iconos.**

## 4. Responsive y navegación
Mobile-first. Breakpoints 375 / 768 / 1024 / 1440.
- **Móvil/tablet (<1024px):** **top app bar** (logo + fecha + toggle tema) + **bottom nav**
  (≤5 ítems, icono + label, estado activo, ≥44px). Tablas → **tarjetas apiladas**. Secciones
  colapsables. `min-h-dvh`, safe-areas.
- **Escritorio (≥1024px):** **sidebar** de navegación + top bar; cockpit multi-columna; tablas
  completas.
- Sin scroll horizontal en móvil. Navegación persistente y consistente entre páginas.

## 5. Interacción y micro-UX
- **KPIs**: contador animado (count-up, respeta `prefers-reduced-motion`), indicador de
  tendencia (▲/▼ + signo + color semántico), **mini-sparkline** SVG.
- **Gráficos** (Chart.js): tooltips, leyenda **interactiva** (toggle series), donut de familias,
  barras agrupadas multi-anual con alternar años, evolución real vs plan.
- **Estados**: **skeletons** de carga (no spinners largos), **empty states** con icono+acción,
  **toasts** con `aria-live` (auto-dismiss 3–5s), indicación de "guardado".
- **Formularios**: labels visibles, validación inline (on blur), tipos de input semánticos
  (number/date), helper text, totales en vivo, autosave opcional de borrador.
- **Tema**: toggle claro/oscuro persistido en `localStorage`, sin flash inicial (script en
  `app.html`), inicia según `prefers-color-scheme` si no hay preferencia guardada.
- **Movimiento**: revelado escalonado (stagger 30–50ms), transiciones 150–300ms, `ease-out`
  al entrar; solo transform/opacity; todo interrumpible y con `reduced-motion`.

## 6. Backend Supabase (Postgres)
Esquema relacional: `tipo_cemento` (con `familia`,`presentacion`), `parte_diario`,
`despacho`, `venta_diaria`, `maquina`/`maquina_registro`, `temporal`/`temporal_registro`,
`compuerta_registro`, `plan_semanal`, `plan_especial`, `plan_anual`,
`plan_ventas_familia`, `resumen_mensual_historico`.
Vistas: `v_participacion_dia`, `v_despacho_por_familia`, `v_despacho_mensual(_live)`,
`v_comparativa_anual`, `v_plan_vs_real`.
Seed con datos reales del Excel: tipos+familia, masters, histórico 2024/2025, plan 2026.
RLS permisiva (sin auth por ahora — **deuda de seguridad** documentada).

## 7. Stack y calidad
SvelteKit + Svelte 5 (runes), TypeScript, Vite, `adapter-static` (SPA), Tailwind CSS v4 con
tokens semánticos light/dark, `@supabase/supabase-js`, Chart.js v4, `lucide-svelte`, Vitest
(lógica pura en `calc.ts`). Tipos TS autogenerados del esquema.

## 8. Criterios de aceptación
- App única en `/` y `/registro`, sin Firebase ni selector de vistas.
- Captura completa persiste en Supabase; analítica (familia, %, comparativa, plan vs real)
  funcional con histórico sembrado.
- Diseño "Operations Cockpit" aplicado: tipografía, tokens, light/dark, blueprint.
- Responsive verificado a 375/768/1024/1440; bottom nav en móvil, sidebar en escritorio;
  tablas → tarjetas en móvil; sin scroll horizontal.
- Accesibilidad: contraste AA en ambos temas, focus visible, `aria-label` en botones de icono,
  `reduced-motion` respetado, targets ≥44px.
- Cálculos puros con tests en `calc.ts`.
