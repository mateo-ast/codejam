import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { ErrorDataset } from "@/lib/dataset/errores";
import { armarDataset, esObjeto } from "@/lib/dataset/normalizacion";
import { simularPlan } from "@/lib/simulacion";
import type { Dataset, Estrategia, Plan, ResultadoPlan } from "@/types/mundo";

const RUTA_DB = path.join(process.cwd(), "data", "db.json");
const RUTA_P1 = path.join(process.cwd(), "data", "p1");

interface ArchivoDb {
  dataset?: unknown;
  plan?: unknown;
  simulacion?: unknown;
  estrategia?: unknown;
  k?: unknown;
}

async function leerJson(ruta: string): Promise<unknown> {
  const contenido = await readFile(ruta, "utf8");
  return JSON.parse(contenido);
}

async function leerDatasetP1(): Promise<Dataset> {
  const [mundo, pedidos, vehiculos] = await Promise.all([
    leerJson(path.join(RUTA_P1, "mundo.json")),
    leerJson(path.join(RUTA_P1, "pedidos.json")),
    leerJson(path.join(RUTA_P1, "vehiculos.json")),
  ]);
  return armarDataset(mundo, pedidos, vehiculos);
}

let colaEscritura: Promise<void> = Promise.resolve();

async function escribirDb(archivo: ArchivoDb): Promise<void> {
  const tarea = colaEscritura.then(async () => {
    await mkdir(path.dirname(RUTA_DB), { recursive: true });
    const temporal = `${RUTA_DB}.${process.pid}.tmp`;
    await writeFile(temporal, `${JSON.stringify(archivo, null, 2)}\n`, "utf8");
    await rename(temporal, RUTA_DB);
  });

  colaEscritura = tarea.catch(() => {});
  return tarea;
}

function esErrorNoEncontrado(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

async function leerArchivoDb(): Promise<unknown> {
  try {
    return await leerJson(RUTA_DB);
  } catch (error) {
    if (esErrorNoEncontrado(error)) return null;
    if (error instanceof SyntaxError) {
      throw new ErrorDataset("El archivo data/db.json no tiene JSON válido");
    }
    throw new ErrorDataset("No se pudo leer el archivo data/db.json");
  }
}

export async function leerDataset(): Promise<Dataset> {
  const archivo = await leerArchivoDb();

  if (archivo === null) {
    const dataset = await leerDatasetP1();
    await guardarDataset(dataset);
    return dataset;
  }

  if (!esObjeto(archivo) || !esObjeto(archivo.dataset)) {
    throw new ErrorDataset("data/db.json no contiene un dataset válido");
  }

  try {
    const bruto = archivo.dataset;
    return armarDataset(bruto.mundo, bruto.pedidos, bruto.vehiculos);
  } catch (error) {
    if (error instanceof ErrorDataset) {
      throw new ErrorDataset(`data/db.json inválido: ${error.message}`);
    }
    throw error;
  }
}

export async function guardarDataset(dataset: Dataset): Promise<void> {
  await escribirDb({
    dataset,
    plan: null,
    simulacion: null,
    estrategia: null,
    k: null,
  });
}

export async function guardarResultado(
  resultado: ResultadoPlan,
  dataset: Dataset,
): Promise<void> {
  await escribirDb({
    dataset,
    plan: resultado.plan,
    simulacion: resultado.simulacion,
    estrategia: resultado.estrategia,
    k: resultado.k,
  });
}

export async function leerResultado(): Promise<ResultadoPlan | null> {
  const archivo = await leerArchivoDb();

  if (archivo === null) return null;

  if (!esObjeto(archivo)) {
    throw new ErrorDataset("data/db.json no tiene una estructura válida");
  }

  if (archivo.plan === null || archivo.plan === undefined) {
    return null;
  }

  if (!esObjeto(archivo.plan) || !Array.isArray(archivo.plan.rutas)) {
    throw new ErrorDataset("El plan guardado no tiene un formato válido");
  }

  const plan = archivo.plan as unknown as Plan;
  const dataset = await leerDataset();
  const simulacion = simularPlan(dataset, plan);
  const estrategia: Estrategia =
    archivo.estrategia === "cluster" ? "cluster" : "simple";
  const k =
    typeof archivo.k === "number" && Number.isInteger(archivo.k)
      ? archivo.k
      : null;

  return { plan, simulacion, estrategia, k };
}
