"use client";

import { useState } from "react";
import Controles from "@/components/plan/Controles";
import Resumen from "@/components/plan/Resumen";
import TablaParadas from "@/components/plan/TablaParadas";
import TablaRutas from "@/components/plan/TablaRutas";
import MensajeError from "@/components/ui/MensajeError";
import { campoCsv, descargarArchivo } from "@/lib/descargas";
import type { Dataset, Estrategia, ResultadoPlan } from "@/types/mundo";

interface Props {
  dataset: Dataset;
  resultado: ResultadoPlan | null;
  onGenerado: (resultado: ResultadoPlan) => void;
}

export default function Plan({ dataset, resultado, onGenerado }: Props) {
  const [estrategia, setEstrategia] = useState<Estrategia>("cluster");
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generar = async () => {
    setGenerando(true);
    setError(null);

    try {
      const respuesta = await fetch(`/api/plan?estrategia=${estrategia}`, {
        method: "POST",
      });
      const datos = (await respuesta.json()) as ResultadoPlan & {
        error?: string;
      };

      if (!respuesta.ok) {
        throw new Error(datos.error ?? "No se pudo generar el plan");
      }

      onGenerado(datos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGenerando(false);
    }
  };

  const descargarJson = () => {
    if (!resultado) return;
    descargarArchivo(
      "plan.json",
      `${JSON.stringify(resultado.plan, null, 2)}\n`,
      "application/json",
    );
  };

  const descargarCsv = () => {
    if (!resultado) return;

    const filas = ["vehiculo,parada"];
    for (const ruta of resultado.plan.rutas) {
      for (const parada of ruta.paradas) {
        filas.push(`${campoCsv(ruta.vehiculo)},${campoCsv(parada)}`);
      }
    }

    descargarArchivo(
      "plan.csv",
      `${filas.join("\n")}\n`,
      "text/csv;charset=utf-8",
    );
  };

  const sim = resultado?.simulacion ?? null;
  const plan = resultado?.plan ?? null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950">
      <Controles
        estrategia={estrategia}
        onEstrategia={setEstrategia}
        generando={generando}
        onGenerar={generar}
        hayResultado={resultado !== null}
        onDescargarJson={descargarJson}
        onDescargarCsv={descargarCsv}
      />

      {error && <MensajeError mensaje={error} className="mt-4" />}

      {!resultado && !error && (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Todavía no hay un plan. Cargá el dataset y presioná “Generar plan”.
        </p>
      )}

      {resultado && plan && (
        <div className="mt-4 space-y-4">
          <Resumen dataset={dataset} resultado={resultado} />
          {sim && <TablaRutas simulacion={sim} />}
          {plan.rutas.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {sim && sim.sinAsignar > 0
                ? "El plan no asigna pedidos: conviene pagar las fallas."
                : "No hay pedidos ni vehículos para armar un plan."}
            </p>
          ) : (
            <TablaParadas dataset={dataset} plan={plan} />
          )}
        </div>
      )}
    </section>
  );
}
