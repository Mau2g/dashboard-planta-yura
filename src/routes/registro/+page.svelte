<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import SectionCard from '$lib/components/SectionCard.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { toast } from '$lib/components/toastStore';
  import { MAQUINAS, TEMPORALES } from '$lib/constants';
  import { rendimiento, utilizacion, porcentajeLleno, totalVehiculos } from '$lib/calc';
  import { getConfig, guardarDia, cargarDia, acumuladoMes } from '$lib/repo';
  import { fechaSeleccionada } from '$lib/stores';
  import type { MaquinaRegistro, Temporal, Compuerta, TipoCemento } from '$lib/types';

  let tipos = $state<TipoCemento[]>([]);
  let tmPorTipo = $state<number[]>([]);
  let maquinas = $state<MaquinaRegistro[]>(
    MAQUINAS.map((m) => ({ id: m.id, nombre: m.nombre, horasMaquina: 0, ratioECS: 0, ratioIdeal: m.ratioIdeal, comentario: '', averiaCritica: 'verde' as const }))
  );
  let temporales = $state<Temporal[]>(TEMPORALES.map((t) => ({ ...t })));
  let compuertas = $state<Compuerta[]>(Array.from({ length: 8 }, (_, i) => ({ numero: i + 1, horas: 0, comentario: '' })));
  let vehiculos = $state({ llamado: 0, proceso: 0, playa: 0 });
  let acumuladoAjuste = $state(0);
  let comentarioGeneral = $state('');
  let acumuladoMesValor = $state(0);

  const totalVeh = $derived(totalVehiculos(vehiculos));
  const acumuladoConAjuste = $derived(acumuladoMesValor + (Number(acumuladoAjuste) || 0));

  onMount(async () => {
    const cfg = await getConfig();
    tipos = cfg.tiposCemento;
    tmPorTipo = tipos.map(() => 0);
    await recargar();
  });

  async function recargar() {
    const fecha = get(fechaSeleccionada);
    acumuladoMesValor = await acumuladoMes(fecha);
    const dia = await cargarDia(fecha);
    if (!dia) return;
    if (dia.despachos) {
      tmPorTipo = tipos.map((t) => {
        const d = dia.despachos.find((x) => x.tipo === t.nombre);
        return d ? d.tm : 0;
      });
    }
    if (dia.maquinas) maquinas = MAQUINAS.map((m) => {
      const r = dia.maquinas.find((x) => x.id === m.id);
      return r ? { ...r } : { id: m.id, nombre: m.nombre, horasMaquina: 0, ratioECS: 0, ratioIdeal: m.ratioIdeal, comentario: '', averiaCritica: 'verde' as const };
    });
    if (dia.temporales) temporales = TEMPORALES.map((t) => {
      const r = dia.temporales.find((x) => x.nombre === t.nombre);
      return { ...t, inventario: r ? r.inventario : 0 };
    });
    if (dia.compuertas) compuertas = compuertas.map((c) => {
      const r = dia.compuertas.find((x) => x.numero === c.numero);
      return r ? { ...r } : c;
    });
    if (dia.vehiculos) vehiculos = { ...dia.vehiculos };
    acumuladoAjuste = dia.acumuladoAjuste || 0;
    comentarioGeneral = dia.comentarioGeneral || '';
  }

  function agregarTipo() { tipos = [...tipos, { nombre: 'Nuevo tipo' }]; tmPorTipo = [...tmPorTipo, 0]; }
  function eliminarTipo(idx: number) {
    tipos = tipos.filter((_, i) => i !== idx);
    tmPorTipo = tmPorTipo.filter((_, i) => i !== idx);
  }

  async function guardar() {
    const fecha = get(fechaSeleccionada);
    if (!fecha) return toast('Seleccione una fecha', true);
    await guardarDia({
      fecha,
      despachos: tipos.map((t, i) => ({ tipo: t.nombre, tm: Number(tmPorTipo[i]) || 0 })),
      maquinas: $state.snapshot(maquinas),
      temporales: $state.snapshot(temporales),
      compuertas: $state.snapshot(compuertas),
      vehiculos: $state.snapshot(vehiculos),
      acumuladoAjuste: Number(acumuladoAjuste) || 0,
      comentarioGeneral
    });
    toast(`Datos guardados para ${fecha}`);
    acumuladoMesValor = await acumuladoMes(fecha);
  }

  async function cargar() {
    await recargar();
    toast(`Datos cargados para ${get(fechaSeleccionada)}`);
  }
</script>

<Toast />

<SectionCard title="🚚 Despacho por tipo de cemento (TM)">
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead><tr class="bg-slate-100">
        <th class="border-b border-slate-200 p-2 text-left">Tipo de cemento</th>
        <th class="border-b border-slate-200 p-2 text-left">TM despachadas</th>
        <th class="border-b border-slate-200 p-2"></th>
      </tr></thead>
      <tbody>
        {#each tipos as tipo, idx}
          <tr>
            <td class="border-b border-slate-200 p-2"><input class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={tipo.nombre} /></td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="0.01" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={tmPorTipo[idx]} /></td>
            <td class="border-b border-slate-200 p-2">
              <button class="rounded bg-slate-200 px-2 py-1" onclick={() => eliminarTipo(idx)}>🗑️</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <button class="mt-2.5 rounded-full bg-slate-200 px-4 py-2 font-bold" onclick={agregarTipo}>➕ Agregar tipo</button>
</SectionCard>

<SectionCard title="🏬 Inventario en Temporales">
  {#each temporales as temp}
    <div class="mb-4 flex flex-wrap items-center gap-5">
      <div class="flex-[2]"><strong>{temp.nombre}</strong><br />Capacidad: {temp.capacidad} TM</div>
      <div class="flex-1">
        <label class="block text-sm">Inventario actual (TM):</label>
        <input type="number" step="0.01" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={temp.inventario} />
      </div>
      <div class="flex-1">% lleno: {porcentajeLleno(temp.inventario, temp.capacidad).toFixed(1)}%</div>
    </div>
  {/each}
</SectionCard>

<SectionCard title="⚙️ Máquinas embolsadoras (H1-H5, Ventomatic)">
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead><tr class="bg-slate-100 text-left">
        <th class="p-2">Máquina</th><th class="p-2">Horas</th><th class="p-2">Ratio ECS</th><th class="p-2">Ratio Ideal</th>
        <th class="p-2">Rend. (%)</th><th class="p-2">Util. (%)</th><th class="p-2">Comentario</th><th class="p-2">Estado</th>
      </tr></thead>
      <tbody>
        {#each maquinas as m}
          <tr>
            <td class="border-b border-slate-200 p-2">{m.nombre}</td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="0.01" class="w-24 rounded-xl border border-slate-300 px-2 py-1" bind:value={m.horasMaquina} /></td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="1" class="w-24 rounded-xl border border-slate-300 px-2 py-1" bind:value={m.ratioECS} /></td>
            <td class="border-b border-slate-200 p-2">{m.ratioIdeal}</td>
            <td class="border-b border-slate-200 p-2">{rendimiento(m.ratioECS, m.ratioIdeal).toFixed(1)}%</td>
            <td class="border-b border-slate-200 p-2">{utilizacion(m.horasMaquina).toFixed(1)}%</td>
            <td class="border-b border-slate-200 p-2"><input class="w-36 rounded-xl border border-slate-300 px-2 py-1" bind:value={m.comentario} /></td>
            <td class="border-b border-slate-200 p-2">
              <select class="rounded-xl border border-slate-300 px-2 py-1" bind:value={m.averiaCritica}>
                <option value="verde">🟢 Operativo</option>
                <option value="amarillo">🟡 En reparación</option>
                <option value="rojo">🔴 Avería reportada</option>
              </select>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</SectionCard>

<SectionCard title="🗄️ Silo 8 - Compuertas">
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <thead><tr class="bg-slate-100 text-left"><th class="p-2">Compuerta</th><th class="p-2">Horas trabajadas</th><th class="p-2">Comentario</th></tr></thead>
      <tbody>
        {#each compuertas as c}
          <tr>
            <td class="border-b border-slate-200 p-2">Compuerta {c.numero}</td>
            <td class="border-b border-slate-200 p-2"><input type="number" step="0.5" class="w-24 rounded-xl border border-slate-300 px-2 py-1" bind:value={c.horas} /></td>
            <td class="border-b border-slate-200 p-2"><input class="w-full rounded-xl border border-slate-300 px-2 py-1" bind:value={c.comentario} placeholder="falla/chuceada/normal" /></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</SectionCard>

<SectionCard title="🚗 Vehículos en planta">
  <div class="flex flex-wrap items-end gap-5">
    <div class="flex-1"><label class="block text-sm">En llamado:</label><input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={vehiculos.llamado} /></div>
    <div class="flex-1"><label class="block text-sm">En proceso:</label><input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={vehiculos.proceso} /></div>
    <div class="flex-1"><label class="block text-sm">En playa:</label><input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={vehiculos.playa} /></div>
    <div class="flex-1"><strong>Total: {totalVeh}</strong></div>
  </div>
</SectionCard>

<SectionCard title="📈 Acumulado del mes y observaciones">
  <div class="flex flex-wrap items-end gap-5">
    <div class="flex-1">
      <label class="block text-sm">Acumulado del mes (TM) - automático:</label>
      <input type="number" readonly class="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2" value={acumuladoConAjuste.toFixed(2)} />
    </div>
    <div class="flex-1">
      <label class="block text-sm">Ajuste manual:</label>
      <input type="number" step="1" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={acumuladoAjuste} />
    </div>
  </div>
  <div class="mt-4">
    <label class="block text-sm">Comentario técnico general del día:</label>
    <textarea rows="2" class="w-full rounded-xl border border-slate-300 px-3 py-2" bind:value={comentarioGeneral} placeholder="Observaciones, incidencias, etc."></textarea>
  </div>
</SectionCard>

<div class="mt-5 flex justify-end gap-4">
  <button class="rounded-full bg-yura px-6 py-3 font-bold text-white" onclick={guardar}>💾 Guardar datos del día</button>
  <button class="rounded-full bg-slate-200 px-6 py-3 font-bold" onclick={cargar}>⬇️ Cargar datos de fecha</button>
</div>
