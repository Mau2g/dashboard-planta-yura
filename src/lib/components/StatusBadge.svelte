<script lang="ts">
  let { estado } = $props<{ estado: string }>();
  const cfg: Record<string, { c: string; t: string }> = {
    verde: { c: 'bg-success', t: 'Operativo' },
    amarillo: { c: 'bg-warning', t: 'En reparación' },
    rojo: { c: 'bg-danger', t: 'Avería' }
  };
  const s = $derived(cfg[estado] ?? cfg.verde);
</script>

<span class="inline-flex items-center gap-2 text-sm">
  <span class="h-2.5 w-2.5 rounded-full {s.c}"></span>{s.t}
</span>
