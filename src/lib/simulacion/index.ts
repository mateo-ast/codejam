import { distanciaManhattan, type Punto } from "@/lib/geometria";
import { sumarMinutos } from "@/lib/simulacion/tiempo";
import { validarPlan } from "@/lib/simulacion/validacion";
import type { Dataset, DetalleRuta, Plan, Simulacion } from "@/types/mundo";

export { sumarMinutos } from "@/lib/simulacion/tiempo";
export { validarPlan } from "@/lib/simulacion/validacion";

export function simularPlan(dataset: Dataset, plan: Plan): Simulacion {
  const { mundo } = dataset;
  const deposito: Punto = { x: mundo.deposito_x, y: mundo.deposito_y };
  const pedidosPorId = new Map(
    dataset.pedidos.map((pedido) => [pedido.id, pedido]),
  );
  const errores = validarPlan(dataset, plan);

  let distancia = 0;
  let makespan = 0;
  let vehiculosUsados = 0;
  let premiumEntregados = 0;
  let minutosPremium = 0;
  const entregados = new Set<number>();
  const detalleRutas: DetalleRuta[] = [];

  const rutas = Array.isArray(plan?.rutas) ? plan.rutas : [];

  for (const ruta of rutas) {
    if (!ruta || !Array.isArray(ruta.paradas) || ruta.paradas.length === 0) {
      continue;
    }

    const vehiculo =
      typeof ruta.vehiculo === "string"
        ? ruta.vehiculo
        : String(ruta.vehiculo ?? "");

    vehiculosUsados += 1;
    let posicion: Punto = deposito;
    let minutos = 0;
    let distanciaRuta = 0;
    let entregasRuta = 0;
    let premiumRuta = 0;
    let minutosPremiumRuta = 0;

    for (const parada of ruta.paradas) {
      if (parada === "DEPOSITO") {
        const cuadras = distanciaManhattan(posicion, deposito);
        distanciaRuta += cuadras;
        minutos += cuadras * mundo.min_por_cuadra + mundo.tiempo_carga;
        posicion = deposito;
        continue;
      }

      const pedido = pedidosPorId.get(parada);
      if (!pedido) continue;

      const cuadras = distanciaManhattan(posicion, pedido);
      distanciaRuta += cuadras;
      minutos += cuadras * mundo.min_por_cuadra;

      const yaEntregado = entregados.has(pedido.id);
      if (pedido.premium && !yaEntregado) {
        premiumEntregados += 1;
        minutosPremium += minutos;
        premiumRuta += 1;
        minutosPremiumRuta += minutos;
      }

      minutos += mundo.tiempo_servicio;
      posicion = { x: pedido.x, y: pedido.y };
      entregados.add(pedido.id);
      entregasRuta += 1;
    }

    const vueltas = distanciaManhattan(posicion, deposito);
    distanciaRuta += vueltas;
    minutos += vueltas * mundo.min_por_cuadra;

    distancia += distanciaRuta;
    makespan = Math.max(makespan, minutos);

    detalleRutas.push({
      vehiculo,
      paradas: [...ruta.paradas],
      distancia: distanciaRuta,
      minutos,
      horaRegreso: sumarMinutos(mundo.hora_salida, minutos),
      entregas: entregasRuta,
      premiumEntregados: premiumRuta,
      minutosPremium: minutosPremiumRuta,
    });
  }

  const sinAsignar = Math.max(0, dataset.pedidos.length - entregados.size);

  const costoDistancia = distancia * mundo.costo_por_cuadra;
  const costoVehiculos = vehiculosUsados * mundo.costo_por_vehiculo;
  const costoMinutos = makespan * mundo.costo_por_minuto_total;
  const costoPremium = minutosPremium * mundo.costo_por_minuto_premium;
  const costoFallas = sinAsignar * mundo.costo_por_falla;

  return {
    costoTotal:
      costoDistancia +
      costoVehiculos +
      costoMinutos +
      costoPremium +
      costoFallas,
    distancia,
    vehiculosUsados,
    makespan,
    entregados: entregados.size,
    premiumEntregados,
    minutosPremium,
    sinAsignar,
    valido: errores.length === 0,
    errores,
    detalle: {
      costoDistancia,
      costoVehiculos,
      costoMinutos,
      costoPremium,
      costoFallas,
    },
    detalleRutas,
  };
}
