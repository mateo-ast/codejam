"use client";

import { useCallback, useEffect, useState } from "react";
import EstadoCargando from "@/components/dashboard/EstadoCargando";
import EstadoError from "@/components/dashboard/EstadoError";
import Matriz from "@/components/Matriz";
import Plan from "@/components/Plan";
import SubirDataset from "@/components/SubirDataset";
import type { Dataset, ResultadoPlan } from "@/types/mundo";

type Estado = "cargando" | "listo" | "error";

export default function Dashboard() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [resultado, setResultado] = useState<ResultadoPlan | null>(null);
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
        ? ((await respuestaPlan.json()) as ResultadoPlan | null)
        : null;

      setDataset(datosDataset);
      setResultado(datosPlan);
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
    setResultado(null);
  };

  const alGenerarPlan = (nuevoResultado: ResultadoPlan) => {
    setResultado(nuevoResultado);
  };

  if (estado === "cargando") {
    return <EstadoCargando />;
  }

  if (estado === "error" || !dataset) {
    return (
      <EstadoError
        mensaje={error ?? "No se pudo cargar el dataset"}
        onReintentar={() => {
          cargar();
        }}
      />
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
      <Plan
        dataset={dataset}
        resultado={resultado}
        onGenerado={alGenerarPlan}
      />
    </div>
  );
}
