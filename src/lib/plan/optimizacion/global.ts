import type { Punto } from "@/lib/geometria";
import { EPSILON } from "@/lib/plan/constantes";
import { costoMetricas, metricasViaje } from "@/lib/plan/costos";
import {
  aplicarMovimiento,
  metricasConDosCambios,
} from "@/lib/plan/optimizacion/movimientos";
import type {
  MetricasViaje,
  MovimientoGlobal,
  Presupuesto,
} from "@/lib/plan/tipos";
import type { Mundo, Pedido } from "@/types/mundo";

const ITERACIONES_CHICO = 10;
const ITERACIONES_MEDIANO = 5;
const ITERACIONES_GRANDE = 2;
const PRESUPUESTO_CHICO = 25000;
const PRESUPUESTO_MEDIANO = 10000;
const PRESUPUESTO_GRANDE = 3000;
const PEDIDOS_CHICO = 80;
const PEDIDOS_MEDIANO = 200;

interface ResultadoBusqueda {
  costo: number;
  movimiento: MovimientoGlobal;
}

function crearPresupuesto(totalPedidos: number): Presupuesto {
  const restante =
    totalPedidos <= PEDIDOS_CHICO
      ? PRESUPUESTO_CHICO
      : totalPedidos <= PEDIDOS_MEDIANO
        ? PRESUPUESTO_MEDIANO
        : PRESUPUESTO_GRANDE;

  return { restante };
}

function consumir(presupuesto: Presupuesto): boolean {
  if (presupuesto.restante <= 0) return false;
  presupuesto.restante -= 1;
  return true;
}

function buscarMejorRelocate(
  actual: Pedido[][],
  metricas: MetricasViaje[],
  costoActual: number,
  deposito: Punto,
  mundo: Mundo,
  presupuesto: Presupuesto,
): ResultadoBusqueda | null {
  let mejorCosto = costoActual;
  let mejorMovimiento: MovimientoGlobal | null = null;

  for (let origen = 0; origen < actual.length; origen += 1) {
    const viajeOrigen = actual[origen];

    for (let indice = 0; indice < viajeOrigen.length; indice += 1) {
      const pedido = viajeOrigen[indice];
      const origenSinPedido = [
        ...viajeOrigen.slice(0, indice),
        ...viajeOrigen.slice(indice + 1),
      ];

      for (let destino = 0; destino < actual.length; destino += 1) {
        if (destino === origen) continue;

        const viajeDestino = actual[destino];

        for (let posicion = 0; posicion <= viajeDestino.length; posicion += 1) {
          if (!consumir(presupuesto)) {
            return mejorMovimiento
              ? { costo: mejorCosto, movimiento: mejorMovimiento }
              : null;
          }

          const destinoConPedido = [
            ...viajeDestino.slice(0, posicion),
            pedido,
            ...viajeDestino.slice(posicion),
          ];
          const nuevasMetricas = metricasConDosCambios(
            actual,
            metricas,
            origen,
            origenSinPedido,
            destino,
            destinoConPedido,
            deposito,
            mundo,
          );
          const nuevoCosto = costoMetricas(nuevasMetricas, mundo);

          if (nuevoCosto < mejorCosto - EPSILON) {
            mejorCosto = nuevoCosto;
            mejorMovimiento = {
              tipo: "relocate",
              origen,
              indice,
              destino,
              posicion,
            };
          }
        }
      }
    }
  }

  return mejorMovimiento
    ? { costo: mejorCosto, movimiento: mejorMovimiento }
    : null;
}

function buscarMejorDosOpt(
  actual: Pedido[][],
  metricas: MetricasViaje[],
  costoActual: number,
  deposito: Punto,
  mundo: Mundo,
  presupuesto: Presupuesto,
): ResultadoBusqueda | null {
  let mejorCosto = costoActual;
  let mejorMovimiento: MovimientoGlobal | null = null;

  for (let a = 0; a < actual.length; a += 1) {
    for (let b = a + 1; b < actual.length; b += 1) {
      const viajeA = actual[a];
      const viajeB = actual[b];

      for (let corteA = 0; corteA <= viajeA.length; corteA += 1) {
        for (let corteB = 0; corteB <= viajeB.length; corteB += 1) {
          if (
            (corteA === viajeA.length && corteB === viajeB.length) ||
            (corteA === 0 && corteB === 0)
          ) {
            continue;
          }

          if (!consumir(presupuesto)) {
            return mejorMovimiento
              ? { costo: mejorCosto, movimiento: mejorMovimiento }
              : null;
          }

          const nuevaA = [...viajeA.slice(0, corteA), ...viajeB.slice(corteB)];
          const nuevaB = [...viajeB.slice(0, corteB), ...viajeA.slice(corteA)];
          const nuevasMetricas = metricasConDosCambios(
            actual,
            metricas,
            a,
            nuevaA,
            b,
            nuevaB,
            deposito,
            mundo,
          );
          const nuevoCosto = costoMetricas(nuevasMetricas, mundo);

          if (nuevoCosto < mejorCosto - EPSILON) {
            mejorCosto = nuevoCosto;
            mejorMovimiento = {
              tipo: "dosOpt",
              a,
              b,
              corteA,
              corteB,
            };
          }
        }
      }
    }
  }

  return mejorMovimiento
    ? { costo: mejorCosto, movimiento: mejorMovimiento }
    : null;
}

function elegirMejor(
  a: ResultadoBusqueda | null,
  b: ResultadoBusqueda | null,
): ResultadoBusqueda | null {
  if (a === null) return b;
  if (b === null) return a;
  return a.costo <= b.costo ? a : b;
}

export function optimizarGlobal(
  entrada: Pedido[][],
  deposito: Punto,
  mundo: Mundo,
): Pedido[][] {
  let actual = entrada
    .filter((viaje) => viaje.length > 0)
    .map((viaje) => [...viaje]);

  if (actual.length <= 1) return actual;

  let metricas = actual.map((viaje) => metricasViaje(viaje, deposito, mundo));
  let costo = costoMetricas(metricas, mundo);

  const totalPedidos = actual.reduce((total, viaje) => total + viaje.length, 0);
  const maxIteraciones =
    totalPedidos <= PEDIDOS_CHICO
      ? ITERACIONES_CHICO
      : totalPedidos <= PEDIDOS_MEDIANO
        ? ITERACIONES_MEDIANO
        : ITERACIONES_GRANDE;
  const presupuesto = crearPresupuesto(totalPedidos);

  for (let iteracion = 0; iteracion < maxIteraciones; iteracion += 1) {
    const relocate = buscarMejorRelocate(
      actual,
      metricas,
      costo,
      deposito,
      mundo,
      presupuesto,
    );
    const dosOpt = buscarMejorDosOpt(
      actual,
      metricas,
      relocate?.costo ?? costo,
      deposito,
      mundo,
      presupuesto,
    );
    const mejor = elegirMejor(relocate, dosOpt);

    if (mejor === null) break;

    actual = aplicarMovimiento(actual, mejor.movimiento);
    metricas = actual.map((viaje) => metricasViaje(viaje, deposito, mundo));
    costo = mejor.costo;

    if (presupuesto.restante <= 0) break;
  }

  return actual;
}
