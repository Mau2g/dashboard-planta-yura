<script lang="ts">
  import { onMount } from 'svelte';
  import SectionCard from '$lib/components/SectionCard.svelte';
  import KPICard from '$lib/components/KPICard.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import Sparkline from '$lib/components/Sparkline.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import ResponsiveTable from '$lib/components/ResponsiveTable.svelte';
  import { MAQUINAS } from '$lib/constants';
  import { getFechasMaquinaHora, getMaquinaHora, type MaquinaHoraRow } from '$lib/repo';
  import { Clock } from 'lucide-svelte';

  let cargando = $state(true);
  let fechas = $state<string[]>([]);
  let fecha = $state('');
  let maquinaSel = $state('TODAS');
  let datos = $state<MaquinaHoraRow[]>([]);

  const maquinas = [{ id: 'TODAS', nombre: 'Todas' }, ...MAQUINAS.map((m) => ({ id: m.id, nombre: m.nombre }))];

  onMount(async () => {
    fechas = await getFechasMaquinaHora();
    fecha = fechas[0] ?? '';
    await recargar();
    cargando = false;
  });

  async function recargar() {
    if (!fecha) { datos = []; return; }
    datos = await getMaquinaHora(fecha, maquinaSel);
  }
  async function cambiarFecha(v: string) { fecha = v; await recargar(); }
  async function cambiarMaquina(id: string) { maquinaSel = id; await recargar(); }

  // Agrupado por máquina (para la vista "Todas" y para los sparklines).
  const porMaquina = $derived.by(() => {
    const m = new Map<string, MaquinaHoraRow[]>();
    for (const r of datos) { if (!m.has(r.maquina_id)) m.set(r.maquina_id, []); m.get(r.maquina_id)!.push(r); }
    return [...m.entries()].map(([id, filas]) => ({
      id,
      nombre: filas[0]?.maquina ?? id,
      filas: filas.sort((a, b) => a.hora - b.hora),
      bolsasDia: Math.max(0, ...filas.map((f) => f.bolsas_acum)),
      horasOp: Math.max(0, ...filas.map((f) => f.horas_operacion)),
      rechazadas: filas.reduce((s, f) => s + (Number(f.bolsas_rechazadas) || 0), 0),
      ratioProm: (() => {
        const v = filas.map((f) => Number(f.ratio_embolsado) || 0).filter((x) => x > 0 && x < 12000);
        return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
      })()
    }));
  });

  // KPIs globales de la selección.
  const totBolsas = $derived(porMaquina.reduce((s, m) => s + m.bolsasDia, 0));
  const totHorasOp = $derived(porMaquina.reduce((s, m) => s + m.horasOp, 0));
  const totRech = $derived(porMaquina.reduce((s, m) => s + m.rechazadas, 0));

  const fmt = (n: number, d = 0) => Number(n || 0).toLocaleString('es-PE', { maximumFractionDigits: d });
  const hh = (h: number) => `${String(h).padStart(2, '0')}–${String((h + 1) % 24).padStart(2, '0')}`;

  const columnas = [
    { key: 'hora', label: 'Hora', mono: true },
    { key: 'bolsas_hora', label: 'Bolsas/h', mono: true },
    { key: 'bolsas_acum', label: 'Acum.', mono: true },
    { key: 'horas_operacion', label: 'H. oper.', mono: true },
    { key: 'ratio_embolsado', label: 'Ratio', mono: true },
    { key: 'bolsas_rechazadas', label: 'Rechazadas', mono: true }
  ];
  const filasTabla = (filas: MaquinaHoraRow[]) =>
    filas.map((f) => ({
      hora: hh(f.hora),
      bolsas_hora: fmt(f.bolsas_hora),
      bolsas_acum: fmt(f.bolsas_acum),
      horas_operacion: fmt(f.horas_operacion, 2),
      ratio_embolsado: f.ratio_embolsado > 0 && f.ratio_embolsado < 12000 ? fmt(f.ratio_embolsado) : '—',
      bolsas_rechazadas: fmt(f.bolsas_rechazadas)
    }));
</script>

<h1 class="mb-1 text-xl font-extrabold text-ink lg:text-2xl">Detalle por hora y máquina</h1>
<p class="mb-5 text-sm text-muted-ink">Datos horarios del reporte automático ECS. Filtra por máquina y revisa cada franja horaria.</p>

{#if cargando}
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{#each Array(4) as _}<Skeleton class="h-28 rounded-2xl" />{/each}</div>
{:else if fechas.length === 0}
  <EmptyState titulo="Sin datos horarios" descripcion="Aún no hay datos horarios cargados. Importa un reporte ECS diario." />
{:else}
  <!-- Filtros -->
  <div class="mb-5 flex flex-wrap items-center gap-3">
    <label class="text-sm font-semibold text-muted-ink">Fecha
      <select value={fecha} onchange={(e) => cambiarFecha((e.target as HTMLSelectElement).value)}
        class="ml-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink">
        {#each fechas as f}<option value={f}>{f}</option>{/each}
      </select>
    </label>
    <div class="flex flex-wrap gap-1.5">
      {#each maquinas as m}
        <button onclick={() => cambiarMaquina(m.id)}
          class="rounded-full px-3.5 py-1.5 text-sm font-semibold transition
            {maquinaSel === m.id ? 'bg-primary text-on-primary' : 'border border-border bg-surface text-muted-ink hover:text-ink'}">
          {m.nombre}
        </button>
      {/each}
    </div>
  </div>

  <!-- KPIs de la selección -->
  <div class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
    <KPICard label="Bolsas del día" value={totBolsas} />
    <KPICard label="Horas operativas" value={totHorasOp} decimals={1} suffix=" h" />
    <KPICard label="Bolsas rechazadas" value={totRech} />
    <KPICard label="Máquinas" value={porMaquina.length} />
  </div>

  {#if datos.length === 0}
    <EmptyState titulo="Sin datos" descripcion="No hay datos para esta fecha/máquina." />
  {:else}
    {#each porMaquina as m (m.id)}
      <SectionCard title={m.nombre}>
        <div class="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span class="text-muted-ink">Bolsas día: <b class="font-data text-ink">{fmt(m.bolsasDia)}</b></span>
          <span class="text-muted-ink">Horas oper.: <b class="font-data text-ink">{fmt(m.horasOp, 1)} h</b></span>
          <span class="text-muted-ink">Ratio prom.: <b class="font-data text-ink">{fmt(m.ratioProm)}</b></span>
          <span class="text-muted-ink">Rechazadas: <b class="font-data text-ink">{fmt(m.rechazadas)}</b></span>
          <span class="ml-auto"><Sparkline data={m.filas.map((f) => f.bolsas_hora)} /></span>
        </div>
        <ResponsiveTable columns={columnas} rows={filasTabla(m.filas)} />
      </SectionCard>
    {/each}
  {/if}
{/if}
