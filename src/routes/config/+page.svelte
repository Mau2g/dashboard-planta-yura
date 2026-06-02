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
