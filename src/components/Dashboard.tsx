"use client";

import { Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Matriz from "@/components/Matriz";
import Plan from "@/components/Plan";
import SubirDataset from "@/components/SubirDataset";
import type { Dataset, Plan as TipoPlan } from "@/types/mundo";

type Estado = "cargando" | "listo" | "error";

export default function Dashboard() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [plan, setPlan] = useState<TipoPlan | null>(null);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setEstado("cargando");
    setError(null);

    try {
      const [respuestaDataset, respuestaPlan] = await Promise.all([
        fetch("/api/dataset", { cache: "no-store" }),
        fetch("/api/plan", { cache: "no-store" }),
      ]);

      if (!respuestaDataset.ok) {
        const datos = (await respuestaDataset.json()) as { error?: string };
        throw new Error(datos.error ?? "No se pudo cargar el dataset");
      }

      const datosDataset = (await respuestaDataset.json()) as Dataset;
      const datosPlan = respuestaPlan.ok
        ? ((await respuestaPlan.json()) as TipoPlan | null)
        : null;

      setDataset(datosDataset);
      setPlan(datosPlan);
      setEstado("listo");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const alCargarDataset = (nuevoDataset: Dataset) => {
    setDataset(nuevoDataset);
    setPlan(null);
  };

  const alGenerarPlan = (nuevoPlan: TipoPlan) => {
    setPlan(nuevoPlan);
  };

  if (estado === "cargando") {
    return (
      <output className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-24 dark:border-slate-800 dark:bg-slate-950">
        <Loader2 className="size-8 animate-spin text-sky-500" />
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Cargando dataset…
        </span>
      </output>
    );
  }

  if (estado === "error" || !dataset) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 py-24 text-center dark:border-red-900 dark:bg-red-950/40"
      >
        <TriangleAlert className="size-8 text-red-500" />
        <p className="text-sm font-medium text-red-700 dark:text-red-300">
          {error ?? "No se pudo cargar el dataset"}
        </p>
        <button
          type="button"
          onClick={() => {
            cargar();
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          <RefreshCw className="size-4" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SubirDataset dataset={dataset} onCargado={alCargarDataset} />
      <Matriz
        mundo={dataset.mundo}
        pedidos={dataset.pedidos}
        vehiculos={dataset.vehiculos}
      />
      <Plan plan={plan} onGenerado={alGenerarPlan} />
    </div>
  );
}
