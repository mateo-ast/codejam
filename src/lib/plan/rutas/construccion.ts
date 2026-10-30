import type { Punto } from "@/lib/geometria";
import { MAX_PEDIDOS_OR_OPT, MAX_PEDIDOS_PREMIUM } from "@/lib/plan/constantes";
import { distanciaDeRuta } from "@/lib/plan/geometria";
import { mejorarConDosOpt } from "@/lib/plan/rutas/dosOpt";
import { mejorarConOrOpt } from "@/lib/plan/rutas/orOpt";
import {
  elegirMejorRuta,
  mejorarConPremium,
  ordenarPremiumPrimero,
} from "@/lib/plan/rutas/premium";
import { ordenarPorVecinoMasCercano } from "@/lib/plan/rutas/vecino";
import type { Viaje } from "@/lib/plan/tipos";
import type { Mundo, Pedido } from "@/types/mundo";

export function construirRuta(
  pedidos: Pedido[],
  deposito: Punto,
  mundo: Mundo,
): Pedido[] {
  if (pedidos.length <= 1) return [...pedidos];

  const inicial = ordenarPorVecinoMasCercano(pedidos, deposito);
  let ruta = mejorarConDosOpt(inicial, deposito);
  if (ruta.length <= MAX_PEDIDOS_OR_OPT) {
    ruta = mejorarConOrOpt(ruta, deposito);
  }

  if (!pedidos.some((pedido) => pedido.premium)) {
    return ruta;
  }

  const premiumPrimero = ordenarPremiumPrimero(pedidos, deposito);
  const rutaPremium =
    premiumPrimero.length <= MAX_PEDIDOS_PREMIUM
      ? mejorarConPremium(premiumPrimero, deposito, mundo)
      : premiumPrimero;

  return elegirMejorRuta(rutaPremium, ruta, deposito, mundo);
}

export function crearViaje(pedidos: Pedido[], deposito: Punto): Viaje {
  return {
    paradas: pedidos.map((pedido) => pedido.id),
    distancia: distanciaDeRuta(pedidos, deposito),
    premium: pedidos.filter((pedido) => pedido.premium).length,
  };
}
