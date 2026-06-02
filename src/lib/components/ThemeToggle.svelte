<script lang="ts">
  import { theme, toggleTheme } from '$lib/theme';
  import { Sun, Moon } from 'lucide-svelte';
</script>

<button onclick={toggleTheme} aria-label="Cambiar tema"
  class="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface text-ink transition hover:bg-surface-2">
  {#if $theme === 'dark'}<Sun size={20} />{:else}<Moon size={20} />{/if}
</button>
