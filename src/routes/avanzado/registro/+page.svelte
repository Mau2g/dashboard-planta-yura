<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import SectionCard from '$lib/components/SectionCard.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { toast } from '$lib/components/toastStore';
  import { MAQUINAS, TEMPORALES } from '$lib/constants';
  import { rendimiento, utilizacion, porcentajeLleno } from '$lib/calc';
  import { pesoPromedioKg } from '$lib/calc_b';
  import { getTipos, guardarParte, cargarParte, type TipoB } from '$lib/repo_b';
  import { fechaSeleccionada } from '$lib/stores';

  interface LineaUI { tipo_id: number; nombre: string; familia: string; bolsas: number; tm: number; }

  let tipos = $state<TipoB[]>([]);
  let lineas = $state<LineaUI[]>([]);
  let venta = $state({ nacional_tm: 0, export_tm: 0, a_construir_tm: 0 });
  let maquinas = $state(MAQUINAS.map((m) => ({ maquina_id: m.id, nombre: m.nombre, ratio_ideal: m.ratioIdeal, horas_maquina: 0, ratio_ecs: 0, operativos: 0, comentario: '', averia_critica: 'verde' })));
  let temporalesUI = $state(TEMPORALES.map((t, i) => ({ temporal_id: i + 1, nombre: t.nombre, capacidad: t.capacidad, inventario: 0 })));
  let compuertas = $state(Array.from({ length: 8 }, (_, i) => ({ numero: i + 1, horas: 0, comentario: '' })));
  let veh = $state({ llamado: 0, proceso: 0, playa: 0 });
  let acumuladoAjuste = $state(0);
  let comentario = $state('');

  const totalTm = $derived(lineas.reduce((s, l) => s + (Number(l.tm) || 0), 0));
  const totalBolsas = $derived(lineas.reduce((s, l) => s + (Number(l.bolsas) || 0), 0));
  const ventaTotal = $derived((Number(venta.nacional_tm) || 0) + (Number(venta.export_tm) || 0));

  onMount(async () => {
    tipos = await getTipos();
    lineas = tipos.map((t) => ({ tipo_id: t.id, nombre: t.nombre, familia: t.familia, bolsas: 0, tm: 0 }));
    await recargar();
  });

  async function recargar() {
    const fecha = get(fechaSeleccionada);
    const p = await cargarParte(fecha);
    if (!p) return;
    lineas = tipos.map((t) => {
      const d = p.despachos.find((x) => x.tipo_id === t.id);
      return { tipo_id: t.id, nombre: t.nombre, familia: t.familia, bolsas: d?.bolsas ?? 0, tm: d?.tm ?? 0 };
    });
    venta = { ...p.venta };
    maquinas = MAQUINAS.map((m) => {
      const r = p.maquinas.find((x) => x.maquina_id === m.id);
      return { maquina_id: m.id, nombre: m.nombre, ratio_ideal: m.ratioIdeal,
        horas_maquina: r?.horas_maquina ?? 0, ratio_ecs: r?.ratio_ecs ?? 0, operativos: r?.operativos ?? 0,
        comentario: r?.comentario ?? '', averia_critica: r?.averia_critica ?? 'verde' };
    });
    temporalesUI = TEMPORALES.map((t, i) => {
      const r = p.temporales.find((x) => x.temporal_id === i + 1);
      return { temporal_id: i + 1, nombre: t.nombre, capacidad: t.capacidad, inventario: r?.inventario ?? 0 };
    });
    compuertas = compuertas.map((c) => {
      const r = p.compuertas.find((x) => x.numero === c.numero);
      return r ? { numero: c.numero, horas: r.horas, comentario: r.comentario } : c;
    });
    veh = { llamado: p.veh_llamado, proceso: p.veh_proceso, playa: p.veh_playa };
    acumuladoAjuste = p.acumulado_ajuste;
    comentario = p.comentario;
  }

  async function guardar() {
    const fecha = get(fechaSeleccionada);
    if (!fecha) return toast('Seleccione una fecha', true);
    await guardarParte({
      fecha,
      veh_llamado: veh.llamado, veh_proceso: veh.proceso, veh_playa: veh.playa,
      acumulado_ajuste: Number(acumuladoAjuste) || 0, comentario,
      despachos: $state.snapshot(lineas).map((l) => ({ tipo_id: l.tipo_id, nombre: l.nombre, familia: l.familia, bolsas: Number(l.bolsas) || 0, tm: Number(l.tm) || 0 })),
      venta: $state.snapshot(venta),
      maquinas: $state.snapshot(maquinas).map((m) => ({ maquina_id: m.maquina_id, horas_maquina: m.horas_maquina, ratio_ecs: m.ratio_ecs, operativos: m.operativos, comentario: m.comentario, averia_critica: m.averia_critica })),
      temporales: $state.snapshot(temporalesUI).map((t) => ({ temporal_id: t.temporal_id, inventario: t.inventario })),
      compuertas: $state.snapshot(compuertas)
    });
    toast(`Parte guardado para ${fecha}`);
  }
</script>

<Toast />

<SectionCard title="🚚 Despacho por tipo (bolsas + TM)">
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead><tr class="bg-slate-100 text-left"><th class="p-2">Tipo</th><th class="p-2">Familia</th><th class="p-2">Bolsas</th><th class="p-2">TM</th><th class="p-2">Peso prom. (kg)</th></tr></thead>
      <tbody>
        {#each lineas as l}
          <tr>
            <td class="border-b border-slate-200 p-2">{l.nombre}</td>
            <td class="border-b border-slate-200 p-2"><span class="rounded bg-slate-100 px-2 py-0.5 text-xs">{l.familia}</span></td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="1" class="w-28 rounded-xl border border-slate-300 px-2 py-1" bind:value={l.bolsas} /></td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="0.01" class="w-28 rounded-xl border border-slate-300 px-2 py-1" bind:value={l.tm} /></td>
            <td class="border-b border-slate-200 p-2">{pesoPromedioKg(l.tm, l.bolsas).toFixed(2)}</td>
          </tr>
        {/each}
      </tbody>
      <tfoot><tr class="font-bold"><td class="p-2">Total</td><td></td><td class="p-2">{totalBolsas}</td><td class="p-2">{totalTm.toFixed(2)}</td><td></td></tr></tfoot>
    </table>
  </div>
</SectionCard>

<SectionCard title="💰 Ventas del día (TM)">
  <div class="flex flex-wrap items-end gap-5">
    <div class="flex-1"><label class="block text-sm">Nacional:</label><input type="number" step="0.01" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={venta.nacional_tm} /></div>
    <div class="flex-1"><label class="block text-sm">Exportación:</label><input type="number" step="0.01" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={venta.export_tm} /></div>
    <div class="flex-1"><label class="block text-sm">A construir:</label><input type="number" step="0.01" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={venta.a_construir_tm} /></div>
    <div class="flex-1"><strong>Total ventas: {ventaTotal.toFixed(2)} TM</strong></div>
  </div>
</SectionCard>

<SectionCard title="⚙️ Máquinas embolsadoras">
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead><tr class="bg-slate-100 text-left"><th class="p-2">Máquina</th><th class="p-2">Horas</th><th class="p-2">Ratio ECS</th><th class="p-2">Ratio Ideal</th><th class="p-2">Operativos</th><th class="p-2">Rend.</th><th class="p-2">Util.</th><th class="p-2">Comentario</th><th class="p-2">Estado</th></tr></thead>
      <tbody>
        {#each maquinas as m}
          <tr>
            <td class="border-b border-slate-200 p-2">{m.nombre}</td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="0.01" class="w-20 rounded-xl border border-slate-300 px-2 py-1" bind:value={m.horas_maquina} /></td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="1" class="w-20 rounded-xl border border-slate-300 px-2 py-1" bind:value={m.ratio_ecs} /></td>
            <td class="border-b border-slate-200 p-2">{m.ratio_ideal}</td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="1" class="w-16 rounded-xl border border-slate-300 px-2 py-1" bind:value={m.operativos} /></td>
            <td class="border-b border-slate-200 p-2">{rendimiento(m.ratio_ecs, m.ratio_ideal).toFixed(1)}%</td>
            <td class="border-b border-slate-200 p-2">{utilizacion(m.horas_maquina).toFixed(1)}%</td>
            <td class="border-b border-slate-200 p-2"><input class="w-32 rounded-xl border border-slate-300 px-2 py-1" bind:value={m.comentario} /></td>
            <td class="border-b border-slate-200 p-2">
              <select class="rounded-xl border border-slate-300 px-2 py-1" bind:value={m.averia_critica}>
                <option value="verde">🟢 Operativo</option><option value="amarillo">🟡 En reparación</option><option value="rojo">🔴 Avería</option>
              </select>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</SectionCard>

<SectionCard title="🏬 Temporales">
  {#each temporalesUI as t}
    <div class="mb-4 flex flex-wrap items-center gap-5">
      <div class="flex-[2]"><strong>{t.nombre}</strong> — Capacidad: {t.capacidad} TM</div>
      <div class="flex-1"><label class="block text-sm">Inventario (TM):</label><input type="number" step="0.01" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={t.inventario} /></div>
      <div class="flex-1">% lleno: {porcentajeLleno(t.inventario, t.capacidad).toFixed(1)}%</div>
    </div>
  {/each}
</SectionCard>

<SectionCard title="🗄️ Silo 8 - Compuertas">
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead><tr class="bg-slate-100 text-left"><th class="p-2">Compuerta</th><th class="p-2">Horas</th><th class="p-2">Comentario</th></tr></thead>
      <tbody>
        {#each compuertas as c}
          <tr>
            <td class="border-b border-slate-200 p-2">Compuerta {c.numero}</td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="0.5" class="w-20 rounded-xl border border-slate-300 px-2 py-1" bind:value={c.horas} /></td>
            <td class="border-b border-slate-200 p-2"><input class="w-full rounded-xl border border-slate-300 px-2 py-1" bind:value={c.comentario} /></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</SectionCard>

<SectionCard title="🚗 Vehículos y observaciones">
  <div class="flex flex-wrap items-end gap-5">
    <div class="flex-1"><label class="block text-sm">Llamado:</label><input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={veh.llamado} /></div>
    <div class="flex-1"><label class="block text-sm">Proceso:</label><input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={veh.proceso} /></div>
    <div class="flex-1"><label class="block text-sm">Playa:</label><input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={veh.playa} /></div>
    <div class="flex-1"><label class="block text-sm">Ajuste acumulado:</label><input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={acumuladoAjuste} /></div>
  </div>
  <div class="mt-4"><label class="block text-sm">Comentario general:</label><textarea rows="2" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={comentario}></textarea></div>
</SectionCard>

<div class="mt-5 flex justify-end gap-4">
  <button class="rounded-full bg-yura px-6 py-3 font-bold text-white" onclick={guardar}>💾 Guardar parte</button>
  <button class="rounded-full bg-slate-200 px-6 py-3 font-bold" onclick={recargar}>⬇️ Recargar fecha</button>
</div>
