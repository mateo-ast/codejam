import { ErrorDataset } from "@/lib/dataset/errores";
import {
  esJson,
  interpretarJson,
  limpiarTexto,
  parsearLineasCsv,
} from "@/lib/dataset/parseo/csv";

export function parsearTextoPedidos(texto: string): unknown {
  const contenido = limpiarTexto(texto);
  if (contenido === "") {
    throw new ErrorDataset("El archivo de pedidos está vacío");
  }
  if (esJson(contenido)) {
    return interpretarJson(contenido, "de pedidos");
  }

  const filas = parsearLineasCsv(contenido);
  const encabezado = (filas[0] ?? []).map((celda) => celda.toLowerCase());
  const [iId, iX, iY, iPeso] = ["id", "x", "y", "peso"].map((nombre) =>
    encabezado.indexOf(nombre),
  );
  const iPremium = encabezado.indexOf("premium");
  if (iId < 0 || iX < 0 || iY < 0 || iPeso < 0) {
    throw new ErrorDataset(
      "El CSV de pedidos debe tener las columnas id,x,y,peso",
    );
  }

  return filas.slice(1).map((fila) => ({
    id: fila[iId],
    x: fila[iX],
    y: fila[iY],
    peso: fila[iPeso],
    premium: iPremium >= 0 ? fila[iPremium] : undefined,
  }));
}
