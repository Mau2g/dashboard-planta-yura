<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import SectionCard from '$lib/components/SectionCard.svelte';
  import KPICard from '$lib/components/KPICard.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import ChartCard from '$lib/components/ChartCard.svelte';
  import type { ChartConfiguration } from 'chart.js';
  import Toast from '$lib/components/Toast.svelte';
  import {
    totalDia, participaciones, rendimiento, rendimientoPromedio, planDiario
  } from '$lib/calc';
  import {
    getConfig, cargarDia, acumuladoMes, acumuladoMesAnterior, ultimos7Dias,
    type PuntoEvolucion, type ConfigCompleta
  } from '$lib/repo';
  import { fechaSeleccionada } from '$lib/stores';
  import type { DatosDia } from '$lib/types';

  let cargando = $state(true);
  let sinDatos = $state(false);
  let cfg = $state<ConfigCompleta | null>(null);
  let dia = $state<DatosDia | null>(null);
  let acumMes = $state(0);
  let vsMesAnt = $state<string>('N/D');
  let puntos = $state<PuntoEvolucion[]>([]);

  const total = $derived(dia ? totalDia(dia.despachos || []) : 0);
  const partis = $derived(dia ? participaciones(dia.despachos || []) : []);
  const pctPlan = $derived.by(() => {
    const pm = cfg?.planes.planMensual || 0;
    return pm ? ((total / pm) * 100).toFixed(1) + '%' : 'N/D';
  });
  const rendProm = $derived(dia ? rendimientoPromedio((dia.maquinas || []).map((m) => ({ ratioECS: m.ratioECS, ratioIdeal: m.ratioIdeal }))).toFixed(1) : '0');

  onMount(load);
  $effect(() => { $fechaSeleccionada; load(); });

  async function load() {
    cargando = true; sinDatos = false;
    const fecha = get(fechaSeleccionada);
    if (!cfg) cfg = await getConfig();
    dia = await cargarDia(fecha);
    if (!dia) { sinDatos = true; cargando = false; return; }
    acumMes = await acumuladoMes(fecha);
    const ant = await acumuladoMesAnterior(fecha);
    vsMesAnt = ant ? ((acumMes - ant) / ant * 100).toFixed(1) + '%' : 'N/D';
    puntos = await ultimos7Dias(fecha, cfg.planSemanal, cfg.planesEspeciales, planDiario);
    cargando = false;
  }
</script>

<Toast />

{#if cargando}
  <p class="p-6 text-center text-slate-500">Cargando…</p>
{:else if sinDatos}
  <p class="p-6 text-center text-slate-500">No hay datos para {$fechaSeleccionada}. Registra el día primero.</p>
{:else}
  <div class="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
    <KPICard value={`${total.toFixed(2)} TM`} label="Despacho del día" />
    <KPICard value={pctPlan} label="vs Plan Mensual" />
    <KPICard value={`${acumMes.toFixed(2)} TM`} label="Acumulado Mes" />
    <KPICard value={vsMesAnt} label="vs Mes Anterior" />
    <KPICard value={`${rendProm}%`} label="Rendimiento Promedio Máquinas" />
  </div>

  <SectionCard title="📊 Despachos del día (TM) – alta demanda destacada (>10%)">
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead><tr class="bg-slate-100 text-left"><th class="p-2">Tipo de cemento</th><th class="p-2">TM</th><th class="p-2">% participación</th></tr></thead>
        <tbody>
          {#each partis as p}
            <tr class={p.destacado ? 'bg-[#fff3cd] font-bold text-[#b85c00]' : ''}>
              <td class="border-b border-slate-200 p-2">{p.tipo}</td>
              <td class="border-b border-slate-200 p-2">{p.tm.toFixed(2)}</td>
              <td class="border-b border-slate-200 p-2">{p.pct.toFixed(1)}%</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <div class="mt-4"><strong>Acumulado del mes:</strong> {acumMes.toFixed(2)} TM</div>
  </SectionCard>

  <SectionCard title="📈 Evolución últimos 7 días (despacho total) vs Plan diario">
    <ChartCard config={{
      type: 'bar',
      data: {
        labels: puntos.map((p) => p.label),
        datasets: [
          { label: 'Despacho real (TM)', data: puntos.map((p) => p.real), backgroundColor: 'var(--c-primary)' },
          { label: 'Plan diario (TM)', data: puntos.map((p) => p.plan), type: 'line',
            borderColor: 'var(--c-secondary)', borderDash: [5, 5], fill: false, tension: 0.1 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    } as ChartConfiguration} />
  </SectionCard>

  <SectionCard title="🔬 Resumen máquinas (rendimiento y estado)">
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead><tr class="bg-slate-100 text-left"><th class="p-2">Máquina</th><th class="p-2">Horas</th><th class="p-2">Ratio ECS</th><th class="p-2">Rendimiento</th><th class="p-2">Estado</th></tr></thead>
        <tbody>
          {#each dia!.maquinas || [] as m}
            <tr>
              <td class="border-b border-slate-200 p-2">{m.nombre}</td>
              <td class="border-b border-slate-200 p-2">{m.horasMaquina}</td>
              <td class="border-b border-slate-200 p-2">{m.ratioECS}</td>
              <td class="border-b border-slate-200 p-2">{rendimiento(m.ratioECS, m.ratioIdeal).toFixed(1)}%</td>
              <td class="border-b border-slate-200 p-2"><StatusBadge estado={m.averiaCritica} /></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </SectionCard>

  <SectionCard title="🗄️ Resumen Silo 8 - Horas por compuerta">
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead><tr class="bg-slate-100 text-left"><th class="p-2">Compuerta</th><th class="p-2">Horas trabajadas</th><th class="p-2">Comentario</th></tr></thead>
        <tbody>
          {#each dia!.compuertas || [] as c}
            <tr>
              <td class="border-b border-slate-200 p-2">Compuerta {c.numero}</td>
              <td class="border-b border-slate-200 p-2">{c.horas}</td>
              <td class="border-b border-slate-200 p-2">{c.comentario || '-'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </SectionCard>
{/if}
