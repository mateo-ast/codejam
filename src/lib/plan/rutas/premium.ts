import type { Punto } from "@/lib/geometria";
import { EPSILON } from "@/lib/plan/constantes";
import { costoRuta } from "@/lib/plan/costos";
import { ordenarPorVecinoMasCercano } from "@/lib/plan/rutas/vecino";
import type { Mundo, Pedido } from "@/types/mundo";

const PASADAS_CHICO = 10;
const PASADAS_MEDIANO = 5;
const PASADAS_GRANDE = 2;
const PEDIDOS_CHICO = 30;
const PEDIDOS_MEDIANO = 80;

export function ordenarPremiumPrimero(
  pedidos: Pedido[],
  deposito: Punto,
): Pedido[] {
  const premium = pedidos.filter((pedido) => pedido.premium);
  const resto = pedidos.filter((pedido) => !pedido.premium);
  const orden: Pedido[] = [];
  let actual = deposito;

  for (const grupo of [premium, resto]) {
    if (grupo.length === 0) continue;
    const tramo = ordenarPorVecinoMasCercano(grupo, actual);
    orden.push(...tramo);
    actual = tramo[tramo.length - 1];
  }

  return orden;
}

export function mejorarConPremium(
  entrada: Pedido[],
  deposito: Punto,
  mundo: Mundo,
): Pedido[] {
  if (entrada.length < 2) return [...entrada];

  let ruta = [...entrada];
  let mejorCosto = costoRuta(ruta, deposito, mundo);
  const maxPasadas =
    ruta.length <= PEDIDOS_CHICO
      ? PASADAS_CHICO
      : ruta.length <= PEDIDOS_MEDIANO
        ? PASADAS_MEDIANO
        : PASADAS_GRANDE;

  for (let pasada = 0; pasada < maxPasadas; pasada += 1) {
    let huboMejora = false;

    for (let origen = 0; origen < ruta.length; origen += 1) {
      for (let destino = 0; destino < ruta.length; destino += 1) {
        if (origen === destino) continue;

        const candidata = [...ruta];
        const [pedido] = candidata.splice(origen, 1);
        candidata.splice(destino, 0, pedido);
        const costo = costoRuta(candidata, deposito, mundo);

        if (costo < mejorCosto - EPSILON) {
          ruta = candidata;
          mejorCosto = costo;
          huboMejora = true;
        }
      }
    }

    if (!huboMejora) break;
  }

  return ruta;
}

export function elegirMejorRuta(
  candidata: Pedido[],
  actual: Pedido[],
  deposito: Punto,
  mundo: Mundo,
): Pedido[] {
  return costoRuta(candidata, deposito, mundo) <
    costoRuta(actual, deposito, mundo)
    ? candidata
    : actual;
}
