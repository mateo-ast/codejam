import type { Viaje } from "@/lib/plan/tipos";
import type { Dataset, Plan, Ruta } from "@/types/mundo";

function prioridadPremium(viaje: Viaje): number {
  return viaje.premium > 0 ? 0 : 1;
}

function compararViajes(a: Viaje, b: Viaje, direccion: 1 | -1): number {
  const premiumA = prioridadPremium(a);
  const premiumB = prioridadPremium(b);
  if (premiumA !== premiumB) return premiumA - premiumB;
  return (a.distancia - b.distancia) * direccion;
}

function ordenarIndices(viajes: Viaje[], direccion: 1 | -1): number[] {
  return viajes
    .map((_, indice) => indice)
    .sort((a, b) => {
      const comparacion = compararViajes(viajes[a], viajes[b], direccion);
      return comparacion !== 0 ? comparacion : a - b;
    });
}

function asignarViajesAVehiculos(
  viajes: Viaje[],
  cantidad: number,
): number[][] {
  const cargas = Array.from({ length: cantidad }, () => 0);
  const asignados: number[][] = Array.from({ length: cantidad }, () => []);

  for (const indice of ordenarIndices(viajes, -1)) {
    let elegido = 0;
    for (let vehiculo = 1; vehiculo < cantidad; vehiculo += 1) {
      if (cargas[vehiculo] < cargas[elegido]) {
        elegido = vehiculo;
      }
    }

    asignados[elegido].push(indice);
    cargas[elegido] += viajes[indice].distancia;
  }

  for (const indices of asignados) {
    indices.sort((a, b) => {
      const comparacion = compararViajes(viajes[a], viajes[b], 1);
      return comparacion !== 0 ? comparacion : a - b;
    });
  }

  return asignados;
}

export function planDesdeViajes(dataset: Dataset, viajes: Viaje[]): Plan {
  const rutas: Ruta[] = [];

  for (let i = 0; i < viajes.length && i < dataset.vehiculos.length; i += 1) {
    const viaje = viajes[i];
    if (viaje.paradas.length === 0) continue;
    rutas.push({
      vehiculo: dataset.vehiculos[i].id,
      paradas: [...viaje.paradas],
    });
  }

  return { rutas };
}

export function planConViajes(
  dataset: Dataset,
  viajes: Viaje[],
  cantidadVehiculos: number,
): Plan {
  const cantidad = Math.min(
    cantidadVehiculos,
    viajes.length,
    dataset.vehiculos.length,
  );

  if (cantidad <= 0 || viajes.length === 0) {
    return { rutas: [] };
  }

  const asignados = asignarViajesAVehiculos(viajes, cantidad);
  const rutas: Ruta[] = [];

  for (let vehiculo = 0; vehiculo < cantidad; vehiculo += 1) {
    const paradas: Ruta["paradas"] = [];

    for (const indice of asignados[vehiculo]) {
      if (paradas.length > 0) {
        paradas.push("DEPOSITO");
      }
      paradas.push(...viajes[indice].paradas);
    }

    if (paradas.length > 0) {
      rutas.push({ vehiculo: dataset.vehiculos[vehiculo].id, paradas });
    }
  }

  return { rutas };
}

export function construirPlanSimple(dataset: Dataset): Plan {
  const vehiculo = dataset.vehiculos[0];
  if (!vehiculo || dataset.pedidos.length === 0) {
    return { rutas: [] };
  }

  const paradas = [...dataset.pedidos]
    .sort((a, b) => Number(b.premium) - Number(a.premium) || a.id - b.id)
    .map((pedido) => pedido.id);

  return { rutas: [{ vehiculo: vehiculo.id, paradas }] };
}
