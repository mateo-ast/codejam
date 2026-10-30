"use client";

import {
  Download,
  FileSpreadsheet,
  ListOrdered,
  Loader2,
  Route,
  Star,
  TriangleAlert,
  Truck,
} from "lucide-react";
import { useState } from "react";
import type { Dataset, Estrategia, ResultadoPlan } from "@/types/mundo";

interface Props {
  dataset: Dataset;
  resultado: ResultadoPlan | null;
  onGenerado: (resultado: ResultadoPlan) => void;
}

const numero = new Intl.NumberFormat("es-CO");

const opciones: { id: Estrategia; etiqueta: string }[] = [
  { id: "simple", etiqueta: "Simple (1 vehículo)" },
  { id: "cluster", etiqueta: "Optimizado (flota + 2-opt)" },
];

const descripciones: Record<Estrategia, string> = {
  simple:
    "Un vehículo reparte todos los pedidos priorizando los premium y luego en orden de id.",
  cluster:
    "Prueba particiones por barrido angular, k-medoides y ahorros de Clarke-Wright, reparte los viajes entre la flota (con regresos DEPOSITO cuando conviene), mejora globalmente con 2-opt* y relocate, refina cada ruta con Or-opt, adelanta los pedidos premium y elige el plan de menor costo total (incluye vehículos, makespan y minutos premium).",
};

function campoCsv(valor: string | number): string {
  const texto = String(valor);
  if (/[",\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
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

  const descargarArchivo = (
    nombre: string,
    contenido: string,
    tipo: string,
  ) => {
    const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
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
  const premiumPorId = new Map(
    dataset.pedidos.map((pedido) => [pedido.id, pedido.premium]),
  );

  const resumen = sim
    ? [
        { etiqueta: "Costo total", valor: numero.format(sim.costoTotal) },
        {
          etiqueta: "Distancia",
          valor: `${numero.format(sim.distancia)} cuadras`,
        },
        { etiqueta: "Vehículos usados", valor: `${sim.vehiculosUsados}` },
        { etiqueta: "Makespan", valor: `${numero.format(sim.makespan)} min` },
        {
          etiqueta: "Premium",
          valor: `${sim.premiumEntregados} · ${numero.format(sim.minutosPremium)} min`,
        },
      ]
    : [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <ListOrdered className="size-5 text-sky-500" />
            Plan de reparto
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">
            {descripciones[estrategia]}
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
            onClick={descargarJson}
            disabled={!resultado}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="size-4" />
            plan.json
          </button>

          <button
            type="button"
            onClick={descargarCsv}
            disabled={!resultado}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <FileSpreadsheet className="size-4" />
            plan.csv
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {opciones.map((opcion) => {
          const activa = opcion.id === estrategia;
          return (
            <button
              key={opcion.id}
              type="button"
              aria-pressed={activa}
              onClick={() => {
                setEstrategia(opcion.id);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                activa
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {opcion.etiqueta}
            </button>
          );
        })}
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

      {!resultado && !error && (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Todavía no hay un plan. Cargá el dataset y presioná “Generar plan”.
        </p>
      )}

      {resultado && plan && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="rounded bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              Estrategia:{" "}
              {opciones.find((opcion) => opcion.id === resultado.estrategia)
                ?.etiqueta ?? resultado.estrategia}
            </span>
            {resultado.estrategia === "cluster" && resultado.k !== null && (
              <span className="rounded bg-sky-100 px-2 py-1 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
                Mejor k = {resultado.k} · flota {dataset.vehiculos.length}
              </span>
            )}
            <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              {sim?.entregados ?? 0}/{dataset.pedidos.length} entregas ·{" "}
              {sim?.sinAsignar ?? 0} fallas
            </span>
            {(sim?.premiumEntregados ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 rounded bg-fuchsia-100 px-2 py-1 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300">
                <Star className="size-3 fill-current" />
                {sim?.premiumEntregados} premium ·{" "}
                {numero.format(sim?.minutosPremium ?? 0)} min
              </span>
            )}
          </div>

          {sim && !sim.valido && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-semibold">
                  Plan inválido: vale 0 puntos en este dataset
                </p>
                <ul className="mt-1 list-inside list-disc text-xs">
                  {sim.errores.map((mensaje) => (
                    <li key={mensaje}>{mensaje}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {sim && (
            <div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {resumen.map((dato) => (
                  <div
                    key={dato.etiqueta}
                    className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {dato.etiqueta}
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-100">
                      {dato.valor}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                distancia {sim.distancia} × {dataset.mundo.costo_por_cuadra} ={" "}
                {numero.format(sim.detalle.costoDistancia)} · vehículos{" "}
                {sim.vehiculosUsados} × {dataset.mundo.costo_por_vehiculo} ={" "}
                {numero.format(sim.detalle.costoVehiculos)} · tiempo{" "}
                {numero.format(sim.makespan)} min ×{" "}
                {dataset.mundo.costo_por_minuto_total} ={" "}
                {numero.format(sim.detalle.costoMinutos)} · premium{" "}
                {numero.format(sim.minutosPremium)} min ×{" "}
                {dataset.mundo.costo_por_minuto_premium} ={" "}
                {numero.format(sim.detalle.costoPremium)} · fallas{" "}
                {sim.sinAsignar} × {dataset.mundo.costo_por_falla} ={" "}
                {numero.format(sim.detalle.costoFallas)}
              </p>
            </div>
          )}

          {sim && sim.detalleRutas?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="py-2 pr-4 font-semibold">Vehículo</th>
                    <th className="py-2 pr-4 font-semibold">Entregas</th>
                    <th className="py-2 pr-4 font-semibold">Premium</th>
                    <th className="py-2 pr-4 font-semibold">Distancia</th>
                    <th className="py-2 pr-4 font-semibold">Minutos</th>
                    <th className="py-2 font-semibold">Regreso</th>
                  </tr>
                </thead>
                <tbody>
                  {sim.detalleRutas.map((detalle) => (
                    <tr
                      key={detalle.vehiculo}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-900"
                    >
                      <td className="py-2 pr-4 font-semibold text-slate-900 dark:text-slate-100">
                        {detalle.vehiculo}
                      </td>
                      <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">
                        {detalle.entregas}
                      </td>
                      <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">
                        {detalle.premiumEntregados > 0
                          ? `${detalle.premiumEntregados} · ${numero.format(detalle.minutosPremium)} min`
                          : "—"}
                      </td>
                      <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">
                        {numero.format(detalle.distancia)} cuadras
                      </td>
                      <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">
                        {numero.format(detalle.minutos)} min
                      </td>
                      <td className="py-2 text-slate-600 dark:text-slate-300">
                        {detalle.horaRegreso}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {plan.rutas.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No hay pedidos ni vehículos para armar un plan.
            </p>
          ) : (
            <div className="space-y-4">
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
                            {ruta.paradas.map((parada, indice) => {
                              const esPremium =
                                typeof parada === "number" &&
                                premiumPorId.get(parada) === true;

                              return (
                                <span
                                  key={`${ruta.vehiculo}-${parada}-${indice}`}
                                  className={
                                    parada === "DEPOSITO"
                                      ? "rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                                      : esPremium
                                        ? "inline-flex items-center gap-0.5 rounded bg-fuchsia-100 px-1.5 py-0.5 text-xs font-semibold text-fuchsia-800 dark:bg-fuchsia-500/20 dark:text-fuchsia-200"
                                        : "rounded bg-sky-100 px-1.5 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-500/20 dark:text-sky-200"
                                  }
                                >
                                  {parada === "DEPOSITO" ? (
                                    "DEPOSITO"
                                  ) : (
                                    <>
                                      {esPremium && (
                                        <Star className="size-3 fill-current" />
                                      )}
                                      #{parada}
                                    </>
                                  )}
                                </span>
                              );
                            })}
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
        </div>
      )}
    </section>
  );
}
