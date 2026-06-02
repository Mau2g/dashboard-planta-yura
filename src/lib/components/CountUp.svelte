<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  let { value = 0, decimals = 0, duration = 700 } = $props<{ value: number; decimals?: number; duration?: number }>();
  let shown = $state(0);
  function fmt(n: number) { return n.toLocaleString('es-PE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }); }
  function animate(to: number) {
    if (!browser || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { shown = to; return; }
    const from = shown, start = performance.now();
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      shown = from + (to - from) * (1 - Math.pow(1 - p, 3));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  onMount(() => animate(value));
  $effect(() => { animate(value); });
</script>

<span class="font-data">{fmt(shown)}</span>
