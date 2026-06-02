<script lang="ts">
  let { estado } = $props(); // 'verde' | 'amarillo' | 'rojo'
  const colores: Record<string, string> = {
    verde: 'bg-green-500', amarillo: 'bg-yellow-500', rojo: 'bg-red-500'
  };
  const textos: Record<string, string> = {
    verde: 'Operativo', amarillo: 'En reparación', rojo: 'Avería reportada'
  };
</script>

<span class="inline-flex items-center gap-2">
  <span class="inline-block h-5 w-5 rounded-full {colores[estado] ?? 'bg-green-500'}"></span>
  {textos[estado] ?? 'Operativo'}
</span>
