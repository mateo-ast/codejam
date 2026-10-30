import { ErrorDataset } from "@/lib/dataset/errores";
import {
  esJson,
  interpretarJson,
  limpiarTexto,
  parsearLineasCsv,
} from "@/lib/dataset/parseo/csv";

export function parsearTextoMundo(texto: string): unknown {
  const contenido = limpiarTexto(texto);
  if (contenido === "") {
    throw new ErrorDataset("El archivo de mundo está vacío");
  }
  if (esJson(contenido)) {
    return interpretarJson(contenido, "de mundo");
  }

  const resultado: Record<string, string> = {};
  for (const fila of parsearLineasCsv(contenido)) {
    const clave = fila[0] ?? "";
    const valor = fila[1] ?? "";
    if (clave === "" || clave.toLowerCase() === "clave") continue;
    resultado[clave] = valor;
  }
  return resultado;
}
