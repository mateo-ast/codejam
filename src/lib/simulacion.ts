import type { Dataset, Plan, Simulacion } from "@/types/mundo";

interface Punto {
  x: number;
  y: number;
}

function distanciaManhattan(a: Punto, b: Punto): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function simularPlan(dataset: Dataset, plan: Plan): Simulacion {
  const { mundo } = dataset;
  const deposito: Punto = { x: mundo.deposito_x, y: mundo.deposito_y };
  const pedidosPorId = new Map(
    dataset.pedidos.map((pedido) => [pedido.id, pedido]),
  );

  let distancia = 0;
  let makespan = 0;
  let vehiculosUsados = 0;
  const entregados = new Set<number>();

  for (const ruta of plan.rutas) {
    if (ruta.paradas.length === 0) continue;

    vehiculosUsados += 1;
    let posicion: Punto = deposito;
    let minutos = 0;

    for (const parada of ruta.paradas) {
      if (parada === "DEPOSITO") {
        const cuadras = distanciaManhattan(posicion, deposito);
        distancia += cuadras;
        minutos += cuadras * mundo.min_por_cuadra + mundo.tiempo_carga;
        posicion = deposito;
        continue;
      }

      const pedido = pedidosPorId.get(parada);
      if (!pedido) continue;

      const cuadras = distanciaManhattan(posicion, pedido);
      distancia += cuadras;
      minutos += cuadras * mundo.min_por_cuadra + mundo.tiempo_servicio;
      posicion = { x: pedido.x, y: pedido.y };
      entregados.add(pedido.id);
    }

    const vueltas = distanciaManhattan(posicion, deposito);
    distancia += vueltas;
    minutos += vueltas * mundo.min_por_cuadra;
    makespan = Math.max(makespan, minutos);
  }

  const sinAsignar = dataset.pedidos.length - entregados.size;

  const costoDistancia = distancia * mundo.costo_por_cuadra;
  const costoVehiculos = vehiculosUsados * mundo.costo_por_vehiculo;
  const costoMinutos = makespan * mundo.costo_por_minuto_total;
  const costoFallas = sinAsignar * mundo.costo_por_falla;

  return {
    costoTotal: costoDistancia + costoVehiculos + costoMinutos + costoFallas,
    distancia,
    vehiculosUsados,
    makespan,
    entregados: entregados.size,
    sinAsignar,
    detalle: {
      costoDistancia,
      costoVehiculos,
      costoMinutos,
      costoFallas,
    },
  };
}
