"use client";

import {
  CheckCircle2,
  Loader2,
  Package,
  TriangleAlert,
  Truck,
  Upload,
  Warehouse,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import type { Dataset } from "@/types/mundo";

interface Props {
  dataset: Dataset;
  onCargado: (dataset: Dataset) => void;
}

const campos = [
  {
    nombre: "mundo",
    etiqueta: "Mundo",
    icono: Warehouse,
    ayuda: "mundo.json o mundo.csv",
  },
  {
    nombre: "pedidos",
    etiqueta: "Pedidos",
    icono: Package,
    ayuda: "pedidos.json o pedidos.csv",
  },
  {
    nombre: "vehiculos",
    etiqueta: "Vehículos",
    icono: Truck,
    ayuda: "vehiculos.json o vehiculos.csv",
  },
] as const;

export default function SubirDataset({ dataset, onCargado }: Props) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    const formData = new FormData(evento.currentTarget);
    const faltantes = campos
      .filter((campo) => {
        const archivo = formData.get(campo.nombre);
        return !(archivo instanceof File) || archivo.size === 0;
      })
      .map((campo) => campo.etiqueta);

    if (faltantes.length > 0) {
      setError(`Faltan archivos: ${faltantes.join(", ")}`);
      setMensaje(null);
      return;
    }

    setSubiendo(true);
    setError(null);
    setMensaje(null);

    try {
      const respuesta = await fetch("/api/dataset", {
        method: "POST",
        body: formData,
      });
      const datos = (await respuesta.json()) as Dataset & { error?: string };

      if (!respuesta.ok) {
        throw new Error(datos.error ?? "No se pudo cargar el dataset");
      }

      onCargado(datos);
      setMensaje(
        `Dataset cargado: ${datos.pedidos.length} pedidos · ${datos.vehiculos.length} vehículos`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubiendo(false);
    }
  };

  const { mundo } = dataset;
  const premiumTotal = dataset.pedidos.filter(
    (pedido) => pedido.premium,
  ).length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <Upload className="size-5 text-sky-500" />
            Cargar dataset
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Subí mundo, pedidos y vehículos en JSON o CSV. Reemplaza el dataset
            actual.
          </p>
        </div>

        <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          Actual: grilla {mundo.grilla_ancho}×{mundo.grilla_alto} · depósito (
          {mundo.deposito_x}, {mundo.deposito_y}) · {dataset.pedidos.length}{" "}
          pedidos · {premiumTotal} premium · {dataset.vehiculos.length}{" "}
          vehículos
        </p>
      </div>

      <form onSubmit={enviar} className="mt-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {campos.map((campo) => (
            <label
              key={campo.nombre}
              htmlFor={`archivo-${campo.nombre}`}
              className="flex cursor-pointer flex-col gap-2 rounded-xl border border-slate-200 p-3 transition hover:border-sky-400 hover:bg-sky-50/50 dark:border-slate-800 dark:hover:border-sky-700 dark:hover:bg-sky-950/40"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <campo.icono className="size-4 text-sky-500" />
                {campo.etiqueta}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {campo.ayuda}
              </span>
              <input
                id={`archivo-${campo.nombre}`}
                name={campo.nombre}
                type="file"
                accept=".json,.csv,application/json,text/csv"
                className="block w-full text-xs text-slate-600 file:mr-2 file:cursor-pointer file:rounded-lg file:border-0 file:bg-sky-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-sky-700 dark:text-slate-400"
              />
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={subiendo}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {subiendo ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {subiendo ? "Cargando…" : "Cargar dataset"}
          </button>

          {mensaje && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              {mensaje}
            </p>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300"
          >
            <TriangleAlert className="size-4 shrink-0" />
            {error}
          </div>
        )}
      </form>
    </section>
  );
}
