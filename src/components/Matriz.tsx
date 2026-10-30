"use client";

import { MapPin, Package, Truck, Warehouse } from "lucide-react";
import { useMemo } from "react";
import type { Mundo, Pedido, Vehiculo } from "@/types/mundo";

const numero = new Intl.NumberFormat("es-CO");

interface Props {
  mundo: Mundo;
  pedidos: Pedido[];
  vehiculos: Vehiculo[];
}

export default function Matriz({ mundo, pedidos, vehiculos }: Props) {
  const pedidosPorCelda = useMemo(() => {
    const mapa = new Map<string, Pedido[]>();
    for (const pedido of pedidos) {
      const clave = `${pedido.x},${pedido.y}`;
      const lista = mapa.get(clave);
      if (lista) {
        lista.push(pedido);
      } else {
        mapa.set(clave, [pedido]);
      }
    }
    return mapa;
  }, [pedidos]);

  const pesoTotal = useMemo(
    () => pedidos.reduce((total, pedido) => total + pedido.peso, 0),
    [pedidos],
  );

  const columnas = `repeat(${mundo.grilla_ancho}, minmax(0, 1fr))`;
  const filas: number[] = [];
  for (let y = mundo.grilla_alto - 1; y >= 0; y -= 1) {
    filas.push(y);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <MapPin className="size-5 text-sky-500" />
            Mapa de la ciudad
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Grilla {mundo.grilla_ancho}×{mundo.grilla_alto} · depósito en (
            {mundo.deposito_x}, {mundo.deposito_y}) · salida {mundo.hora_salida}
          </p>
        </div>

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
            <Package className="size-3.5" />
            {pedidos.length} pedidos · {numero.format(pesoTotal)} kg
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Truck className="size-3.5" />
            {vehiculos.length} vehículos
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto pb-1">
        <div
          className="grid min-w-[480px] gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 p-px dark:border-slate-800 dark:bg-slate-800"
          style={{ gridTemplateColumns: columnas }}
        >
          {filas.map((y) =>
            Array.from({ length: mundo.grilla_ancho }, (_, x) => {
              const esDeposito =
                x === mundo.deposito_x && y === mundo.deposito_y;
              const pedidosCelda = pedidosPorCelda.get(`${x},${y}`) ?? [];

              if (esDeposito) {
                return (
                  <div
                    key={`${x}-${y}`}
                    title={`Depósito (${x}, ${y})`}
                    className="flex aspect-square items-center justify-center bg-amber-400 text-amber-950"
                  >
                    <Warehouse className="size-3 sm:size-4" />
                  </div>
                );
              }

              if (pedidosCelda.length > 0) {
                const detalle = pedidosCelda
                  .map((pedido) => `#${pedido.id} · ${pedido.peso} kg`)
                  .join("\n");

                return (
                  <div
                    key={`${x}-${y}`}
                    title={`Pedido en (${x}, ${y})\n${detalle}`}
                    className="relative flex aspect-square flex-col items-center justify-center bg-sky-100 leading-none text-sky-800 dark:bg-sky-500/20 dark:text-sky-200"
                  >
                    <span className="text-[7px] font-bold sm:text-[9px]">
                      {pedidosCelda.map((pedido) => `#${pedido.id}`).join(" ")}
                    </span>
                    <span className="mt-0.5 text-[6px] font-medium opacity-80 sm:text-[8px]">
                      {pedidosCelda.reduce(
                        (total, pedido) => total + pedido.peso,
                        0,
                      )}{" "}
                      kg
                    </span>
                    {pedidosCelda.length > 1 && (
                      <span className="absolute right-0.5 top-0.5 rounded-full bg-sky-600 px-1 text-[6px] font-bold text-white">
                        {pedidosCelda.length}
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={`${x}-${y}`}
                  title={`(${x}, ${y})`}
                  className="aspect-square bg-white dark:bg-slate-950"
                />
              );
            }),
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <Truck className="size-4" />
          {numero.format(mundo.costo_por_vehiculo)} por vehículo ·{" "}
          {numero.format(mundo.costo_por_cuadra)} por cuadra
        </span>
        <span>x → derecha · y ↑ arriba (y = 0 abajo)</span>
      </div>
    </section>
  );
}
