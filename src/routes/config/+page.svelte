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
