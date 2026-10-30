import { simularPlan } from "@/lib/simulacion";
import type {
  Dataset,
  Estrategia,
  Pedido,
  Plan,
  ResultadoPlan,
  Ruta,
} from "@/types/mundo";

interface Punto {
  x: number;
  y: number;
}

export function distanciaManhattan(a: Punto, b: Punto): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function depositoDe(dataset: Dataset): Punto {
  return { x: dataset.mundo.deposito_x, y: dataset.mundo.deposito_y };
}

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

function clusterizarKMedoides(
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

  for (let iteracion = 0; iteracion < 50; iteracion += 1) {
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

function construirPlanSimple(dataset: Dataset): Plan {
  const vehiculo = dataset.vehiculos[0];
  if (!vehiculo || dataset.pedidos.length === 0) {
    return { rutas: [] };
  }

  const paradas = [...dataset.pedidos]
    .sort((a, b) => a.id - b.id)
    .map((pedido) => pedido.id);

  return { rutas: [{ vehiculo: vehiculo.id, paradas }] };
}

function esMejor(actual: ResultadoPlan, mejor: ResultadoPlan): boolean {
  if (actual.simulacion.costoTotal !== mejor.simulacion.costoTotal) {
    return actual.simulacion.costoTotal < mejor.simulacion.costoTotal;
  }
  if (actual.simulacion.vehiculosUsados !== mejor.simulacion.vehiculosUsados) {
    return actual.simulacion.vehiculosUsados < mejor.simulacion.vehiculosUsados;
  }
  return (actual.k ?? 0) < (mejor.k ?? 0);
}

export function generarPlanSimple(dataset: Dataset): ResultadoPlan {
  const plan = construirPlanSimple(dataset);
  return {
    plan,
    simulacion: simularPlan(dataset, plan),
    estrategia: "simple",
    k: null,
  };
}

function planConClusters(dataset: Dataset, k: number): Plan {
  const deposito = depositoDe(dataset);
  const clusters = clusterizarKMedoides(dataset.pedidos, k, deposito);
  const rutas: Ruta[] = [];

  for (let i = 0; i < clusters.length && i < dataset.vehiculos.length; i += 1) {
    const cluster = clusters[i];
    const paradas = ordenarPorVecinoMasCercano(cluster, deposito).map(
      (pedido) => pedido.id,
    );
    if (paradas.length > 0) {
      rutas.push({ vehiculo: dataset.vehiculos[i].id, paradas });
    }
  }

  return { rutas };
}

export function generarPlanClusteres(dataset: Dataset): ResultadoPlan {
  const maxK = Math.min(dataset.vehiculos.length, dataset.pedidos.length);

  if (maxK <= 0) {
    const plan: Plan = { rutas: [] };
    return {
      plan,
      simulacion: simularPlan(dataset, plan),
      estrategia: "cluster",
      k: 0,
    };
  }

  let mejor: ResultadoPlan | null = null;

  for (let k = 1; k <= maxK; k += 1) {
    const plan = planConClusters(dataset, k);
    const resultado: ResultadoPlan = {
      plan,
      simulacion: simularPlan(dataset, plan),
      estrategia: "cluster",
      k,
    };

    if (mejor === null || esMejor(resultado, mejor)) {
      mejor = resultado;
    }
  }

  if (mejor === null) {
    const plan: Plan = { rutas: [] };
    return {
      plan,
      simulacion: simularPlan(dataset, plan),
      estrategia: "cluster",
      k: 0,
    };
  }

  return mejor;
}

export function generarPlan(
  dataset: Dataset,
  estrategia: Estrategia,
): ResultadoPlan {
  if (estrategia === "cluster") {
    return generarPlanClusteres(dataset);
  }
  return generarPlanSimple(dataset);
}
