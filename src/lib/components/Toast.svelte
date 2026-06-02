<script lang="ts">
  import { toasts } from './toastStore';
  import { CircleCheck, CircleAlert } from 'lucide-svelte';
</script>

<div class="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[1000] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite">
  {#each $toasts as t (t.id)}
    <div class="pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-on-primary shadow-lg {t.error ? 'bg-danger' : 'bg-primary'}">
      {#if t.error}<CircleAlert size={18} />{:else}<CircleCheck size={18} />{/if}
      {t.texto}
    </div>
  {/each}
</div>
