import type { Punto } from "@/lib/geometria";
import { metricasViaje } from "@/lib/plan/costos";
import type { MetricasViaje, MovimientoGlobal } from "@/lib/plan/tipos";
import type { Mundo, Pedido } from "@/types/mundo";

export function metricasConDosCambios(
  actual: Pedido[][],
  metricas: MetricasViaje[],
  indiceA: number,
  viajeA: Pedido[],
  indiceB: number,
  viajeB: Pedido[],
  deposito: Punto,
  mundo: Mundo,
): MetricasViaje[] {
  const resultado: MetricasViaje[] = [];

  for (let i = 0; i < actual.length; i += 1) {
    if (i === indiceA) {
      if (viajeA.length > 0) {
        resultado.push(metricasViaje(viajeA, deposito, mundo));
      }
    } else if (i === indiceB) {
      if (viajeB.length > 0) {
        resultado.push(metricasViaje(viajeB, deposito, mundo));
      }
    } else {
      resultado.push(metricas[i]);
    }
  }

  return resultado;
}

export function aplicarMovimiento(
  actual: Pedido[][],
  movimiento: MovimientoGlobal,
): Pedido[][] {
  const siguiente = actual.map((viaje) => [...viaje]);

  if (movimiento.tipo === "relocate") {
    const [pedido] = siguiente[movimiento.origen].splice(movimiento.indice, 1);
    siguiente[movimiento.destino].splice(movimiento.posicion, 0, pedido);
  } else {
    const viajeA = siguiente[movimiento.a];
    const viajeB = siguiente[movimiento.b];

    siguiente[movimiento.a] = [
      ...viajeA.slice(0, movimiento.corteA),
      ...viajeB.slice(movimiento.corteB),
    ];
    siguiente[movimiento.b] = [
      ...viajeB.slice(0, movimiento.corteB),
      ...viajeA.slice(movimiento.corteA),
    ];
  }

  return siguiente.filter((viaje) => viaje.length > 0);
}
