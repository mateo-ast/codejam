import { distanciaManhattan, type Punto } from "@/lib/geometria";
import type { Pedido } from "@/types/mundo";

const PASADAS_CHICO = 120;
const PASADAS_MEDIANO = 40;
const PASADAS_GRANDE = 12;
const PEDIDOS_CHICO = 300;
const PEDIDOS_MEDIANO = 800;

export function mejorarConDosOpt(entrada: Pedido[], deposito: Punto): Pedido[] {
  if (entrada.length < 3) return [...entrada];

  let ruta = [...entrada];
  const maxPasadas =
    ruta.length <= PEDIDOS_CHICO
      ? PASADAS_CHICO
      : ruta.length <= PEDIDOS_MEDIANO
        ? PASADAS_MEDIANO
        : PASADAS_GRANDE;

  for (let pasada = 0; pasada < maxPasadas; pasada += 1) {
    let mejorDelta = -0.000001;
    let mejorI = -1;
    let mejorJ = -1;

    for (let i = 0; i < ruta.length - 1; i += 1) {
      const previo = i === 0 ? deposito : ruta[i - 1];
      const a = ruta[i];

      for (let j = i + 1; j < ruta.length; j += 1) {
        const b = ruta[j];
        const siguiente = j === ruta.length - 1 ? deposito : ruta[j + 1];
        const delta =
          distanciaManhattan(previo, b) +
          distanciaManhattan(a, siguiente) -
          distanciaManhattan(previo, a) -
          distanciaManhattan(b, siguiente);

        if (delta < mejorDelta) {
          mejorDelta = delta;
          mejorI = i;
          mejorJ = j;
        }
      }
    }

    if (mejorI < 0) break;

    const nueva = [...ruta];
    for (let a = mejorI, b = mejorJ; a < b; a += 1, b -= 1) {
      const temporal = nueva[a];
      nueva[a] = nueva[b];
      nueva[b] = temporal;
    }
    ruta = nueva;
  }

  return ruta;
}
