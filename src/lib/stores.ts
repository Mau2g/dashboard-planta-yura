import { writable } from 'svelte/store';

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export const fechaSeleccionada = writable<string>(hoy());
