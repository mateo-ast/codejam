import { ErrorDataset } from "@/lib/dataset/errores";

export function esJson(contenido: string): boolean {
  return contenido.startsWith("{") || contenido.startsWith("[");
}

export function limpiarTexto(texto: string): string {
  return texto.replace(/^\uFEFF/, "").trim();
}

export function interpretarJson(texto: string, nombre: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    throw new ErrorDataset(`El archivo ${nombre} no tiene JSON válido`);
  }
}

export function parsearLineasCsv(texto: string): string[][] {
  const lineas = texto.split(/\r?\n/).filter((linea) => linea.trim() !== "");
  return lineas.map((linea) => {
    const celdas: string[] = [];
    let actual = "";
    let entreComillas = false;

    for (let i = 0; i < linea.length; i += 1) {
      const char = linea[i];
      if (char === '"') {
        if (entreComillas && linea[i + 1] === '"') {
          actual += '"';
          i += 1;
        } else {
          entreComillas = !entreComillas;
        }
      } else if (char === "," && !entreComillas) {
        celdas.push(actual);
        actual = "";
      } else {
        actual += char;
      }
    }

    celdas.push(actual);
    return celdas.map((celda) => celda.trim());
  });
}
