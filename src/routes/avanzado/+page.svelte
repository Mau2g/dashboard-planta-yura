<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { Chart, registerables } from 'chart.js';
  import SectionCard from '$lib/components/SectionCard.svelte';
  import KPICard from '$lib/components/KPICard.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { cumplimiento, pivotComparativa, type FilaComparativa } from '$lib/calc_b';
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
    const paleta = ['#94a3b8', '#eab308', '#034694', '#10b981'];
    const colores: Record<number, string> = {};
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
