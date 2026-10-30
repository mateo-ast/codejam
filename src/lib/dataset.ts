import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { simularPlan } from "@/lib/simulacion";
import type {
  Dataset,
  Estrategia,
  Mundo,
  Pedido,
  Plan,
  ResultadoPlan,
  Vehiculo,
} from "@/types/mundo";

const RUTA_DB = path.join(process.cwd(), "data", "db.json");
const RUTA_P1 = path.join(process.cwd(), "data", "p1");

interface ArchivoDb {
  dataset?: unknown;
  plan?: unknown;
  simulacion?: unknown;
  estrategia?: unknown;
  k?: unknown;
}

export class ErrorDataset extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorDataset";
  }
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function aTexto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function aBooleano(valor: unknown): boolean {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor === 1;
  if (typeof valor === "string") {
    const texto = valor.trim().toLowerCase();
    return (
      texto === "1" ||
      texto === "true" ||
      texto === "si" ||
      texto === "sí" ||
      texto === "yes"
    );
  }
  return false;
}

function aNumero(valor: unknown): number | null {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : null;
  }
  if (typeof valor === "string" && valor.trim() !== "") {
    const numero = Number(valor.trim());
    return Number.isFinite(numero) ? numero : null;
  }
  return null;
}

function enteroO(valor: unknown, porDefecto: number): number {
  const numero = aNumero(valor);
  if (numero === null) return porDefecto;
  return Math.round(numero);
}

export function normalizarMundo(bruto: unknown): Mundo {
  const fuente = esObjeto(bruto) ? bruto : {};
  const horaSalida = aTexto(fuente.hora_salida) || "08:00";

  const mundo: Mundo = {
    grilla_ancho: enteroO(fuente.grilla_ancho, 20),
    grilla_alto: enteroO(fuente.grilla_alto, 20),
    deposito_x: enteroO(fuente.deposito_x, 0),
    deposito_y: enteroO(fuente.deposito_y, 0),
    hora_salida: horaSalida,
    tiempo_servicio: enteroO(fuente.tiempo_servicio, 0),
    tiempo_carga: enteroO(fuente.tiempo_carga, 0),
    min_por_cuadra: enteroO(fuente.min_por_cuadra, 0),
    costo_por_cuadra: enteroO(fuente.costo_por_cuadra, 0),
    costo_por_vehiculo: enteroO(fuente.costo_por_vehiculo, 0),
    costo_por_minuto_total: enteroO(fuente.costo_por_minuto_total, 0),
    costo_por_minuto_premium: enteroO(fuente.costo_por_minuto_premium, 1),
    costo_por_falla: enteroO(fuente.costo_por_falla, 0),
  };

  if (mundo.grilla_ancho <= 0 || mundo.grilla_alto <= 0) {
    throw new ErrorDataset(
      "La grilla debe tener un ancho y un alto mayores a 0",
    );
  }

  if (
    mundo.deposito_x < 0 ||
    mundo.deposito_x >= mundo.grilla_ancho ||
    mundo.deposito_y < 0 ||
    mundo.deposito_y >= mundo.grilla_alto
  ) {
    throw new ErrorDataset(
      `El depósito (${mundo.deposito_x}, ${mundo.deposito_y}) queda fuera de la grilla`,
    );
  }

  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(mundo.hora_salida)) {
    throw new ErrorDataset(
      `La hora de salida "${mundo.hora_salida}" no tiene formato HH:MM`,
    );
  }

  const camposNoNegativos: { nombre: keyof Mundo; valor: number }[] = [
    { nombre: "tiempo_servicio", valor: mundo.tiempo_servicio },
    { nombre: "tiempo_carga", valor: mundo.tiempo_carga },
    { nombre: "min_por_cuadra", valor: mundo.min_por_cuadra },
    { nombre: "costo_por_cuadra", valor: mundo.costo_por_cuadra },
    { nombre: "costo_por_vehiculo", valor: mundo.costo_por_vehiculo },
    { nombre: "costo_por_minuto_total", valor: mundo.costo_por_minuto_total },
    {
      nombre: "costo_por_minuto_premium",
      valor: mundo.costo_por_minuto_premium,
    },
    { nombre: "costo_por_falla", valor: mundo.costo_por_falla },
  ];

  for (const campo of camposNoNegativos) {
    if (!Number.isFinite(campo.valor) || campo.valor < 0) {
      throw new ErrorDataset(`El campo ${campo.nombre} no puede ser negativo`);
    }
  }

  return mundo;
}

export function normalizarPedidos(bruto: unknown): Pedido[] {
  if (!Array.isArray(bruto)) {
    throw new ErrorDataset("El archivo de pedidos debe ser una lista");
  }

  const ids = new Set<number>();
  const pedidos: Pedido[] = [];

  bruto.forEach((item, indice) => {
    if (!esObjeto(item)) {
      throw new ErrorDataset(`El pedido #${indice + 1} no es un objeto válido`);
    }

    const id = aNumero(item.id);
    const x = aNumero(item.x);
    const y = aNumero(item.y);
    const peso = aNumero(item.peso);

    if (id === null || x === null || y === null || peso === null) {
      throw new ErrorDataset(`El pedido #${indice + 1} tiene campos inválidos`);
    }
    if (!Number.isInteger(id)) {
      throw new ErrorDataset(
        `El id "${id}" del pedido #${indice + 1} no es un entero`,
      );
    }
    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      throw new ErrorDataset(
        `El pedido ${id} tiene coordenadas no enteras (${x}, ${y})`,
      );
    }
    if (peso < 0) {
      throw new ErrorDataset(`El pedido ${id} tiene un peso negativo`);
    }
    if (ids.has(id)) {
      throw new ErrorDataset(`El pedido ${id} está duplicado`);
    }

    ids.add(id);
    pedidos.push({
      id,
      x,
      y,
      peso: Math.round(peso),
      premium: aBooleano(item.premium),
    });
  });

  return pedidos;
}

export function normalizarVehiculos(bruto: unknown): Vehiculo[] {
  if (!Array.isArray(bruto)) {
    throw new ErrorDataset("El archivo de vehículos debe ser una lista");
  }

  const ids = new Set<string>();
  const vehiculos: Vehiculo[] = [];

  bruto.forEach((item, indice) => {
    if (!esObjeto(item)) {
      throw new ErrorDataset(
        `El vehículo #${indice + 1} no es un objeto válido`,
      );
    }

    const id = aTexto(item.id);
    if (id === "") {
      throw new ErrorDataset(`El vehículo #${indice + 1} no tiene id`);
    }
    if (ids.has(id)) {
      throw new ErrorDataset(`El vehículo ${id} está duplicado`);
    }

    ids.add(id);
    vehiculos.push({ id });
  });

  return vehiculos;
}

function armarDataset(
  mundo: unknown,
  pedidos: unknown,
  vehiculos: unknown,
): Dataset {
  const dataset: Dataset = {
    mundo: normalizarMundo(mundo),
    pedidos: normalizarPedidos(pedidos),
    vehiculos: normalizarVehiculos(vehiculos),
  };

  for (const pedido of dataset.pedidos) {
    const fueraDeGrilla =
      pedido.x < 0 ||
      pedido.x >= dataset.mundo.grilla_ancho ||
      pedido.y < 0 ||
      pedido.y >= dataset.mundo.grilla_alto;
    if (fueraDeGrilla) {
      throw new ErrorDataset(
        `El pedido ${pedido.id} está fuera de la grilla (${pedido.x}, ${pedido.y})`,
      );
    }
  }

  return dataset;
}

function esJson(contenido: string): boolean {
  return contenido.startsWith("{") || contenido.startsWith("[");
}

function limpiarTexto(texto: string): string {
  return texto.replace(/^\uFEFF/, "").trim();
}

function interpretarJson(texto: string, nombre: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    throw new ErrorDataset(`El archivo ${nombre} no tiene JSON válido`);
  }
}

function parsearLineasCsv(texto: string): string[][] {
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

function parsearTextoMundo(texto: string): unknown {
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

function parsearTextoPedidos(texto: string): unknown {
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

function parsearTextoVehiculos(texto: string): unknown {
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
