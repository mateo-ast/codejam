import { simularPlan } from "@/lib/simulacion";
import type {
  Dataset,
  Estrategia,
  Mundo,
  Pedido,
  Plan,
  ResultadoPlan,
  Ruta,
} from "@/types/mundo";

interface Punto {
  x: number;
  y: number;
}

const MAX_K = 50;
const MAX_TRIPS = 14;
const MAX_PEDIDOS_KMEDOIDES = 300;
const MAX_PEDIDOS_CLARKE = 600;

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

function iteracionesKMedoides(cantidadPedidos: number): number {
  if (cantidadPedidos <= 100) return 30;
  if (cantidadPedidos <= 300) return 15;
  return 8;
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

function clusterizarSweep(
  pedidos: Pedido[],
  k: number,
  deposito: Punto,
  offset: number,
): Pedido[][] {
  if (pedidos.length === 0 || k <= 0) return [];

  const cantidad = Math.min(k, pedidos.length);
  const ordenados = [...pedidos].sort((a, b) => {
    const anguloA = Math.atan2(a.y - deposito.y, a.x - deposito.x);
    const anguloB = Math.atan2(b.y - deposito.y, b.x - deposito.x);
    if (anguloA !== anguloB) return anguloA - anguloB;

    const distanciaA = distanciaManhattan(a, deposito);
    const distanciaB = distanciaManhattan(b, deposito);
    if (distanciaA !== distanciaB) return distanciaA - distanciaB;

    return a.id - b.id;
  });

  const total = ordenados.length;
  const inicio = ((offset % total) + total) % total;
  const rotados = [...ordenados.slice(inicio), ...ordenados.slice(0, inicio)];
  const base = Math.floor(total / cantidad);
  const sobrante = total % cantidad;
  const grupos: Pedido[][] = [];

  let cursor = 0;
  for (let grupo = 0; grupo < cantidad; grupo += 1) {
    const tamano = base + (grupo < sobrante ? 1 : 0);
    grupos.push(rotados.slice(cursor, cursor + tamano));
    cursor += tamano;
  }

  return grupos.filter((grupo) => grupo.length > 0);
}

function mejorarConDosOpt(entrada: Pedido[], deposito: Punto): Pedido[] {
  if (entrada.length < 3) return [...entrada];

  let ruta = [...entrada];
  const maxPasadas = ruta.length <= 300 ? 120 : ruta.length <= 800 ? 40 : 12;

  for (let pasada = 0; pasada < maxPasadas; pasada += 1) {
    let mejorDelta = -0.000001;
    let mejorI = -1;
    let mejorJ = -1;

    for (let i = 0; i < ruta.length - 1; i += 1) {
      const previo = i === 0 ? deposito : ruta[i - 1];
      const a = ruta[i];

      for (let j = i + 1; j < ruta.length; j += 1) {
        const b = ruta[j];
        const siguiente = j === ruta.length - 1 ? deposito : ruta[j + 1];
        const delta =
          distanciaManhattan(previo, b) +
          distanciaManhattan(a, siguiente) -
          distanciaManhattan(previo, a) -
          distanciaManhattan(b, siguiente);

        if (delta < mejorDelta) {
          mejorDelta = delta;
          mejorI = i;
          mejorJ = j;
        }
      }
    }

    if (mejorI < 0) break;

    const nueva = [...ruta];
    for (let a = mejorI, b = mejorJ; a < b; a += 1, b -= 1) {
      const temporal = nueva[a];
      nueva[a] = nueva[b];
      nueva[b] = temporal;
    }
    ruta = nueva;
  }

  return ruta;
}

function mejorarConOrOpt(entrada: Pedido[], deposito: Punto): Pedido[] {
  if (entrada.length < 3) return [...entrada];

  let ruta = [...entrada];
  const maxPasadas = 25;

  for (let pasada = 0; pasada < maxPasadas; pasada += 1) {
    let mejorDelta = -0.000001;
    let mejorInicio = -1;
    let mejorLargo = 0;
    let mejorInsercion = -1;
    let mejorInvertido = false;

    for (let largo = 1; largo <= Math.min(3, ruta.length - 1); largo += 1) {
      for (let inicio = 0; inicio + largo <= ruta.length; inicio += 1) {
        const segmento = ruta.slice(inicio, inicio + largo);
        const previo = inicio === 0 ? deposito : ruta[inicio - 1];
        const siguiente =
          inicio + largo === ruta.length ? deposito : ruta[inicio + largo];
        const ahorro =
          distanciaManhattan(previo, segmento[0]) +
          distanciaManhattan(segmento[segmento.length - 1], siguiente) -
          distanciaManhattan(previo, siguiente);

        const resto = [...ruta.slice(0, inicio), ...ruta.slice(inicio + largo)];

        for (let insercion = 0; insercion <= resto.length; insercion += 1) {
          if (insercion === inicio) continue;

          const antes = insercion === 0 ? deposito : resto[insercion - 1];
          const despues =
            insercion === resto.length ? deposito : resto[insercion];

          for (const invertido of [false, true]) {
            const primero = invertido
              ? segmento[segmento.length - 1]
              : segmento[0];
            const ultimo = invertido
              ? segmento[0]
              : segmento[segmento.length - 1];
            const delta =
              distanciaManhattan(antes, primero) +
              distanciaManhattan(ultimo, despues) -
              distanciaManhattan(antes, despues) -
              ahorro;

            if (delta < mejorDelta) {
              mejorDelta = delta;
              mejorInicio = inicio;
              mejorLargo = largo;
              mejorInsercion = insercion;
              mejorInvertido = invertido;
            }
          }
        }
      }
    }

    if (mejorInicio < 0) break;

    let segmento = ruta.slice(mejorInicio, mejorInicio + mejorLargo);
    if (mejorInvertido) segmento = segmento.reverse();

    const resto = [
      ...ruta.slice(0, mejorInicio),
      ...ruta.slice(mejorInicio + mejorLargo),
    ];
    ruta = [
      ...resto.slice(0, mejorInsercion),
      ...segmento,
      ...resto.slice(mejorInsercion),
    ];
  }

  return ruta;
}

function construirRuta(
  pedidos: Pedido[],
  deposito: Punto,
  mundo: Mundo,
): Pedido[] {
  if (pedidos.length <= 1) return [...pedidos];

  const inicial = ordenarPorVecinoMasCercano(pedidos, deposito);
  let ruta = mejorarConDosOpt(inicial, deposito);
  if (ruta.length <= 400) {
    ruta = mejorarConOrOpt(ruta, deposito);
  }

  if (!pedidos.some((pedido) => pedido.premium)) {
    return ruta;
  }

  const premiumPrimero = ordenarPremiumPrimero(pedidos, deposito);
  const rutaPremium =
    premiumPrimero.length <= 120
      ? mejorarConPremium(premiumPrimero, deposito, mundo)
      : premiumPrimero;

  return mejorCostoRuta(rutaPremium, ruta, deposito, mundo)
    ? rutaPremium
    : ruta;
}

function costoRuta(pedidos: Pedido[], deposito: Punto, mundo: Mundo): number {
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

  return (
    distancia * mundo.costo_por_cuadra +
    minutosPremium * mundo.costo_por_minuto_premium +
    minutos * mundo.costo_por_minuto_total
  );
}

function mejorCostoRuta(
  candidata: Pedido[],
  actual: Pedido[],
  deposito: Punto,
  mundo: Mundo,
): boolean {
  return (
    costoRuta(candidata, deposito, mundo) < costoRuta(actual, deposito, mundo)
  );
}

function ordenarPremiumPrimero(pedidos: Pedido[], deposito: Punto): Pedido[] {
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

function mejorarConPremium(
  entrada: Pedido[],
  deposito: Punto,
  mundo: Mundo,
): Pedido[] {
  if (entrada.length < 2) return [...entrada];

  let ruta = [...entrada];
  let mejorCosto = costoRuta(ruta, deposito, mundo);
  const maxPasadas = ruta.length <= 30 ? 10 : ruta.length <= 80 ? 5 : 2;

  for (let pasada = 0; pasada < maxPasadas; pasada += 1) {
    let huboMejora = false;

    for (let origen = 0; origen < ruta.length; origen += 1) {
      for (let destino = 0; destino < ruta.length; destino += 1) {
        if (origen === destino) continue;

        const candidata = [...ruta];
        const [pedido] = candidata.splice(origen, 1);
        candidata.splice(destino, 0, pedido);
        const costo = costoRuta(candidata, deposito, mundo);

        if (costo < mejorCosto - 0.000001) {
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

interface Viaje {
  paradas: number[];
  distancia: number;
  premium: number;
}

function distanciaDeRuta(pedidos: Pedido[], deposito: Punto): number {
  let total = 0;
  let actual = deposito;

  for (const pedido of pedidos) {
    total += distanciaManhattan(actual, pedido);
    actual = pedido;
  }

  return total + distanciaManhattan(actual, deposito);
}

function planDesdeViajes(dataset: Dataset, viajes: Viaje[]): Plan {
  const rutas: Ruta[] = [];

  for (let i = 0; i < viajes.length && i < dataset.vehiculos.length; i += 1) {
    const viaje = viajes[i];
    if (viaje.paradas.length === 0) continue;
    rutas.push({
      vehiculo: dataset.vehiculos[i].id,
      paradas: [...viaje.paradas],
    });
  }

  return { rutas };
}

function planConViajes(
  dataset: Dataset,
  viajes: Viaje[],
  cantidadVehiculos: number,
): Plan {
  const cantidad = Math.min(
    cantidadVehiculos,
    viajes.length,
    dataset.vehiculos.length,
  );

  if (cantidad <= 0 || viajes.length === 0) {
    return { rutas: [] };
  }

  const cargas = Array.from({ length: cantidad }, () => 0);
  const asignados: number[][] = Array.from({ length: cantidad }, () => []);

  const orden = viajes
    .map((_, indice) => indice)
    .sort((a, b) => {
      const premiumA = viajes[a].premium > 0 ? 0 : 1;
      const premiumB = viajes[b].premium > 0 ? 0 : 1;
      if (premiumA !== premiumB) return premiumA - premiumB;
      return viajes[b].distancia - viajes[a].distancia || a - b;
    });

  for (const indice of orden) {
    let elegido = 0;
    for (let vehiculo = 1; vehiculo < cantidad; vehiculo += 1) {
      if (cargas[vehiculo] < cargas[elegido]) {
        elegido = vehiculo;
      }
    }

    asignados[elegido].push(indice);
    cargas[elegido] += viajes[indice].distancia;
  }

  for (let vehiculo = 0; vehiculo < cantidad; vehiculo += 1) {
    asignados[vehiculo].sort((a, b) => {
      const premiumA = viajes[a].premium > 0 ? 0 : 1;
      const premiumB = viajes[b].premium > 0 ? 0 : 1;
      if (premiumA !== premiumB) return premiumA - premiumB;
      return viajes[a].distancia - viajes[b].distancia || a - b;
    });
  }

  const rutas: Ruta[] = [];

  for (let vehiculo = 0; vehiculo < cantidad; vehiculo += 1) {
    const paradas: Ruta["paradas"] = [];

    for (const indice of asignados[vehiculo]) {
      if (paradas.length > 0) {
        paradas.push("DEPOSITO");
      }
      paradas.push(...viajes[indice].paradas);
    }

    if (paradas.length > 0) {
      rutas.push({ vehiculo: dataset.vehiculos[vehiculo].id, paradas });
    }
  }

  return { rutas };
}

function generarSnapshotsClarkeWright(
  pedidos: Pedido[],
  deposito: Punto,
  maxK: number,
): Map<number, Pedido[][]> {
  const snapshots = new Map<number, Pedido[][]>();
  const total = pedidos.length;

  if (total === 0) {
    snapshots.set(0, []);
    return snapshots;
  }

  if (total > MAX_PEDIDOS_CLARKE) return snapshots;

  let rutas: Pedido[][] = pedidos.map((pedido) => [pedido]);
  const rutaDe = new Map<number, Pedido[]>();
  for (const ruta of rutas) {
    for (const pedido of ruta) {
      rutaDe.set(pedido.id, ruta);
    }
  }

  const capturar = () => {
    if (rutas.length <= maxK && !snapshots.has(rutas.length)) {
      snapshots.set(
        rutas.length,
        rutas.map((ruta) => [...ruta]),
      );
    }
  };

  capturar();

  const ahorros: { a: Pedido; b: Pedido; ahorro: number }[] = [];
  for (let i = 0; i < total; i += 1) {
    for (let j = i + 1; j < total; j += 1) {
      const a = pedidos[i];
      const b = pedidos[j];
      const ahorro =
        distanciaManhattan(deposito, a) +
        distanciaManhattan(deposito, b) -
        distanciaManhattan(a, b);

      if (ahorro > 0) {
        ahorros.push({ a, b, ahorro });
      }
    }
  }

  ahorros.sort(
    (x, y) => y.ahorro - x.ahorro || x.a.id - y.a.id || x.b.id - y.b.id,
  );

  for (const { a, b } of ahorros) {
    const rutaA = rutaDe.get(a.id);
    const rutaB = rutaDe.get(b.id);

    if (!rutaA || !rutaB || rutaA === rutaB) continue;

    const aPrimero = rutaA[0].id === a.id;
    const aUltimo = rutaA[rutaA.length - 1].id === a.id;
    const bPrimero = rutaB[0].id === b.id;
    const bUltimo = rutaB[rutaB.length - 1].id === b.id;

    if ((!aPrimero && !aUltimo) || (!bPrimero && !bUltimo)) continue;

    let fusion: Pedido[];
    if (aUltimo && bPrimero) {
      fusion = [...rutaA, ...rutaB];
    } else if (aUltimo && bUltimo) {
      fusion = [...rutaA, ...[...rutaB].reverse()];
    } else if (aPrimero && bPrimero) {
      fusion = [...[...rutaA].reverse(), ...rutaB];
    } else {
      fusion = [...rutaB, ...rutaA];
    }

    rutas = rutas.filter((ruta) => ruta !== rutaA && ruta !== rutaB);
    rutas.push(fusion);

    for (const pedido of fusion) {
      rutaDe.set(pedido.id, fusion);
    }

    capturar();

    if (rutas.length === 1) break;
  }

  return snapshots;
}

function construirPlanSimple(dataset: Dataset): Plan {
  const vehiculo = dataset.vehiculos[0];
  if (!vehiculo || dataset.pedidos.length === 0) {
    return { rutas: [] };
  }

  const paradas = [...dataset.pedidos]
    .sort((a, b) => Number(b.premium) - Number(a.premium) || a.id - b.id)
    .map((pedido) => pedido.id);

  return { rutas: [{ vehiculo: vehiculo.id, paradas }] };
}

function esMejor(actual: ResultadoPlan, mejor: ResultadoPlan): boolean {
  if (actual.simulacion.valido !== mejor.simulacion.valido) {
    return actual.simulacion.valido;
  }
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
      const simulacion = simularPlan(dataset, plan);

      if (!simulacion.valido || simulacion.entregados < pedidos.length) {
        return;
      }

      candidatos.push({
        plan,
        simulacion,
        estrategia: "cluster",
        k: plan.rutas.length,
      });
    };

    for (let k = 1; k <= maxParticiones; k += 1) {
      const particiones: Pedido[][][] = [];
      const rotaciones = new Set<number>([0]);

      if (pedidos.length >= 6) {
        rotaciones.add(Math.floor(pedidos.length / 4));
        rotaciones.add(Math.floor(pedidos.length / 2));
        rotaciones.add(Math.floor((3 * pedidos.length) / 4));
      }

      for (const offset of rotaciones) {
        particiones.push(clusterizarSweep(pedidos, k, deposito, offset));
      }

      if (usarKMedoides && k <= MAX_TRIPS) {
        particiones.push(clusterizarKMedoides(pedidos, k, deposito));
      }

      const clarke = snapshots.get(k);
      if (clarke) particiones.push(clarke);

      for (const clusters of particiones) {
        if (clusters.length === 0) continue;

        const viajes: Viaje[] = [];

        for (const cluster of clusters) {
          if (cluster.length === 0) continue;
          const orden = construirRuta(cluster, deposito, dataset.mundo);
          viajes.push({
            paradas: orden.map((pedido) => pedido.id),
            distancia: distanciaDeRuta(orden, deposito),
            premium: orden.filter((pedido) => pedido.premium).length,
          });
        }

        if (viajes.length === 0) continue;

        if (k <= maxK) {
          agregar(planDesdeViajes(dataset, viajes));
        }

        const maxVehiculos = Math.min(dataset.vehiculos.length, viajes.length);

        for (let vehiculos = 1; vehiculos <= maxVehiculos; vehiculos += 1) {
          if (vehiculos === viajes.length) continue;
          agregar(planConViajes(dataset, viajes, vehiculos));
        }
      }
    }
  }

  let mejor: ResultadoPlan | null = null;
  for (const candidato of candidatos) {
    if (candidato.simulacion.entregados < pedidos.length) continue;
    if (mejor === null || esMejor(candidato, mejor)) {
      mejor = candidato;
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
