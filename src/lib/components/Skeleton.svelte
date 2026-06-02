<script lang="ts">
  let { class: cls = 'h-6 w-full' } = $props<{ class?: string }>();
</script>

<div class="animate-pulse rounded-md bg-surface-2 {cls}"></div>
