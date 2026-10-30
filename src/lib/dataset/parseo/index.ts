import { armarDataset } from "@/lib/dataset/normalizacion";
import { parsearTextoMundo } from "@/lib/dataset/parseo/mundo";
import { parsearTextoPedidos } from "@/lib/dataset/parseo/pedidos";
import { parsearTextoVehiculos } from "@/lib/dataset/parseo/vehiculos";
import type { Dataset } from "@/types/mundo";

export function parsearDataset(
  textoMundo: string,
  textoPedidos: string,
  textoVehiculos: string,
): Dataset {
  return armarDataset(
    parsearTextoMundo(textoMundo),
    parsearTextoPedidos(textoPedidos),
    parsearTextoVehiculos(textoVehiculos),
  );
}
