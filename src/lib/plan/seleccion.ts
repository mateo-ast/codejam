import { simularPlan } from "@/lib/simulacion";
import type { Dataset, Plan, ResultadoPlan } from "@/types/mundo";

export function esMejor(actual: ResultadoPlan, mejor: ResultadoPlan): boolean {
  if (actual.simulacion.valido !== mejor.simulacion.valido) {
    return actual.simulacion.valido;
  }
  if (actual.simulacion.costoTotal !== mejor.simulacion.costoTotal) {
    return actual.simulacion.costoTotal < mejor.simulacion.costoTotal;
  }
  if (actual.simulacion.entregados !== mejor.simulacion.entregados) {
    return actual.simulacion.entregados > mejor.simulacion.entregados;
  }
  if (actual.simulacion.vehiculosUsados !== mejor.simulacion.vehiculosUsados) {
    return actual.simulacion.vehiculosUsados < mejor.simulacion.vehiculosUsados;
  }
  return (actual.k ?? 0) < (mejor.k ?? 0);
}

export function agregarCandidato(
  candidatos: ResultadoPlan[],
  dataset: Dataset,
  plan: Plan,
): void {
  const simulacion = simularPlan(dataset, plan);

  if (!simulacion.valido) {
    return;
  }

  candidatos.push({
    plan,
    simulacion,
    estrategia: "cluster",
    k: plan.rutas.length,
  });
}

export function seleccionarMejor(
  candidatos: ResultadoPlan[],
): ResultadoPlan | null {
  let mejor: ResultadoPlan | null = null;

  for (const candidato of candidatos) {
    if (!candidato.simulacion.valido) continue;
    if (mejor === null || esMejor(candidato, mejor)) {
      mejor = candidato;
    }
  }

  return mejor;
}
