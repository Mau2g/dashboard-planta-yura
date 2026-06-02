<script lang="ts">
  let { title, children } = $props();
</script>

<section class="mb-8 overflow-hidden rounded-[20px] border border-slate-200 bg-white">
  <div class="border-b border-slate-200 bg-slate-100 px-5 py-3.5 font-bold text-yura">{title}</div>
  <div class="p-5">{@render children()}</div>
</section>
