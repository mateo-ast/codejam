import { Star, Truck } from "lucide-react";
import type { Dataset, Plan } from "@/types/mundo";

interface Props {
  dataset: Dataset;
  plan: Plan;
}

export default function TablaParadas({ dataset, plan }: Props) {
  const premiumPorId = new Map(
    dataset.pedidos.map((pedido) => [pedido.id, pedido.premium]),
  );

  return (
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
  );
}
