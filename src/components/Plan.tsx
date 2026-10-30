"use client";

import {
  Download,
  ListOrdered,
  Loader2,
  Route,
  TriangleAlert,
  Truck,
} from "lucide-react";
import { useState } from "react";
import type { Plan as TipoPlan } from "@/types/mundo";

interface Props {
  plan: TipoPlan | null;
  onGenerado: (plan: TipoPlan) => void;
}

export default function Plan({ plan, onGenerado }: Props) {
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generar = async () => {
    setGenerando(true);
    setError(null);

    try {
      const respuesta = await fetch("/api/plan", { method: "POST" });
      const datos = (await respuesta.json()) as TipoPlan & { error?: string };

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

  const paradasTotales =
    plan?.rutas.reduce((total, ruta) => total + ruta.paradas.length, 0) ?? 0;

  const descargar = () => {
    if (!plan) return;

    const contenido = `${JSON.stringify(plan, null, 2)}\n`;
    const url = URL.createObjectURL(
      new Blob([contenido], { type: "application/json" }),
    );
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "plan.json";
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <ListOrdered className="size-5 text-sky-500" />
            Plan de reparto
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Algoritmo simple: un vehículo reparte todos los pedidos en orden de
            id.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              generar();
            }}
            disabled={generando}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Route className="size-4" />
            )}
            {generando ? "Generando…" : "Generar plan"}
          </button>

          <button
            type="button"
            onClick={descargar}
            disabled={!plan}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="size-4" />
            Descargar plan.json
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          <TriangleAlert className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {!plan && !error && (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Todavía no hay un plan. Cargá el dataset y presioná “Generar plan”.
        </p>
      )}

      {plan && plan.rutas.length === 0 && (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No hay pedidos ni vehículos para armar un plan.
        </p>
      )}

      {plan && plan.rutas.length > 0 && (
        <div className="mt-4 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {plan.rutas.length} vehículo(s) · {paradasTotales} paradas
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-4 font-semibold">Vehículo</th>
                  <th className="py-2 font-semibold">Paradas en orden</th>
                </tr>
              </thead>
              <tbody>
                {plan.rutas.map((ruta) => (
                  <tr
                    key={ruta.vehiculo}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-900"
                  >
                    <td className="py-3 pr-4 align-top font-semibold text-slate-900 dark:text-slate-100">
                      <span className="inline-flex items-center gap-1.5">
                        <Truck className="size-4 text-sky-500" />
                        {ruta.vehiculo}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {ruta.paradas.map((parada, indice) => (
                          <span
                            key={`${ruta.vehiculo}-${parada}-${indice}`}
                            className={
                              parada === "DEPOSITO"
                                ? "rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                                : "rounded bg-sky-100 px-1.5 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-500/20 dark:text-sky-200"
                            }
                          >
                            {parada === "DEPOSITO" ? "DEPOSITO" : `#${parada}`}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              JSON del plan
            </p>
            <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950 p-3 text-xs leading-relaxed text-slate-100">
              {JSON.stringify(plan, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
