<script lang="ts">
  let { title, children } = $props();
</script>

<section class="mb-5 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
  <header class="border-b border-border px-4 py-3 lg:px-5">
    <h2 class="text-sm font-bold uppercase tracking-wide text-primary">{title}</h2>
  </header>
  <div class="p-4 lg:p-5">{@render children()}</div>
</section>
