import { EPSILON } from "@/lib/plan/constantes";
import { simularPlan } from "@/lib/simulacion";
import type {
  Dataset,
  Parada,
  Plan,
  ResultadoPlan,
  Ruta,
  Simulacion,
} from "@/types/mundo";

const MAX_PASADAS_PODA = 50;

function normalizarParadas(paradas: Parada[]): Parada[] {
  const normalizadas: Parada[] = [];

  for (const parada of paradas) {
    if (parada === "DEPOSITO") {
      if (
        normalizadas.length === 0 ||
        normalizadas[normalizadas.length - 1] === "DEPOSITO"
      ) {
        continue;
      }
    }
    normalizadas.push(parada);
  }

  while (
    normalizadas.length > 0 &&
    normalizadas[normalizadas.length - 1] === "DEPOSITO"
  ) {
    normalizadas.pop();
  }

  return normalizadas;
}

function planSinParada(
  plan: Plan,
  indiceRuta: number,
  indiceParada: number,
): Plan {
  const rutas: Ruta[] = [];

  plan.rutas.forEach((ruta, indice) => {
    if (indice !== indiceRuta) {
      rutas.push({ vehiculo: ruta.vehiculo, paradas: [...ruta.paradas] });
      return;
    }

    const paradas = normalizarParadas(
      ruta.paradas.filter((_, posicion) => posicion !== indiceParada),
    );

    if (paradas.length > 0) {
      rutas.push({ vehiculo: ruta.vehiculo, paradas });
    }
  });

  return { rutas };
}

export function podarResultado(
  dataset: Dataset,
  resultado: ResultadoPlan,
): ResultadoPlan {
  let mejorPlan = resultado.plan;
  let mejorSimulacion = resultado.simulacion;

  for (let pasada = 0; pasada < MAX_PASADAS_PODA; pasada += 1) {
    let mejorCandidato: { plan: Plan; simulacion: Simulacion } | null = null;

    for (
      let indiceRuta = 0;
      indiceRuta < mejorPlan.rutas.length;
      indiceRuta += 1
    ) {
      const ruta = mejorPlan.rutas[indiceRuta];

      for (
        let indiceParada = 0;
        indiceParada < ruta.paradas.length;
        indiceParada += 1
      ) {
        if (ruta.paradas[indiceParada] === "DEPOSITO") continue;

        const candidato = planSinParada(mejorPlan, indiceRuta, indiceParada);
        const simulacion = simularPlan(dataset, candidato);

        if (!simulacion.valido) continue;
        if (simulacion.costoTotal >= mejorSimulacion.costoTotal - EPSILON) {
          continue;
        }
        if (
          mejorCandidato === null ||
          simulacion.costoTotal < mejorCandidato.simulacion.costoTotal
        ) {
          mejorCandidato = { plan: candidato, simulacion };
        }
      }
    }

    if (mejorCandidato === null) break;

    mejorPlan = mejorCandidato.plan;
    mejorSimulacion = mejorCandidato.simulacion;
  }

  return {
    plan: mejorPlan,
    simulacion: mejorSimulacion,
    estrategia: resultado.estrategia,
    k:
      resultado.estrategia === "cluster" ? mejorPlan.rutas.length : resultado.k,
  };
}
