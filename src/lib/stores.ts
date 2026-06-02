import { writable } from 'svelte/store';
export const fechaSeleccionada = writable<string>(new Date().toISOString().slice(0, 10));
