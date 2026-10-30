import { Package, Truck } from "lucide-react";
import { formatoNumero } from "@/lib/formato";
import type { Pedido, Vehiculo } from "@/types/mundo";

interface Props {
  pedidos: Pedido[];
  vehiculos: Vehiculo[];
  pesoTotal: number;
  premiumTotal: number;
}

export default function Leyenda({
  pedidos,
  vehiculos,
  pesoTotal,
  premiumTotal,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-3 rounded-sm bg-amber-400" />
        Depósito
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-3 rounded-sm bg-sky-500/60" />
        Pedido
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-3 rounded-sm bg-fuchsia-500/70" />
        Premium
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Package className="size-3.5" />
        {pedidos.length} pedidos · {premiumTotal} premium ·{" "}
        {formatoNumero.format(pesoTotal)} kg
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Truck className="size-3.5" />
        {vehiculos.length} vehículos
      </span>
    </div>
  );
}
