import { distanciaManhattan, type Punto } from "@/lib/geometria";
import type { Pedido } from "@/types/mundo";

export function ordenarPorVecinoMasCercano(
  pedidos: Pedido[],
  desde: Punto,
): Pedido[] {
  const pendientes = [...pedidos].sort((a, b) => a.id - b.id);
  const orden: Pedido[] = [];
  let actual = desde;

  while (pendientes.length > 0) {
    let indice = 0;
    let mejorDistancia = Number.POSITIVE_INFINITY;

    for (let i = 0; i < pendientes.length; i += 1) {
      const distancia = distanciaManhattan(pendientes[i], actual);
      if (
        distancia < mejorDistancia ||
        (distancia === mejorDistancia &&
          pendientes[i].id < pendientes[indice].id)
      ) {
        indice = i;
        mejorDistancia = distancia;
      }
    }

    const elegido = pendientes.splice(indice, 1)[0];
    orden.push(elegido);
    actual = elegido;
  }

  return orden;
}
