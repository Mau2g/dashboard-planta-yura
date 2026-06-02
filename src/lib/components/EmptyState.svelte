<script lang="ts">
  import { Inbox } from 'lucide-svelte';
  let { titulo, descripcion = '' } = $props<{ titulo: string; descripcion?: string }>();
</script>

<div class="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
  <div class="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted-ink"><Inbox size={24} /></div>
  <p class="font-semibold text-ink">{titulo}</p>
  {#if descripcion}<p class="max-w-sm text-sm text-muted-ink">{descripcion}</p>{/if}
</div>
