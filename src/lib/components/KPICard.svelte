<script lang="ts">
  import CountUp from './CountUp.svelte';
  import Sparkline from './Sparkline.svelte';
  import { TrendingUp, TrendingDown } from 'lucide-svelte';
  let { label, value, decimals = 0, suffix = '', trend = null, spark = [] } =
    $props<{ label: string; value: number; decimals?: number; suffix?: string; trend?: number | null; spark?: number[] }>();
  const up = $derived(trend !== null && trend >= 0);
</script>

<div class="rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:shadow-md">
  <div class="flex items-start justify-between gap-2">
    <span class="text-xs font-medium uppercase tracking-wide text-muted-ink">{label}</span>
    {#if spark.length}<Sparkline data={spark} />{/if}
  </div>
  <div class="mt-2 text-2xl font-extrabold text-ink lg:text-3xl">
    <CountUp {value} {decimals} />{suffix}
  </div>
  {#if trend !== null}
    <div class="mt-1 flex items-center gap-1 text-xs font-semibold {up ? 'text-success' : 'text-danger'}">
      {#if up}<TrendingUp size={14} />{:else}<TrendingDown size={14} />{/if}
      {up ? '+' : ''}{trend.toFixed(1)}%
    </div>
  {/if}
</div>
