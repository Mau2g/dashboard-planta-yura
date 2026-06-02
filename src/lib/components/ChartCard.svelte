<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables, type ChartConfiguration } from 'chart.js';
  Chart.register(...registerables);
  let { config } = $props<{ config: ChartConfiguration }>();
  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;
  function render() {
    if (!canvas) return;
    if (chart) chart.destroy();
    chart = new Chart(canvas.getContext('2d')!, config);
  }
  onMount(render);
  $effect(() => { config; render(); });
  onDestroy(() => chart?.destroy());
</script>

<div class="relative h-[280px] w-full lg:h-[320px]"><canvas bind:this={canvas}></canvas></div>
