import { distanciaManhattan, type Punto } from "@/lib/geometria";
import type { Pedido } from "@/types/mundo";

const ITERACIONES_CHICO = 30;
const ITERACIONES_MEDIANO = 15;
const ITERACIONES_GRANDE = 8;
const PEDIDOS_CHICO = 100;
const PEDIDOS_MEDIANO = 300;

function iteracionesKMedoides(cantidadPedidos: number): number {
  if (cantidadPedidos <= PEDIDOS_CHICO) return ITERACIONES_CHICO;
  if (cantidadPedidos <= PEDIDOS_MEDIANO) return ITERACIONES_MEDIANO;
  return ITERACIONES_GRANDE;
}

function pedidoMasLejanoA(
  pedidos: Pedido[],
  puntos: Punto[],
  desde: Punto,
): Pedido {
  let mejor = pedidos[0];
  let mejorDistancia = -1;

  for (const pedido of pedidos) {
    const distancia =
      puntos.length === 0
        ? distanciaManhattan(pedido, desde)
        : Math.min(...puntos.map((punto) => distanciaManhattan(pedido, punto)));

    if (
      distancia > mejorDistancia ||
      (distancia === mejorDistancia && pedido.id < mejor.id)
    ) {
      mejor = pedido;
      mejorDistancia = distancia;
    }
  }

  return mejor;
}

function mejorMedoide(miembros: Pedido[]): Pedido {
  let mejor = miembros[0];
  let mejorPuntaje = Number.POSITIVE_INFINITY;

  for (const candidato of miembros) {
    let puntaje = 0;
    for (const otro of miembros) {
      puntaje += distanciaManhattan(candidato, otro);
    }
    if (
      puntaje < mejorPuntaje ||
      (puntaje === mejorPuntaje && candidato.id < mejor.id)
    ) {
      mejor = candidato;
      mejorPuntaje = puntaje;
    }
  }

  return mejor;
}

export function clusterizarKMedoides(
  pedidos: Pedido[],
  k: number,
  deposito: Punto,
): Pedido[][] {
  if (pedidos.length === 0 || k <= 0) return [];

  const cantidad = Math.min(k, pedidos.length);
  const medoides: Pedido[] = [pedidoMasLejanoA(pedidos, [], deposito)];
  while (medoides.length < cantidad) {
    const candidatos = pedidos.filter((pedido) => !medoides.includes(pedido));
    if (candidatos.length === 0) break;
    medoides.push(pedidoMasLejanoA(candidatos, medoides, deposito));
  }

  let asignacion: number[] = [];
  const maxIteraciones = iteracionesKMedoides(pedidos.length);

  for (let iteracion = 0; iteracion < maxIteraciones; iteracion += 1) {
    const nuevaAsignacion = pedidos.map((pedido) => {
      let indice = 0;
      let mejorDistancia = Number.POSITIVE_INFINITY;
      for (let i = 0; i < medoides.length; i += 1) {
        const distancia = distanciaManhattan(pedido, medoides[i]);
        if (distancia < mejorDistancia) {
          indice = i;
          mejorDistancia = distancia;
        }
      }
      return indice;
    });

    const sinCambios =
      asignacion.length === nuevaAsignacion.length &&
      nuevaAsignacion.every((valor, i) => valor === asignacion[i]);
    asignacion = nuevaAsignacion;

    let huboCambio = false;
    for (let i = 0; i < medoides.length; i += 1) {
      const miembros = pedidos.filter((_, indice) => asignacion[indice] === i);
      if (miembros.length === 0) continue;
      const nuevo = mejorMedoide(miembros);
      if (nuevo.id !== medoides[i].id) {
        medoides[i] = nuevo;
        huboCambio = true;
      }
    }

    if (sinCambios && !huboCambio) break;
  }

  const clusters: Pedido[][] = medoides.map(() => []);
  pedidos.forEach((pedido, i) => {
    const indice = asignacion[i];
    const cluster = clusters[indice];
    if (cluster) cluster.push(pedido);
  });

  return clusters.filter((cluster) => cluster.length > 0);
}
