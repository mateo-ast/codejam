import { RefreshCw, TriangleAlert } from "lucide-react";

interface Props {
  mensaje: string;
  onReintentar: () => void;
}

export default function EstadoError({ mensaje, onReintentar }: Props) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 py-24 text-center dark:border-red-900 dark:bg-red-950/40"
    >
      <TriangleAlert className="size-8 text-red-500" />
      <p className="text-sm font-medium text-red-700 dark:text-red-300">
        {mensaje}
      </p>
      <button
        type="button"
        onClick={onReintentar}
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
      >
        <RefreshCw className="size-4" />
        Reintentar
      </button>
    </div>
  );
}
