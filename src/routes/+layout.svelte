<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { fechaSeleccionada } from '$lib/stores';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { Factory, LayoutDashboard, ClipboardList, Settings } from 'lucide-svelte';

  let { children } = $props();
  const nav = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/registro', label: 'Registro', icon: ClipboardList },
    { href: '/config', label: 'Configuración', icon: Settings }
  ];
  const activo = (href: string) => $page.url.pathname === href;
</script>

<div class="relative min-h-dvh">
  <div class="bp-grid absolute inset-0 -z-10"></div>

  <!-- Sidebar (desktop) -->
  <aside class="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface px-4 py-5 lg:flex">
    <div class="mb-8 flex items-center gap-2 text-primary">
      <Factory size={26} /><span class="font-display text-lg font-extrabold">Planta Yura</span>
    </div>
    <nav class="flex flex-col gap-1">
      {#each nav as n}
        <a href={n.href} aria-current={activo(n.href) ? 'page' : undefined}
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition
            {activo(n.href) ? 'bg-primary text-on-primary' : 'text-muted-ink hover:bg-surface-2 hover:text-ink'}">
          <n.icon size={20} />{n.label}
        </a>
      {/each}
    </nav>
  </aside>

  <div class="lg:pl-60">
    <!-- Top bar -->
    <header class="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur lg:px-6">
      <div class="flex items-center gap-2 text-primary lg:hidden">
        <Factory size={22} /><span class="font-display font-extrabold">Yura</span>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <label class="sr-only" for="fecha">Fecha</label>
        <input id="fecha" type="date" bind:value={$fechaSeleccionada}
          class="rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink" />
        <ThemeToggle />
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 pb-28 pt-5 lg:px-6 lg:pb-10">{@render children()}</main>
  </div>

  <!-- Bottom nav (mobile/tablet) -->
  <nav class="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
    {#each nav as n}
      <a href={n.href} aria-current={activo(n.href) ? 'page' : undefined}
        class="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold transition
          {activo(n.href) ? 'text-primary' : 'text-muted-ink'}">
        <n.icon size={22} />{n.label}
      </a>
    {/each}
  </nav>

  <Toast />
</div>
