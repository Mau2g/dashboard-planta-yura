<script lang="ts">
  import SectionCard from '$lib/components/SectionCard.svelte';
  import KPICard from '$lib/components/KPICard.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import { getMaquinasDia, type MaquinaDiaRow } from '$lib/repo';
  import { utilizacion, rendimiento, estadoEficiencia } from '$lib/calc';
  import { fechaSeleccionada } from '$lib/stores';
  import { Factory } from 'lucide-svelte';

  let cargando = $state(true);
  let maquinas = $state<MaquinaDiaRow[]>([]);

  let fechaCargada = '';
  $effect(() => { const f = $fechaSeleccionada; if (f !== fechaCargada) cargar(f); });

  async function cargar(fecha: string) {
    fechaCargada = fecha;
    cargando = true;
    maquinas = await getMaquinasDia(fecha);
    cargando = false;
  }

  // Métricas por máquina (derivadas de los datos reales del parte).
  const filas = $derived(maquinas.map((m) => {
    const util = utilizacion(Number(m.horas_maquina) || 0);   // horas operativas / 24
    const rend = rendimiento(Number(m.ratio_ecs) || 0, Number(m.ratio_ideal) || 0); // ECS vs ideal
    return { ...m, util, rend, estado: estadoEficiencia(util) };
  }));

  // Resumen de planta.
  const totHoras = $derived(filas.reduce((s, f) => s + (Number(f.horas_maquina) || 0), 0));
  const eficPlanta = $derived(filas.length ? (totHoras / (24 * filas.length)) * 100 : 0);
  const rendPlanta = $derived(filas.length ? filas.reduce((s, f) => s + f.rend, 0) / filas.length : 0);

  const colorEstado: Record<string, string> = { verde: 'bg-success', amarillo: 'bg-warning', rojo: 'bg-danger' };
  const fmt = (n: number, d = 1) => Number(n || 0).toLocaleString('es-PE', { maximumFractionDigits: d });
</script>

<h1 class="mb-1 text-xl font-extrabold text-ink lg:text-2xl">Productividad máquina</h1>
<p class="mb-5 text-sm text-muted-ink">
  Eficiencia calculada automáticamente desde el parte del día ({$fechaSeleccionada}). Ideal: 1 bolsa/segundo.
</p>

{#if cargando}
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{#each Array(3) as _}<Skeleton class="h-28 rounded-2xl" />{/each}</div>
{:else if filas.length === 0}
  <EmptyState titulo="Sin datos del día" descripcion="No hay parte cargado para esta fecha. Sube el reporte del día o elige otra fecha." />
{:else}
  <div class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
    <KPICard label="Eficiencia de planta" value={eficPlanta} decimals={1} suffix="%" />
    <KPICard label="Horas operativas" value={totHoras} decimals={1} suffix=" h" />
    <KPICard label="Rendimiento embolsado" value={rendPlanta} decimals={1} suffix="%" />
    <KPICard label="Máquinas" value={filas.length} />
  </div>

  <SectionCard title="Eficiencia por máquina (utilización sobre 24 h)">
    <div class="grid gap-3 lg:grid-cols-2">
      {#each filas as f}
        <div class="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 font-display font-bold text-ink">
              <Factory size={18} class="text-primary" /> {f.nombre}
            </div>
            <StatusBadge estado={f.averia_critica} />
          </div>

          <div class="mt-3 flex items-end justify-between">
            <span class="font-data text-3xl font-extrabold text-ink">{fmt(f.util)}<span class="text-lg">%</span></span>
            <span class="text-xs text-muted-ink">{fmt(f.horas_maquina)} h / 24 h</span>
          </div>
          <div class="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div class="h-full rounded-full {colorEstado[f.estado]} transition-all" style="width:{Math.min(100, Math.max(0, f.util))}%"></div>
          </div>

          <div class="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div><span class="block text-xs text-muted-ink">Ratio ECS</span><b class="font-data text-ink">{fmt(f.ratio_ecs, 0)}</b></div>
            <div><span class="block text-xs text-muted-ink">Ratio ideal</span><b class="font-data text-ink">{fmt(f.ratio_ideal, 0)}</b></div>
            <div><span class="block text-xs text-muted-ink">Rendimiento</span><b class="font-data text-ink">{fmt(f.rend)}%</b></div>
          </div>
        </div>
      {/each}
    </div>

    <p class="mt-4 text-xs text-muted-ink">
      <b>Utilización</b> = horas operativas ÷ 24 h. <b>Rendimiento</b> = ratio real (ECS) ÷ ratio ideal de la máquina
      (ideal de embolsado: 1 bolsa/segundo). El estado proviene del parte (operativo / reparación / avería).
      Los datos se actualizan al subir el reporte del día; no requieren ingreso manual.
    </p>
  </SectionCard>
{/if}
