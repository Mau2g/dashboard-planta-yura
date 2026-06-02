<script lang="ts">
  interface Col { key: string; label: string; mono?: boolean; }
  let { columns, rows, rowClass = () => '' } =
    $props<{ columns: Col[]; rows: Record<string, any>[]; rowClass?: (r: Record<string, any>) => string }>();
</script>

<!-- Desktop/tablet -->
<div class="hidden overflow-x-auto md:block">
  <table class="w-full border-collapse text-sm">
    <thead>
      <tr class="border-b border-border text-left text-muted-ink">
        {#each columns as c}<th class="px-3 py-2 font-semibold uppercase tracking-wide">{c.label}</th>{/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as r}
        <tr class="border-b border-border transition hover:bg-surface-2 {rowClass(r)}">
          {#each columns as c}<td class="px-3 py-2 {c.mono ? 'font-data' : ''}">{r[c.key]}</td>{/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<!-- Mobile: stacked cards -->
<div class="flex flex-col gap-2 md:hidden">
  {#each rows as r}
    <div class="rounded-xl border border-border bg-surface-2/40 p-3 {rowClass(r)}">
      {#each columns as c, i}
        <div class="flex items-center justify-between gap-3 py-0.5 {i === 0 ? 'mb-1 font-semibold text-ink' : 'text-sm'}">
          {#if i !== 0}<span class="text-muted-ink">{c.label}</span>{/if}
          <span class={c.mono ? 'font-data' : ''}>{r[c.key]}</span>
        </div>
      {/each}
    </div>
  {/each}
</div>
