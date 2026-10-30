import { Package, Truck, Warehouse } from "lucide-react";

export const campos = [
  {
    nombre: "mundo",
    etiqueta: "Mundo",
    icono: Warehouse,
    ayuda: "mundo.json o mundo.csv",
  },
  {
    nombre: "pedidos",
    etiqueta: "Pedidos",
    icono: Package,
    ayuda: "pedidos.json o pedidos.csv",
  },
  {
    nombre: "vehiculos",
    etiqueta: "Vehículos",
    icono: Truck,
    ayuda: "vehiculos.json o vehiculos.csv",
  },
] as const;

export default function CamposArchivo() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {campos.map((campo) => (
        <label
          key={campo.nombre}
          htmlFor={`archivo-${campo.nombre}`}
          className="flex cursor-pointer flex-col gap-2 rounded-xl border border-slate-200 p-3 transition hover:border-sky-400 hover:bg-sky-50/50 dark:border-slate-800 dark:hover:border-sky-700 dark:hover:bg-sky-950/40"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <campo.icono className="size-4 text-sky-500" />
            {campo.etiqueta}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {campo.ayuda}
          </span>
          <input
            id={`archivo-${campo.nombre}`}
            name={campo.nombre}
            type="file"
            accept=".json,.csv,application/json,text/csv"
            className="block w-full text-xs text-slate-600 file:mr-2 file:cursor-pointer file:rounded-lg file:border-0 file:bg-sky-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-sky-700 dark:text-slate-400"
          />
        </label>
      ))}
    </div>
  );
}
