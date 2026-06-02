<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import SectionCard from '$lib/components/SectionCard.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import { toast } from '$lib/components/toastStore';
  import { MAQUINAS, TEMPORALES } from '$lib/constants';
  import { rendimiento, utilizacion, porcentajeLleno, pesoPromedioKg, totalTm, totalBolsas } from '$lib/calc';
  import { getTipos, guardarParte, cargarParte, despachoMes } from '$lib/repo';
  import { fechaSeleccionada } from '$lib/stores';
  import { Save, RotateCcw } from 'lucide-svelte';

  interface LineaUI { tipo_id: number; nombre: string; familia: string; bolsas: number; tm: number; }
  let cargando = $state(true);
  let guardando = $state(false);
  let lineas = $state<LineaUI[]>([]);
  let venta = $state({ nacional_tm: 0, export_tm: 0, a_construir_tm: 0 });
  let maquinas = $state(MAQUINAS.map((m) => ({ maquina_id: m.id, nombre: m.nombre, ratio_ideal: m.ratio_ideal, horas_maquina: 0, ratio_ecs: 0, operativos: 0, comentario: '', averia_critica: 'verde' })));
  let temporalesUI = $state(TEMPORALES.map((t) => ({ temporal_id: t.id, nombre: t.nombre, capacidad: t.capacidad, inventario: 0 })));
  let compuertas = $state(Array.from({ length: 8 }, (_, i) => ({ numero: i + 1, horas: 0, comentario: '' })));
  let veh = $state({ llamado: 0, proceso: 0, playa: 0 });
  let acumuladoAjuste = $state(0);
  let comentario = $state('');
  let acumMes = $state(0);

  const tm = $derived(totalTm(lineas));
  const bolsas = $derived(totalBolsas(lineas));
  const ventaTotal = $derived((Number(venta.nacional_tm) || 0) + (Number(venta.export_tm) || 0));
  const totalVeh = $derived((Number(veh.llamado) || 0) + (Number(veh.proceso) || 0) + (Number(veh.playa) || 0));
  const acumuladoConAjuste = $derived(acumMes + (Number(acumuladoAjuste) || 0));

  let tipos: { id: number; nombre: string; familia: string }[] = [];
  onMount(async () => { tipos = await getTipos(); await recargar(); cargando = false; });
  $effect(() => { $fechaSeleccionada; if (!cargando) recargar(); });

  async function recargar() {
    const fecha = get(fechaSeleccionada);
    const [y, mo] = fecha.split('-').map(Number);
    acumMes = await despachoMes(y, mo);
    lineas = tipos.map((t) => ({ tipo_id: t.id, nombre: t.nombre, familia: t.familia, bolsas: 0, tm: 0 }));
    const p = await cargarParte(fecha);
    if (!p) {
      venta = { nacional_tm: 0, export_tm: 0, a_construir_tm: 0 };
      maquinas = MAQUINAS.map((m) => ({ maquina_id: m.id, nombre: m.nombre, ratio_ideal: m.ratio_ideal, horas_maquina: 0, ratio_ecs: 0, operativos: 0, comentario: '', averia_critica: 'verde' }));
      temporalesUI = TEMPORALES.map((t) => ({ temporal_id: t.id, nombre: t.nombre, capacidad: t.capacidad, inventario: 0 }));
      compuertas = Array.from({ length: 8 }, (_, i) => ({ numero: i + 1, horas: 0, comentario: '' }));
      veh = { llamado: 0, proceso: 0, playa: 0 }; acumuladoAjuste = 0; comentario = '';
      return;
    }
    lineas = tipos.map((t) => { const d = p.despachos.find((x) => x.tipo_id === t.id); return { tipo_id: t.id, nombre: t.nombre, familia: t.familia, bolsas: d?.bolsas ?? 0, tm: d?.tm ?? 0 }; });
    venta = { ...p.venta };
    maquinas = MAQUINAS.map((m) => { const r = p.maquinas.find((x: any) => x.maquina_id === m.id); return { maquina_id: m.id, nombre: m.nombre, ratio_ideal: m.ratio_ideal, horas_maquina: r?.horas_maquina ?? 0, ratio_ecs: r?.ratio_ecs ?? 0, operativos: r?.operativos ?? 0, comentario: r?.comentario ?? '', averia_critica: r?.averia_critica ?? 'verde' }; });
    temporalesUI = TEMPORALES.map((t) => { const r = p.temporales.find((x: any) => x.temporal_id === t.id); return { temporal_id: t.id, nombre: t.nombre, capacidad: t.capacidad, inventario: r?.inventario ?? 0 }; });
    compuertas = Array.from({ length: 8 }, (_, i) => { const r = p.compuertas.find((x) => x.numero === i + 1); return { numero: i + 1, horas: r?.horas ?? 0, comentario: r?.comentario ?? '' }; });
    veh = { llamado: p.veh_llamado, proceso: p.veh_proceso, playa: p.veh_playa };
    acumuladoAjuste = p.acumulado_ajuste; comentario = p.comentario;
  }

  async function guardar() {
    const fecha = get(fechaSeleccionada);
    if (!fecha) return toast('Seleccione una fecha', true);
    guardando = true;
    try {
      await guardarParte({
        fecha, veh_llamado: veh.llamado, veh_proceso: veh.proceso, veh_playa: veh.playa,
        acumulado_ajuste: Number(acumuladoAjuste) || 0, comentario,
        despachos: $state.snapshot(lineas).map((l) => ({ tipo_id: l.tipo_id, nombre: l.nombre, familia: l.familia, bolsas: Number(l.bolsas) || 0, tm: Number(l.tm) || 0 })),
        venta: $state.snapshot(venta),
        maquinas: $state.snapshot(maquinas).map((m) => ({ maquina_id: m.maquina_id, horas_maquina: m.horas_maquina, ratio_ecs: m.ratio_ecs, operativos: m.operativos, comentario: m.comentario, averia_critica: m.averia_critica })),
        temporales: $state.snapshot(temporalesUI).map((t) => ({ temporal_id: t.temporal_id, inventario: t.inventario })),
        compuertas: $state.snapshot(compuertas)
      });
      toast(`Parte guardado para ${fecha}`);
    } catch (e) { toast('Error al guardar', true); }
    finally { guardando = false; }
  }
</script>

<div class="mb-5 flex items-center justify-between gap-3">
  <h1 class="text-xl font-extrabold text-ink lg:text-2xl">Registro del día</h1>
  <div class="hidden gap-2 sm:flex">
    <button onclick={recargar} class="inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm font-bold text-ink"><RotateCcw size={16} /> Recargar</button>
    <button onclick={guardar} disabled={guardando} class="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-on-primary disabled:opacity-50"><Save size={16} /> {guardando ? 'Guardando…' : 'Guardar'}</button>
  </div>
</div>

{#if cargando}
  <div class="flex flex-col gap-3">{#each Array(4) as _}<Skeleton class="h-40 w-full rounded-2xl" />{/each}</div>
{:else}
  <SectionCard title="Despacho por tipo (bolsas + TM)">
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-sm">
        <thead><tr class="border-b border-border text-left text-muted-ink">
          <th class="px-2 py-2">Tipo</th><th class="px-2 py-2">Familia</th><th class="px-2 py-2">Bolsas</th><th class="px-2 py-2">TM</th><th class="px-2 py-2">Peso prom.</th>
        </tr></thead>
        <tbody>
          {#each lineas as l}
            <tr class="border-b border-border">
              <td class="px-2 py-1.5">{l.nombre}</td>
              <td class="px-2 py-1.5"><span class="rounded bg-surface-2 px-2 py-0.5 text-xs font-semibold">{l.familia}</span></td>
              <td class="px-2 py-1.5"><input type="number" inputmode="numeric" min="0" class="w-24 rounded-lg border border-border bg-surface px-2 py-1.5 font-data" bind:value={l.bolsas} /></td>
              <td class="px-2 py-1.5"><input type="number" inputmode="decimal" step="0.01" min="0" class="w-24 rounded-lg border border-border bg-surface px-2 py-1.5 font-data" bind:value={l.tm} /></td>
              <td class="px-2 py-1.5 font-data">{pesoPromedioKg(l.tm, l.bolsas).toFixed(2)}</td>
            </tr>
          {/each}
        </tbody>
        <tfoot><tr class="font-bold"><td class="px-2 py-2">Total</td><td></td><td class="px-2 py-2 font-data">{bolsas}</td><td class="px-2 py-2 font-data">{tm.toFixed(2)}</td><td></td></tr></tfoot>
      </table>
    </div>
  </SectionCard>

  <SectionCard title="Ventas del día (TM)">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label class="text-sm">Nacional<input type="number" inputmode="decimal" step="0.01" class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-data" bind:value={venta.nacional_tm} /></label>
      <label class="text-sm">Exportación<input type="number" inputmode="decimal" step="0.01" class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-data" bind:value={venta.export_tm} /></label>
      <label class="text-sm">A construir<input type="number" inputmode="decimal" step="0.01" class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-data" bind:value={venta.a_construir_tm} /></label>
      <div class="flex items-end"><span class="font-bold">Total: <span class="font-data">{ventaTotal.toFixed(2)}</span> TM</span></div>
    </div>
  </SectionCard>

  <SectionCard title="Máquinas embolsadoras">
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-sm">
        <thead><tr class="border-b border-border text-left text-muted-ink">
          <th class="px-2 py-2">Máquina</th><th class="px-2 py-2">Horas</th><th class="px-2 py-2">Ratio ECS</th><th class="px-2 py-2">Ideal</th><th class="px-2 py-2">Operativos</th><th class="px-2 py-2">Rend.</th><th class="px-2 py-2">Util.</th><th class="px-2 py-2">Estado</th>
        </tr></thead>
        <tbody>
          {#each maquinas as m}
            <tr class="border-b border-border">
              <td class="px-2 py-1.5 font-semibold">{m.nombre}</td>
              <td class="px-2 py-1.5"><input type="number" inputmode="decimal" step="0.01" class="w-20 rounded-lg border border-border bg-surface px-2 py-1.5 font-data" bind:value={m.horas_maquina} /></td>
              <td class="px-2 py-1.5"><input type="number" inputmode="numeric" class="w-20 rounded-lg border border-border bg-surface px-2 py-1.5 font-data" bind:value={m.ratio_ecs} /></td>
              <td class="px-2 py-1.5 font-data text-muted-ink">{m.ratio_ideal}</td>
              <td class="px-2 py-1.5"><input type="number" inputmode="numeric" class="w-16 rounded-lg border border-border bg-surface px-2 py-1.5 font-data" bind:value={m.operativos} /></td>
              <td class="px-2 py-1.5 font-data">{rendimiento(m.ratio_ecs, m.ratio_ideal).toFixed(1)}%</td>
              <td class="px-2 py-1.5 font-data">{utilizacion(m.horas_maquina).toFixed(1)}%</td>
              <td class="px-2 py-1.5">
                <select class="rounded-lg border border-border bg-surface px-2 py-1.5" bind:value={m.averia_critica}>
                  <option value="verde">Operativo</option><option value="amarillo">Reparación</option><option value="rojo">Avería</option>
                </select>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </SectionCard>

  <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
    <SectionCard title="Temporales">
      {#each temporalesUI as t}
        <div class="mb-3 flex flex-wrap items-center gap-3">
          <div class="min-w-32 flex-1 font-semibold">{t.nombre}<span class="block text-xs font-normal text-muted-ink">Cap. {t.capacidad} TM</span></div>
          <label class="text-sm">Inventario<input type="number" inputmode="decimal" step="0.01" class="mt-1 block w-32 rounded-lg border border-border bg-surface px-2 py-1.5 font-data" bind:value={t.inventario} /></label>
          <div class="font-data text-sm">{porcentajeLleno(t.inventario, t.capacidad).toFixed(1)}%</div>
        </div>
      {/each}
    </SectionCard>

    <SectionCard title="Silo 8 — Compuertas">
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {#each compuertas as c}
          <div class="flex items-center gap-2 rounded-lg border border-border p-2">
            <span class="w-24 text-sm font-semibold">Compuerta {c.numero}</span>
            <input type="number" inputmode="decimal" step="0.5" class="w-16 rounded-lg border border-border bg-surface px-2 py-1 font-data" bind:value={c.horas} />
            <input class="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 py-1 text-sm" placeholder="comentario" bind:value={c.comentario} />
          </div>
        {/each}
      </div>
    </SectionCard>
  </div>

  <SectionCard title="Vehículos y observaciones">
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <label class="text-sm">Llamado<input type="number" inputmode="numeric" class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-data" bind:value={veh.llamado} /></label>
      <label class="text-sm">Proceso<input type="number" inputmode="numeric" class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-data" bind:value={veh.proceso} /></label>
      <label class="text-sm">Playa<input type="number" inputmode="numeric" class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-data" bind:value={veh.playa} /></label>
      <div class="flex items-end font-bold">Total: <span class="ml-1 font-data">{totalVeh}</span></div>
    </div>
    <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <span class="block text-sm">Acumulado del mes (auto + ajuste)</span>
        <div class="mt-1 rounded-lg border border-border bg-surface-2 px-3 py-2 font-data font-bold">{acumuladoConAjuste.toFixed(2)} TM</div>
      </div>
      <label class="block text-sm">Ajuste manual del acumulado<input type="number" inputmode="numeric" class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-data" bind:value={acumuladoAjuste} /></label>
    </div>
    <label class="mt-4 block text-sm">Comentario general<textarea rows="2" class="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2" bind:value={comentario}></textarea></label>
  </SectionCard>

  <!-- Acciones móviles (sticky) -->
  <div class="sticky bottom-24 z-10 mt-4 flex gap-2 sm:hidden">
    <button onclick={recargar} class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-surface-2 px-4 py-3 text-sm font-bold text-ink shadow"><RotateCcw size={16} /> Recargar</button>
    <button onclick={guardar} disabled={guardando} class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-on-primary shadow disabled:opacity-50"><Save size={16} /> {guardando ? 'Guardando…' : 'Guardar'}</button>
  </div>
{/if}
