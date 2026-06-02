<script lang="ts">
  let { data = [], width = 96, height = 28 } = $props<{ data: number[]; width?: number; height?: number }>();
  const puntos = $derived.by(() => {
    if (!data.length) return '';
    const max = Math.max(...data, 1), min = Math.min(...data, 0), span = max - min || 1;
    return data.map((v: number, i: number) => {
      const x = (i / Math.max(data.length - 1, 1)) * width;
      const y = height - ((v - min) / span) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  });
</script>

<svg {width} {height} viewBox={`0 0 ${width} ${height}`} class="overflow-visible" aria-hidden="true">
  <polyline points={puntos} fill="none" stroke="var(--c-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>
