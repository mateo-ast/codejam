import { distanciaManhattan, type Punto } from "@/lib/geometria";
import type { MetricasViaje } from "@/lib/plan/tipos";
import type { Mundo, Pedido } from "@/types/mundo";

export function metricasViaje(
  pedidos: Pedido[],
  deposito: Punto,
  mundo: Mundo,
): MetricasViaje {
  let minutos = 0;
  let distancia = 0;
  let minutosPremium = 0;
  let actual = deposito;

  for (const pedido of pedidos) {
    const cuadras = distanciaManhattan(actual, pedido);
    distancia += cuadras;
    minutos += cuadras * mundo.min_por_cuadra;
    if (pedido.premium) minutosPremium += minutos;
    minutos += mundo.tiempo_servicio;
    actual = pedido;
  }

  const vuelta = distanciaManhattan(actual, deposito);
  distancia += vuelta;
  minutos += vuelta * mundo.min_por_cuadra;

  return { distancia, minutosPremium, duracion: minutos };
}

export function costoRuta(
  pedidos: Pedido[],
  deposito: Punto,
  mundo: Mundo,
): number {
  const metricas = metricasViaje(pedidos, deposito, mundo);

  return (
    metricas.distancia * mundo.costo_por_cuadra +
    metricas.minutosPremium * mundo.costo_por_minuto_premium +
    metricas.duracion * mundo.costo_por_minuto_total
  );
}

export function costoMetricas(metricas: MetricasViaje[], mundo: Mundo): number {
  let distancia = 0;
  let minutosPremium = 0;
  let makespan = 0;

  for (const metrica of metricas) {
    distancia += metrica.distancia;
    minutosPremium += metrica.minutosPremium;
    if (metrica.duracion > makespan) makespan = metrica.duracion;
  }

  return (
    distancia * mundo.costo_por_cuadra +
    minutosPremium * mundo.costo_por_minuto_premium +
    makespan * mundo.costo_por_minuto_total +
    metricas.length * mundo.costo_por_vehiculo
  );
}
