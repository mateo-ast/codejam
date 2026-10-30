import { ErrorDataset } from "@/lib/dataset/errores";
import {
  esJson,
  interpretarJson,
  limpiarTexto,
  parsearLineasCsv,
} from "@/lib/dataset/parseo/csv";

export function parsearTextoVehiculos(texto: string): unknown {
  const contenido = limpiarTexto(texto);
  if (contenido === "") {
    throw new ErrorDataset("El archivo de vehículos está vacío");
  }
  if (esJson(contenido)) {
    return interpretarJson(contenido, "de vehículos");
  }

  const filas = parsearLineasCsv(contenido);
  const encabezado = (filas[0] ?? []).map((celda) => celda.toLowerCase());
  const iId = encabezado.indexOf("id");
  if (iId < 0) {
    throw new ErrorDataset("El CSV de vehículos debe tener la columna id");
  }

  return filas.slice(1).map((fila) => ({ id: fila[iId] }));
}
