import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function inicial(): 'light' | 'dark' {
  if (!browser) return 'light';
  return (document.documentElement.dataset.theme as 'light' | 'dark') || 'light';
}
export const theme = writable<'light' | 'dark'>(inicial());
export function toggleTheme() {
  theme.update((t) => {
    const next = t === 'dark' ? 'light' : 'dark';
    if (browser) { document.documentElement.dataset.theme = next; localStorage.setItem('theme', next); }
    return next;
  });
}
