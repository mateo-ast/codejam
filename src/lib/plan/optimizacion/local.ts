import type { Punto } from "@/lib/geometria";
import { MAX_PEDIDOS_PREMIUM } from "@/lib/plan/constantes";
import { mejorarConOrOpt, mejorarConOrOptCosto } from "@/lib/plan/rutas/orOpt";
import type { Mundo, Pedido } from "@/types/mundo";

export function optimizarLocal(
  viajes: Pedido[][],
  deposito: Punto,
  mundo: Mundo,
): Pedido[][] {
  return viajes.map((viaje) => {
    if (viaje.length < 3) return [...viaje];
    if (
      viaje.some((pedido) => pedido.premium) &&
      viaje.length <= MAX_PEDIDOS_PREMIUM
    ) {
      return mejorarConOrOptCosto(viaje, deposito, mundo);
    }
    return mejorarConOrOpt(viaje, deposito);
  });
}
