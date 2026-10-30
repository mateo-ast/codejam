import type { Dataset, Plan } from "@/types/mundo";

export function generarPlanSimple(dataset: Dataset): Plan {
  const vehiculo = dataset.vehiculos[0];
  if (!vehiculo || dataset.pedidos.length === 0) {
    return { rutas: [] };
  }

  const paradas = [...dataset.pedidos]
    .sort((a, b) => a.id - b.id)
    .map((pedido) => pedido.id);

  return { rutas: [{ vehiculo: vehiculo.id, paradas }] };
}
