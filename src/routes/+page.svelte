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
  import { totalTm, totalBolsas, cumplimiento, pivotComparativa } from '$lib/calc';
  import { MESES_CORTOS } from '$lib/constants';
  import {
    getParticipacionDia, getDespachoPorFamilia, getComparativaAnual, getPlanVsReal, getUltimosDespachosDiarios,
    type ParticipacionRow, type FamiliaRow, type ComparativaRow, type PlanVsRealRow
  } from '$lib/repo';
  import { fechaSeleccionada } from '$lib/stores';

  let cargando = $state(true);
  let parti = $state<ParticipacionRow[]>([]);
  let familias = $state<FamiliaRow[]>([]);
  let comparativa = $state<ComparativaRow[]>([]);
  let planVsReal = $state<PlanVsRealRow[]>([]);
  let spark = $state<number[]>([]);

  const tmDia = $derived(totalTm(parti));
  const bolsasDia = $derived(totalBolsas(parti));
  const cumplAnual = $derived(cumplimiento(planVsReal.reduce((s, r) => s + Number(r.real_tm || 0), 0), planVsReal.reduce((s, r) => s + Number(r.plan_tm || 0), 0)));

  function cssVar(name: string) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

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
    const d = new Date(fecha); const desde = new Date(d); desde.setDate(d.getDate() - 6);
    [parti, familias, comparativa, planVsReal] = await Promise.all([
      getParticipacionDia(fecha), getDespachoPorFamilia(fecha), getComparativaAnual(), getPlanVsReal(anio)
    ]);
    const serie = await getUltimosDespachosDiarios(desde.toISOString().slice(0, 10), fecha);
    spark = serie.map((s) => s.tm);
    cargando = false;
  }
</script>

<h1 class="mb-5 text-xl font-extrabold text-ink lg:text-2xl">Dashboard — {$fechaSeleccionada}</h1>

{#if cargando}
  <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">{#each Array(4) as _}<Skeleton class="h-28 rounded-2xl" />{/each}</div>
  <Skeleton class="mt-5 h-72 rounded-2xl" />
{:else}
  <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
    <KPICard label="Despacho del día" value={tmDia} decimals={2} suffix=" TM" spark={spark} />
    <KPICard label="Bolsas del día" value={bolsasDia} />
    <KPICard label="Familias despachadas" value={familias.length} />
    <KPICard label="Cumplimiento plan (año)" value={cumplAnual} decimals={1} suffix="%" />
  </div>

  <div class="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
    <SectionCard title="Despacho por familia">
      {#if familias.length}<ChartCard config={chartFamilias} />
      {:else}<EmptyState titulo="Sin datos del día" descripcion="Registra el parte para ver el desglose por familia." />{/if}
    </SectionCard>

    <SectionCard title="Participación por tipo">
      {#if parti.length}
        <ResponsiveTable
          columns={[ {key:'tipo',label:'Tipo'}, {key:'familia',label:'Familia'}, {key:'bolsas',label:'Bolsas',mono:true}, {key:'tm',label:'TM',mono:true}, {key:'pct',label:'%',mono:true} ]}
          rows={parti.map((p) => ({ tipo: p.tipo, familia: p.familia, bolsas: p.bolsas, tm: Number(p.tm).toFixed(2), pct: Number(p.pct).toFixed(1) + '%', _hot: p.pct > 10 }))}
          rowClass={(r) => r._hot ? 'bg-warning/10 font-semibold text-warning' : ''} />
      {:else}<EmptyState titulo="Sin despachos" />{/if}
    </SectionCard>
  </div>

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

  <SectionCard title="Estado de máquinas (último parte del día)">
    {#if parti.length}
      <p class="text-sm text-muted-ink">Consulta el detalle operativo en la pestaña Registro.</p>
    {:else}<EmptyState titulo="Sin datos operativos" />{/if}
  </SectionCard>
{/if}
