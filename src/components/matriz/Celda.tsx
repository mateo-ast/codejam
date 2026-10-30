import { Star, Warehouse } from "lucide-react";
import type { Pedido } from "@/types/mundo";

interface Props {
  x: number;
  y: number;
  esDeposito: boolean;
  pedidos: Pedido[];
}

export default function Celda({ x, y, esDeposito, pedidos }: Props) {
  if (esDeposito) {
    return (
      <div
        title={`Depósito (${x}, ${y})`}
        className="flex aspect-square items-center justify-center bg-amber-400 text-amber-950"
      >
        <Warehouse className="size-3 sm:size-4" />
      </div>
    );
  }

  if (pedidos.length > 0) {
    const tienePremium = pedidos.some((pedido) => pedido.premium);
    const detalle = pedidos
      .map(
        (pedido) =>
          `#${pedido.id} · ${pedido.peso} kg${pedido.premium ? " · premium" : ""}`,
      )
      .join("\n");

    return (
      <div
        title={`Pedido en (${x}, ${y})\n${detalle}`}
        className={
          tienePremium
            ? "relative flex aspect-square flex-col items-center justify-center bg-fuchsia-100 leading-none text-fuchsia-800 dark:bg-fuchsia-500/20 dark:text-fuchsia-200"
            : "relative flex aspect-square flex-col items-center justify-center bg-sky-100 leading-none text-sky-800 dark:bg-sky-500/20 dark:text-sky-200"
        }
      >
        {tienePremium && (
          <Star className="absolute left-0.5 top-0.5 size-2 fill-current sm:size-2.5" />
        )}
        <span className="text-[7px] font-bold sm:text-[9px]">
          {pedidos.map((pedido) => `#${pedido.id}`).join(" ")}
        </span>
        <span className="mt-0.5 text-[6px] font-medium opacity-80 sm:text-[8px]">
          {pedidos.reduce((total, pedido) => total + pedido.peso, 0)} kg
        </span>
        {pedidos.length > 1 && (
          <span className="absolute right-0.5 top-0.5 rounded-full bg-sky-600 px-1 text-[6px] font-bold text-white">
            {pedidos.length}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      title={`(${x}, ${y})`}
      className="aspect-square bg-white dark:bg-slate-950"
    />
  );
}
