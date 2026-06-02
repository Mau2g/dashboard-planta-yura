import { writable } from 'svelte/store';
export interface ToastMsg { id: number; texto: string; error: boolean; }
export const toasts = writable<ToastMsg[]>([]);
let n = 1;
export function toast(texto: string, error = false) {
  const id = n++;
  toasts.update((a) => [...a, { id, texto, error }]);
  setTimeout(() => toasts.update((a) => a.filter((t) => t.id !== id)), 3500);
}
