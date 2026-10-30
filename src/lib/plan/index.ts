import type { Punto } from "@/lib/geometria";
import {
  construirPlanSimple,
  planConViajes,
  planDesdeViajes,
} from "@/lib/plan/armado";
import {
  clusterizarKMedoides,
  clusterizarSweep,
  generarSnapshotsClarkeWright,
} from "@/lib/plan/clusterizacion";
import {
  MAX_K,
  MAX_PEDIDOS_KMEDOIDES,
  MAX_TRIPS,
  PEDIDOS_MINIMOS_ROTACIONES,
  ROTACIONES_SWEEP,
} from "@/lib/plan/constantes";
import { depositoDe } from "@/lib/plan/geometria";
import { optimizarGlobal, optimizarLocal } from "@/lib/plan/optimizacion";
import { construirRuta, crearViaje } from "@/lib/plan/rutas/construccion";
import { agregarCandidato, seleccionarMejor } from "@/lib/plan/seleccion";
import type { Viaje } from "@/lib/plan/tipos";
import { simularPlan } from "@/lib/simulacion";
import type {
  Dataset,
  Estrategia,
  Mundo,
  Pedido,
  Plan,
  ResultadoPlan,
} from "@/types/mundo";

function generarParticiones(
  pedidos: Pedido[],
  deposito: Punto,
  k: number,
  snapshots: Map<number, Pedido[][]>,
  usarKMedoides: boolean,
): Pedido[][][] {
  const particiones: Pedido[][][] = [];
  const rotaciones = new Set<number>([0]);

  if (pedidos.length >= PEDIDOS_MINIMOS_ROTACIONES) {
    for (const fraccion of ROTACIONES_SWEEP) {
      if (fraccion > 0) {
        rotaciones.add(Math.floor(pedidos.length * fraccion));
      }
    }
  }

  for (const offset of rotaciones) {
    particiones.push(clusterizarSweep(pedidos, k, deposito, offset));
  }

  if (usarKMedoides && k <= MAX_TRIPS) {
    particiones.push(clusterizarKMedoides(pedidos, k, deposito));
  }

  const clarke = snapshots.get(k);
  if (clarke) particiones.push(clarke);

  return particiones;
}

function construirViajes(
  clusters: Pedido[][],
  deposito: Punto,
  mundo: Mundo,
): Pedido[][] {
  const viajes: Pedido[][] = [];

  for (const cluster of clusters) {
    if (cluster.length === 0) continue;
    viajes.push(construirRuta(cluster, deposito, mundo));
  }

  return viajes;
}

function agregarPlanesDeViajes(
  dataset: Dataset,
  viajes: Viaje[],
  maxK: number,
  agregar: (plan: Plan) => void,
): void {
  if (viajes.length === 0) return;

  if (viajes.length <= maxK) {
    agregar(planDesdeViajes(dataset, viajes));
  }

  const maxVehiculos = Math.min(dataset.vehiculos.length, viajes.length);

  for (let vehiculos = 1; vehiculos <= maxVehiculos; vehiculos += 1) {
    if (vehiculos === viajes.length) continue;
    agregar(planConViajes(dataset, viajes, vehiculos));
  }
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

export function generarPlanClusteres(dataset: Dataset): ResultadoPlan {
  const pedidos = dataset.pedidos;
  const deposito = depositoDe(dataset);
  const maxK = Math.min(dataset.vehiculos.length, pedidos.length, MAX_K);
  const candidatos: ResultadoPlan[] = [];

  const simple = generarPlanSimple(dataset);
  candidatos.push({
    ...simple,
    estrategia: "cluster",
    k: simple.plan.rutas.length,
  });

  if (maxK > 0) {
    const maxViajes = Math.min(pedidos.length, MAX_TRIPS);
    const maxParticiones = Math.max(maxK, maxViajes);
    const snapshots = generarSnapshotsClarkeWright(
      pedidos,
      deposito,
      maxParticiones,
    );
    const usarKMedoides = pedidos.length <= MAX_PEDIDOS_KMEDOIDES;

    const agregar = (plan: Plan) => {
      agregarCandidato(candidatos, dataset, plan, pedidos);
    };

    for (let k = 1; k <= maxParticiones; k += 1) {
      const particiones = generarParticiones(
        pedidos,
        deposito,
        k,
        snapshots,
        usarKMedoides,
      );

      for (const clusters of particiones) {
        const viajesIniciales = construirViajes(
          clusters,
          deposito,
          dataset.mundo,
        );
        if (viajesIniciales.length === 0) continue;

        const viajesOptimizados = optimizarLocal(
          optimizarGlobal(viajesIniciales, deposito, dataset.mundo),
          deposito,
          dataset.mundo,
        );

        for (const pedidosViaje of [viajesIniciales, viajesOptimizados]) {
          const viajes = pedidosViaje
            .filter((pedidos) => pedidos.length > 0)
            .map((pedidos) => crearViaje(pedidos, deposito));

          agregarPlanesDeViajes(dataset, viajes, maxK, agregar);
        }
      }
    }
  }

  const mejor = seleccionarMejor(candidatos, pedidos);

  if (mejor === null) {
    const plan: Plan = { rutas: [] };
    return {
      plan,
      simulacion: simularPlan(dataset, plan),
      estrategia: "cluster",
      k: 0,
    };
  }

  return { ...mejor, estrategia: "cluster" };
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
