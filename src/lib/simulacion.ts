import type {
  Dataset,
  DetalleRuta,
  Parada,
  Plan,
  Simulacion,
} from "@/types/mundo";

interface Punto {
  x: number;
  y: number;
}

function distanciaManhattan(a: Punto, b: Punto): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function dosDigitos(valor: number): string {
  return valor.toString().padStart(2, "0");
}

export function sumarMinutos(hora: string, minutos: number): string {
  const [horas, minutosBase] = hora.split(":").map(Number);
  const total =
    (((horas * 60 + minutosBase + Math.round(minutos)) % (24 * 60)) + 24 * 60) %
    (24 * 60);

  return `${dosDigitos(Math.floor(total / 60))}:${dosDigitos(total % 60)}`;
}

export function validarPlan(dataset: Dataset, plan: Plan): string[] {
  const errores: string[] = [];

  if (!plan || !Array.isArray(plan.rutas)) {
    return ["El plan no tiene una lista de rutas"];
  }

  const vehiculosValidos = new Set(dataset.vehiculos.map(({ id }) => id));
  const pedidosValidos = new Set(dataset.pedidos.map(({ id }) => id));
  const vehiculosUsados = new Set<string>();
  const pedidosUsados = new Set<number>();

  plan.rutas.forEach((ruta, indice) => {
    const etiqueta = `Ruta ${indice + 1}`;

    if (!ruta || typeof ruta.vehiculo !== "string") {
      errores.push(`${etiqueta}: falta el vehículo`);
    } else if (!vehiculosValidos.has(ruta.vehiculo)) {
      errores.push(`${etiqueta}: el vehículo "${ruta.vehiculo}" no existe`);
    } else if (vehiculosUsados.has(ruta.vehiculo)) {
      errores.push(`El vehículo "${ruta.vehiculo}" está repetido`);
    } else {
      vehiculosUsados.add(ruta.vehiculo);
    }

    if (!Array.isArray(ruta?.paradas)) {
      errores.push(`${etiqueta}: falta la lista de paradas`);
      return;
    }

    ruta.paradas.forEach((parada: Parada, posicion: number) => {
      if (parada === "DEPOSITO") return;

      if (typeof parada !== "number" || !Number.isInteger(parada)) {
        errores.push(`${etiqueta}, parada ${posicion + 1}: parada inválida`);
        return;
      }

      if (!pedidosValidos.has(parada)) {
        errores.push(`${etiqueta}: el pedido ${parada} no existe`);
        return;
      }

      if (pedidosUsados.has(parada)) {
        errores.push(`El pedido ${parada} está repetido`);
        return;
      }

      pedidosUsados.add(parada);
    });
  });

  return errores;
}

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
