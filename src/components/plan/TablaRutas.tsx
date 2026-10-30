import { formatoNumero } from "@/lib/formato";
import type { Simulacion } from "@/types/mundo";

interface Props {
  simulacion: Simulacion;
}

export default function TablaRutas({ simulacion }: Props) {
  if (!simulacion.detalleRutas?.length) return null;

  return (
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
          {simulacion.detalleRutas.map((detalle) => (
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
                  ? `${detalle.premiumEntregados} · ${formatoNumero.format(detalle.minutosPremium)} min`
                  : "—"}
              </td>
              <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">
                {formatoNumero.format(detalle.distancia)} cuadras
              </td>
              <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">
                {formatoNumero.format(detalle.minutos)} min
              </td>
              <td className="py-2 text-slate-600 dark:text-slate-300">
                {detalle.horaRegreso}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
