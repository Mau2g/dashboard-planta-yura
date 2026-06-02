<script lang="ts">
  import { page } from '$app/stores';
  let { children } = $props();
  const sub = [
    { href: '/avanzado', label: 'Dashboard avanzado' },
    { href: '/avanzado/registro', label: 'Registro completo' }
  ];
</script>

<div class="mb-5 flex gap-2">
  {#each sub as s}
    <a href={s.href}
      class="rounded-full px-4 py-2 text-sm font-semibold
        {$page.url.pathname === s.href ? 'bg-yura text-white' : 'bg-slate-200 text-slate-700'}">
      {s.label}
    </a>
  {/each}
</div>

{@render children()}
