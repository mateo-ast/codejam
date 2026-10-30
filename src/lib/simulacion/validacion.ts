import type { Dataset, Parada, Plan } from "@/types/mundo";

export function validarPlan(dataset: Dataset, plan: Plan): string[] {
  const errores: string[] = [];

  if (!plan || !Array.isArray(plan.rutas)) {
    return ["El plan no tiene una lista de rutas"];
  }

  const vehiculosValidos = new Set(dataset.vehiculos.map(({ id }) => id));
  const pedidosValidos = new Set(dataset.pedidos.map(({ id }) => id));
  const vehiculosUsados = new Set<string>();
  const pedidosUsados = new Set<number>();

  plan.rutas.forEach((ruta, indice) => {
    const etiqueta = `Ruta ${indice + 1}`;

    if (!ruta || typeof ruta.vehiculo !== "string") {
      errores.push(`${etiqueta}: falta el vehículo`);
    } else if (!vehiculosValidos.has(ruta.vehiculo)) {
      errores.push(`${etiqueta}: el vehículo "${ruta.vehiculo}" no existe`);
    } else if (vehiculosUsados.has(ruta.vehiculo)) {
      errores.push(`El vehículo "${ruta.vehiculo}" está repetido`);
    } else {
      vehiculosUsados.add(ruta.vehiculo);
    }

    if (!Array.isArray(ruta?.paradas)) {
      errores.push(`${etiqueta}: falta la lista de paradas`);
      return;
    }

    ruta.paradas.forEach((parada: Parada, posicion: number) => {
      if (parada === "DEPOSITO") return;

      if (typeof parada !== "number" || !Number.isInteger(parada)) {
        errores.push(`${etiqueta}, parada ${posicion + 1}: parada inválida`);
        return;
      }

      if (!pedidosValidos.has(parada)) {
        errores.push(`${etiqueta}: el pedido ${parada} no existe`);
        return;
      }

      if (pedidosUsados.has(parada)) {
        errores.push(`El pedido ${parada} está repetido`);
        return;
      }

      pedidosUsados.add(parada);
    });
  });

  return errores;
}
