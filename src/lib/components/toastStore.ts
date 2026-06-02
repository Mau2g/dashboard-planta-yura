import { writable } from 'svelte/store';

export interface ToastMsg { id: number; texto: string; error: boolean; }
export const toasts = writable<ToastMsg[]>([]);
let nextId = 1;

export function toast(texto: string, error = false): void {
  const id = nextId++;
  toasts.update((arr) => [...arr, { id, texto, error }]);
  setTimeout(() => toasts.update((arr) => arr.filter((t) => t.id !== id)), 3000);
}
