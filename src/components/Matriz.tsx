"use client";

import { MapPin, Truck } from "lucide-react";
import { useMemo } from "react";
import Celda from "@/components/matriz/Celda";
import Leyenda from "@/components/matriz/Leyenda";
import { formatoNumero } from "@/lib/formato";
import type { Mundo, Pedido, Vehiculo } from "@/types/mundo";

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

  const premiumTotal = useMemo(
    () => pedidos.filter((pedido) => pedido.premium).length,
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

        <Leyenda
          pedidos={pedidos}
          vehiculos={vehiculos}
          pesoTotal={pesoTotal}
          premiumTotal={premiumTotal}
        />
      </div>

      <div className="mt-4 overflow-x-auto pb-1">
        <div
          className="grid min-w-[480px] gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 p-px dark:border-slate-800 dark:bg-slate-800"
          style={{ gridTemplateColumns: columnas }}
        >
          {filas.map((y) =>
            Array.from({ length: mundo.grilla_ancho }, (_, x) => (
              <Celda
                key={`${x}-${y}`}
                x={x}
                y={y}
                esDeposito={x === mundo.deposito_x && y === mundo.deposito_y}
                pedidos={pedidosPorCelda.get(`${x},${y}`) ?? []}
              />
            )),
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <Truck className="size-4" />
          {formatoNumero.format(mundo.costo_por_vehiculo)} por vehículo ·{" "}
          {formatoNumero.format(mundo.costo_por_cuadra)} por cuadra
        </span>
        <span>x → derecha · y ↑ arriba (y = 0 abajo)</span>
      </div>
    </section>
  );
}
