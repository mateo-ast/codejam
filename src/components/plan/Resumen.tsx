import { Star, TriangleAlert } from "lucide-react";
import { opciones } from "@/components/plan/opciones";
import { formatoNumero } from "@/lib/formato";
import type { Dataset, ResultadoPlan } from "@/types/mundo";

interface Props {
  dataset: Dataset;
  resultado: ResultadoPlan;
}

export default function Resumen({ dataset, resultado }: Props) {
  const sim = resultado.simulacion;

  const resumen = [
    { etiqueta: "Costo total", valor: formatoNumero.format(sim.costoTotal) },
    {
      etiqueta: "Distancia",
      valor: `${formatoNumero.format(sim.distancia)} cuadras`,
    },
    { etiqueta: "Vehículos usados", valor: `${sim.vehiculosUsados}` },
    {
      etiqueta: "Makespan",
      valor: `${formatoNumero.format(sim.makespan)} min`,
    },
    {
      etiqueta: "Premium",
      valor: `${sim.premiumEntregados} · ${formatoNumero.format(sim.minutosPremium)} min`,
    },
  ];

  return (
    <>
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
          {sim.entregados}/{dataset.pedidos.length} entregas · {sim.sinAsignar}{" "}
          fallas
        </span>
        {sim.premiumEntregados > 0 && (
          <span className="inline-flex items-center gap-1 rounded bg-fuchsia-100 px-2 py-1 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300">
            <Star className="size-3 fill-current" />
            {sim.premiumEntregados} premium ·{" "}
            {formatoNumero.format(sim.minutosPremium)} min
          </span>
        )}
      </div>

      {!sim.valido && (
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
          {formatoNumero.format(sim.detalle.costoDistancia)} · vehículos{" "}
          {sim.vehiculosUsados} × {dataset.mundo.costo_por_vehiculo} ={" "}
          {formatoNumero.format(sim.detalle.costoVehiculos)} · tiempo{" "}
          {formatoNumero.format(sim.makespan)} min ×{" "}
          {dataset.mundo.costo_por_minuto_total} ={" "}
          {formatoNumero.format(sim.detalle.costoMinutos)} · premium{" "}
          {formatoNumero.format(sim.minutosPremium)} min ×{" "}
          {dataset.mundo.costo_por_minuto_premium} ={" "}
          {formatoNumero.format(sim.detalle.costoPremium)} · fallas{" "}
          {sim.sinAsignar} × {dataset.mundo.costo_por_falla} ={" "}
          {formatoNumero.format(sim.detalle.costoFallas)}
        </p>
      </div>
    </>
  );
}
