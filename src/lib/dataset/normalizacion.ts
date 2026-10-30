import { ErrorDataset } from "@/lib/dataset/errores";
import type { Dataset, Mundo, Pedido, Vehiculo } from "@/types/mundo";

export function esObjeto(valor: unknown): valor is Record<string, unknown> {
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

export function armarDataset(
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
