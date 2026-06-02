<script lang="ts">
  import { toasts } from './toastStore';
</script>

<div class="fixed bottom-5 left-5 right-5 z-[1000] flex flex-col gap-2">
  {#each $toasts as t (t.id)}
    <div class="rounded-full px-4 py-3 text-center text-white {t.error ? 'bg-red-700' : 'bg-yura'}">
      {t.texto}
    </div>
  {/each}
</div>
