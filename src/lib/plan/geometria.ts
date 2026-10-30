import { distanciaManhattan, type Punto } from "@/lib/geometria";
import type { Dataset, Pedido } from "@/types/mundo";

export function depositoDe(dataset: Dataset): Punto {
  return { x: dataset.mundo.deposito_x, y: dataset.mundo.deposito_y };
}

export function distanciaDeRuta(pedidos: Pedido[], deposito: Punto): number {
  let total = 0;
  let actual = deposito;

  for (const pedido of pedidos) {
    total += distanciaManhattan(actual, pedido);
    actual = pedido;
  }

  return total + distanciaManhattan(actual, deposito);
}
