import {
  Download,
  FileSpreadsheet,
  ListOrdered,
  Loader2,
  Route,
} from "lucide-react";
import { descripciones, opciones } from "@/components/plan/opciones";
import type { Estrategia } from "@/types/mundo";

interface Props {
  estrategia: Estrategia;
  onEstrategia: (estrategia: Estrategia) => void;
  generando: boolean;
  onGenerar: () => void;
  hayResultado: boolean;
  onDescargarJson: () => void;
  onDescargarCsv: () => void;
}

export default function Controles({
  estrategia,
  onEstrategia,
  generando,
  onGenerar,
  hayResultado,
  onDescargarJson,
  onDescargarCsv,
}: Props) {
  return (
    <>
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
            onClick={onGenerar}
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
            onClick={onDescargarJson}
            disabled={!hayResultado}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="size-4" />
            plan.json
          </button>

          <button
            type="button"
            onClick={onDescargarCsv}
            disabled={!hayResultado}
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
                onEstrategia(opcion.id);
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
    </>
  );
}
