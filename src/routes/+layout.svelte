<script lang="ts">
  import './layout.css';
  import { page } from '$app/stores';
  import { fechaSeleccionada } from '$lib/stores';

  let { children } = $props();

  const tabs = [
    { href: '/registro', label: '📝 Registro Diario' },
    { href: '/', label: '📊 Dashboard KPIs' },
    { href: '/config', label: '⚙️ Configuración' }
  ];
</script>

<div class="mx-auto max-w-[1400px] overflow-hidden rounded-[28px] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.1)] my-5">
  <header class="bg-gradient-to-br from-yura to-yura-dark px-5 py-5 text-center text-white">
    <h1 class="flex items-center justify-center gap-2 text-2xl font-bold">🏭 Gestión Integral Planta Yura</h1>
    <div class="mt-3 flex flex-wrap justify-center gap-3">
      <input type="date" bind:value={$fechaSeleccionada}
        class="rounded-full border border-white bg-white/20 px-4 py-2 text-sm text-white" />
    </div>
  </header>

  <nav class="flex border-b border-slate-200 bg-slate-50">
    {#each tabs as t}
      <a href={t.href}
        class="flex-1 px-4 py-4 text-center font-semibold transition
          {$page.url.pathname === t.href ? 'border-b-[3px] border-yura bg-white text-yura' : 'text-slate-600'}">
        {t.label}
      </a>
    {/each}
  </nav>

  <div class="p-6">
    {@render children()}
  </div>
</div>
