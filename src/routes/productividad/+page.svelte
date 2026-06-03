<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import SectionCard from '$lib/components/SectionCard.svelte';
  import KPICard from '$lib/components/KPICard.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { toast } from '$lib/components/toastStore';
  import { MAQUINAS } from '$lib/constants';
  import { fechaSeleccionada } from '$lib/stores';
  import { getProductividadDia, guardarProductividad, type ProductividadRow } from '$lib/repo';
  import {
    eficienciaOperativa, rendimientoEmbolsado, horasEvaluadas, estadoEficiencia,
    BOLSA_IDEAL_POR_HORA, UMBRAL_EFIC_OK, UMBRAL_EFIC_ALERTA
  } from '$lib/calc';
  import type { ProductividadReg } from '$lib/types';
  import { Save, Gauge, Wrench, AlertTriangle, Factory } from 'lucide-svelte';

  let cargando = $state(true);
  let guardando = $state(false);
  let filas = $state<ProductividadReg[]>([]);

  onMount(async () => { await recargar(); cargando = false; });
  $effect(() => { $fechaSeleccionada; if (!cargando) recargar(); });

  async function recargar() {
    const fecha = get(fechaSeleccionada);
    const guardadas = await getProductividadDia(fecha);
    const porId = new Map(guardadas.map((r) => [r.maquina_id, r]));
    filas = MAQUINAS.map((m) => {
      const g = porId.get(m.id);
      return {
        maquina_id: m.id, nombre: m.nombre, ratio_ideal: m.ratio_ideal,
        horas_produccion: g?.horas_produccion ?? 0,
        horas_mantenimiento: g?.horas_mantenimiento ?? 0,
        horas_averia: g?.horas_averia ?? 0,
        bolsas: g?.bolsas ?? 0,
        comentario: g?.comentario ?? ''
      };
    });
  }

  const efic = (f: ProductividadReg) => eficienciaOperativa(f);
  const horas = (f: ProductividadReg) => horasEvaluadas(f);

  // Resumen global de planta.
  const totProd = $derived(filas.reduce((s, f) => s + (Number(f.horas_produccion) || 0), 0));
  const totMant = $derived(filas.reduce((s, f) => s + (Number(f.horas_mantenimiento) || 0), 0));
  const totAver = $derived(filas.reduce((s, f) => s + (Number(f.horas_averia) || 0), 0));
  const totHoras = $derived(totProd + totMant + totAver);
  const eficPlanta = $derived(totHoras ? ((totProd + totMant) / totHoras) * 100 : 0);
  const totBolsas = $derived(filas.reduce((s, f) => s + (Number(f.bolsas) || 0), 0));
  const rendPlanta = $derived(rendimientoEmbolsado(totBolsas, totProd));

  const colorEstado: Record<string, string> = { verde: 'bg-success', amarillo: 'bg-warning', rojo: 'bg-danger' };

  async function salvar() {
    guardando = true;
    try {
      const rows: ProductividadRow[] = filas.map((f) => ({
        maquina_id: f.maquina_id,
        horas_produccion: Number(f.horas_produccion) || 0,
        horas_mantenimiento: Number(f.horas_mantenimiento) || 0,
        horas_averia: Number(f.horas_averia) || 0,
        bolsas: Number(f.bolsas) || 0,
        comentario: f.comentario ?? ''
      }));
      await guardarProductividad(get(fechaSeleccionada), rows);
      toast('Productividad guardada');
    } catch (e) {
      toast('Error al guardar: ' + (e as Error).message, true);
    } finally {
      guardando = false;
    }
  }
</script>

<div class="mb-5 flex items-center justify-between gap-3">
  <h1 class="text-xl font-extrabold text-ink lg:text-2xl">Productividad máquina</h1>
  <button onclick={salvar} disabled={guardando}
    class="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-on-primary disabled:opacity-60">
    <Save size={16} /> {guardando ? 'Guardando…' : 'Guardar'}
  </button>
</div>

{#if cargando}
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{#each Array(4) as _}<Skeleton class="h-28 rounded-2xl" />{/each}</div>
{:else}
  <!-- Resumen global -->
  <div class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
    <KPICard label="Eficiencia de planta" value={eficPlanta} decimals={1} suffix="%" />
    <KPICard label="Horas productivas" value={totProd + totMant} decimals={1} suffix=" h" />
    <KPICard label="Horas en avería" value={totAver} decimals={1} suffix=" h" />
    <KPICard label="Rendimiento embolsado" value={rendPlanta} decimals={1} suffix="%" />
  </div>

  <SectionCard title="Eficiencia por máquina (ideal: 1 bolsa/segundo)">
    <div class="grid gap-3 lg:grid-cols-2">
      {#each filas as f (f.maquina_id)}
        {@const e = efic(f)}
        {@const est = estadoEficiencia(e)}
        {@const h = horas(f)}
        {@const rend = rendimientoEmbolsado(f.bolsas, f.horas_produccion)}
        <div class="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 font-display font-bold text-ink">
              <Factory size={18} class="text-primary" /> {f.nombre}
            </div>
            <StatusBadge estado={est} />
          </div>

          <!-- Eficiencia + barra semáforo -->
          <div class="mt-3 flex items-end justify-between">
            <span class="font-data text-3xl font-extrabold text-ink">{e.toFixed(1)}<span class="text-lg">%</span></span>
            <span class="text-xs text-muted-ink">{h.toFixed(1)} h evaluadas</span>
          </div>
          <div class="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div class="h-full rounded-full {colorEstado[est]} transition-all" style="width:{Math.min(100, e)}%"></div>
          </div>

          <!-- Inputs por estado -->
          <div class="mt-4 grid grid-cols-3 gap-2">
            <label class="text-xs font-semibold text-muted-ink">
              <span class="flex items-center gap-1"><Gauge size={13} class="text-success" /> Producción (h)</span>
              <input type="number" min="0" step="0.1" inputmode="decimal" bind:value={f.horas_produccion}
                class="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-2 font-data text-ink" />
            </label>
            <label class="text-xs font-semibold text-muted-ink">
              <span class="flex items-center gap-1"><Wrench size={13} class="text-warning" /> Mantenim. (h)</span>
              <input type="number" min="0" step="0.1" inputmode="decimal" bind:value={f.horas_mantenimiento}
                class="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-2 font-data text-ink" />
            </label>
            <label class="text-xs font-semibold text-muted-ink">
              <span class="flex items-center gap-1"><AlertTriangle size={13} class="text-danger" /> Avería (h)</span>
              <input type="number" min="0" step="0.1" inputmode="decimal" bind:value={f.horas_averia}
                class="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-2 font-data text-ink" />
            </label>
          </div>

          <div class="mt-2 grid grid-cols-2 gap-2">
            <label class="text-xs font-semibold text-muted-ink">
              Bolsas producidas
              <input type="number" min="0" step="1" inputmode="numeric" bind:value={f.bolsas}
                class="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-2 font-data text-ink" />
            </label>
            <div class="flex flex-col justify-end text-xs text-muted-ink">
              <span>Rend. embolsado: <b class="font-data text-ink">{rend.toFixed(1)}%</b></span>
              <span class="text-[11px]">Ideal: {(Number(f.horas_produccion) * BOLSA_IDEAL_POR_HORA || 0).toLocaleString('es-PE')} bolsas</span>
            </div>
          </div>

          <input bind:value={f.comentario} placeholder="Comentario (motivo de parada, avería…)"
            class="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink" />
        </div>
      {/each}
    </div>

    <p class="mt-4 text-xs text-muted-ink">
      <b>Cómo se calcula:</b> Eficiencia = (Producción + Mantenimiento) ÷ horas evaluadas.
      El mantenimiento cuenta como tiempo productivo; solo la avería y las paradas improductivas penalizan.
      Semáforo: verde ≥ {UMBRAL_EFIC_OK}%, amarillo ≥ {UMBRAL_EFIC_ALERTA}%, rojo &lt; {UMBRAL_EFIC_ALERTA}%.
      El rendimiento de embolsado compara las bolsas reales contra el ideal de 1 bolsa/segundo ({BOLSA_IDEAL_POR_HORA}/hora).
    </p>
  </SectionCard>
{/if}
