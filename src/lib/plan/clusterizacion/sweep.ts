import { distanciaManhattan, type Punto } from "@/lib/geometria";
import type { Pedido } from "@/types/mundo";

export function clusterizarSweep(
  pedidos: Pedido[],
  k: number,
  deposito: Punto,
  offset: number,
): Pedido[][] {
  if (pedidos.length === 0 || k <= 0) return [];

  const cantidad = Math.min(k, pedidos.length);
  const ordenados = [...pedidos].sort((a, b) => {
    const anguloA = Math.atan2(a.y - deposito.y, a.x - deposito.x);
    const anguloB = Math.atan2(b.y - deposito.y, b.x - deposito.x);
    if (anguloA !== anguloB) return anguloA - anguloB;

    const distanciaA = distanciaManhattan(a, deposito);
    const distanciaB = distanciaManhattan(b, deposito);
    if (distanciaA !== distanciaB) return distanciaA - distanciaB;

    return a.id - b.id;
  });

  const total = ordenados.length;
  const inicio = ((offset % total) + total) % total;
  const rotados = [...ordenados.slice(inicio), ...ordenados.slice(0, inicio)];
  const base = Math.floor(total / cantidad);
  const sobrante = total % cantidad;
  const grupos: Pedido[][] = [];

  let cursor = 0;
  for (let grupo = 0; grupo < cantidad; grupo += 1) {
    const tamano = base + (grupo < sobrante ? 1 : 0);
    grupos.push(rotados.slice(cursor, cursor + tamano));
    cursor += tamano;
  }

  return grupos.filter((grupo) => grupo.length > 0);
}
