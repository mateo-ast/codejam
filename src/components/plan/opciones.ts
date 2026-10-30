import type { Estrategia } from "@/types/mundo";

export const opciones: { id: Estrategia; etiqueta: string }[] = [
  { id: "simple", etiqueta: "Simple (1 vehículo)" },
  { id: "cluster", etiqueta: "Optimizado (flota + 2-opt)" },
];

export const descripciones: Record<Estrategia, string> = {
  simple:
    "Un vehículo reparte todos los pedidos priorizando los premium y luego en orden de id.",
  cluster:
    "Prueba particiones por barrido angular, k-medoides y ahorros de Clarke-Wright, reparte los viajes entre la flota (con regresos DEPOSITO cuando conviene), mejora globalmente con 2-opt* y relocate, refina cada ruta con Or-opt, adelanta los pedidos premium y elige el plan de menor costo total (incluye vehículos, makespan y minutos premium).",
};
