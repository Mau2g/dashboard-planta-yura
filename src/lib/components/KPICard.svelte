<script lang="ts">
  let { value, label } = $props();
</script>

<div class="rounded-[20px] border-l-4 border-yura bg-slate-50 p-4 text-center">
  <div class="text-3xl font-extrabold text-yura">{value}</div>
  <div class="text-xs text-slate-600">{label}</div>
</div>
