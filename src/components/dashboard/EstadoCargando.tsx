import { Loader2 } from "lucide-react";

export default function EstadoCargando() {
  return (
    <output className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-24 dark:border-slate-800 dark:bg-slate-950">
      <Loader2 className="size-8 animate-spin text-sky-500" />
      <span className="text-sm text-slate-500 dark:text-slate-400">
        Cargando dataset…
      </span>
    </output>
  );
}
