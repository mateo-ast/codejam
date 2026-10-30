import { distanciaManhattan, type Punto } from "@/lib/geometria";
import { EPSILON, PASADAS_OR_OPT } from "@/lib/plan/constantes";
import { costoRuta } from "@/lib/plan/costos";
import type { Mundo, Pedido } from "@/types/mundo";

const PASADAS_PREMIUM_CHICO = 6;
const PASADAS_PREMIUM_MEDIANO = 3;
const PASADAS_PREMIUM_GRANDE = 1;
const PEDIDOS_PREMIUM_CHICO = 40;
const PEDIDOS_PREMIUM_MEDIANO = 80;
const PEDIDOS_LARGO_CHICO = 60;
const LARGO_CHICO = 3;
const LARGO_GRANDE = 2;

export function mejorarConOrOpt(entrada: Pedido[], deposito: Punto): Pedido[] {
  if (entrada.length < 3) return [...entrada];

  let ruta = [...entrada];

  for (let pasada = 0; pasada < PASADAS_OR_OPT; pasada += 1) {
    let mejorDelta = -EPSILON;
    let mejorInicio = -1;
    let mejorLargo = 0;
    let mejorInsercion = -1;
    let mejorInvertido = false;

    for (let largo = 1; largo <= Math.min(3, ruta.length - 1); largo += 1) {
      for (let inicio = 0; inicio + largo <= ruta.length; inicio += 1) {
        const segmento = ruta.slice(inicio, inicio + largo);
        const previo = inicio === 0 ? deposito : ruta[inicio - 1];
        const siguiente =
          inicio + largo === ruta.length ? deposito : ruta[inicio + largo];
        const ahorro =
          distanciaManhattan(previo, segmento[0]) +
          distanciaManhattan(segmento[segmento.length - 1], siguiente) -
          distanciaManhattan(previo, siguiente);

        const resto = [...ruta.slice(0, inicio), ...ruta.slice(inicio + largo)];

        for (let insercion = 0; insercion <= resto.length; insercion += 1) {
          if (insercion === inicio) continue;

          const antes = insercion === 0 ? deposito : resto[insercion - 1];
          const despues =
            insercion === resto.length ? deposito : resto[insercion];

          for (const invertido of [false, true]) {
            const primero = invertido
              ? segmento[segmento.length - 1]
              : segmento[0];
            const ultimo = invertido
              ? segmento[0]
              : segmento[segmento.length - 1];
            const delta =
              distanciaManhattan(antes, primero) +
              distanciaManhattan(ultimo, despues) -
              distanciaManhattan(antes, despues) -
              ahorro;

            if (delta < mejorDelta) {
              mejorDelta = delta;
              mejorInicio = inicio;
              mejorLargo = largo;
              mejorInsercion = insercion;
              mejorInvertido = invertido;
            }
          }
        }
      }
    }

    if (mejorInicio < 0) break;

    let segmento = ruta.slice(mejorInicio, mejorInicio + mejorLargo);
    if (mejorInvertido) segmento = segmento.reverse();

    const resto = [
      ...ruta.slice(0, mejorInicio),
      ...ruta.slice(mejorInicio + mejorLargo),
    ];
    ruta = [
      ...resto.slice(0, mejorInsercion),
      ...segmento,
      ...resto.slice(mejorInsercion),
    ];
  }

  return ruta;
}

export function mejorarConOrOptCosto(
  entrada: Pedido[],
  deposito: Punto,
  mundo: Mundo,
): Pedido[] {
  if (entrada.length < 3) return [...entrada];

  let ruta = [...entrada];
  let mejorCosto = costoRuta(ruta, deposito, mundo);
  const maxLargo =
    ruta.length <= PEDIDOS_LARGO_CHICO ? LARGO_CHICO : LARGO_GRANDE;
  const maxPasadas =
    ruta.length <= PEDIDOS_PREMIUM_CHICO
      ? PASADAS_PREMIUM_CHICO
      : ruta.length <= PEDIDOS_PREMIUM_MEDIANO
        ? PASADAS_PREMIUM_MEDIANO
        : PASADAS_PREMIUM_GRANDE;

  for (let pasada = 0; pasada < maxPasadas; pasada += 1) {
    let huboMejora = false;

    for (
      let largo = 1;
      largo <= Math.min(maxLargo, ruta.length - 1);
      largo += 1
    ) {
      for (let inicio = 0; inicio + largo <= ruta.length; inicio += 1) {
        const segmento = ruta.slice(inicio, inicio + largo);
        const resto = [...ruta.slice(0, inicio), ...ruta.slice(inicio + largo)];

        for (let insercion = 0; insercion <= resto.length; insercion += 1) {
          if (insercion === inicio) continue;

          for (const invertido of [false, true]) {
            const bloque = invertido ? [...segmento].reverse() : segmento;
            const candidata = [
              ...resto.slice(0, insercion),
              ...bloque,
              ...resto.slice(insercion),
            ];
            const costo = costoRuta(candidata, deposito, mundo);

            if (costo < mejorCosto - EPSILON) {
              ruta = candidata;
              mejorCosto = costo;
              huboMejora = true;
            }
          }
        }
      }
    }

    if (!huboMejora) break;
  }

  return ruta;
}
