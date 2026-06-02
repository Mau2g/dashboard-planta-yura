<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import type { PuntoEvolucion } from '$lib/repo';

  Chart.register(...registerables);

  let { puntos }: { puntos: PuntoEvolucion[] } = $props();
  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  function render() {
    if (!canvas) return;
    if (chart) chart.destroy();
    chart = new Chart(canvas.getContext('2d')!, {
      type: 'bar',
      data: {
        labels: puntos.map((p) => p.label),
        datasets: [
          { label: 'Despacho real (TM)', data: puntos.map((p) => p.real), backgroundColor: '#034694' },
          { label: 'Plan diario (TM)', data: puntos.map((p) => p.plan), type: 'line',
            borderColor: '#eab308', borderDash: [5, 5], fill: false, tension: 0.1 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: true }
    });
  }

  onMount(render);
  $effect(() => { puntos; render(); });
  onDestroy(() => chart?.destroy());
</script>

<canvas bind:this={canvas} class="max-h-[300px]"></canvas>
