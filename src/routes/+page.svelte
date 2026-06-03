<script lang="ts">
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
    getPanelDia,
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

  // Evita doble carga (onMount + $effect) y recargas concurrentes por la misma fecha.
  let fechaCargada = '';
  $effect(() => { const f = $fechaSeleccionada; if (f !== fechaCargada) load(f); });

  async function load(fecha: string) {
    fechaCargada = fecha;
    cargando = true;
    const d = new Date(`${fecha}T12:00:00`);
    const p = await getPanelDia(fecha);  // una sola llamada: todo el dashboard
    parti = p.participacion; familias = p.familias; comparativa = p.comparativa;
    planVsReal = p.plan_vs_real; maquinas = p.maquinas; compuertas = p.compuertas;
    acumMes = Number(p.acum_mes) || 0; acumMesAnt = Number(p.acum_mes_ant) || 0;
    planes = p.plan; planSemanal = p.plan_semanal; planesEspeciales = p.plan_especiales;
    const dias: string[] = [];
    for (let i = 6; i >= 0; i--) { const x = new Date(d); x.setDate(d.getDate() - i); dias.push(x.toISOString().slice(0, 10)); }
    const real = new Map(p.serie7.map((s) => [s.fecha, Number(s.tm)]));
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
