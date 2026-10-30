import { TriangleAlert } from "lucide-react";

interface Props {
  mensaje: string;
  className?: string;
}

export default function MensajeError({ mensaje, className = "" }: Props) {
  return (
    <div
      role="alert"
      className={`flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300 ${className}`}
    >
      <TriangleAlert className="size-4 shrink-0" />
      {mensaje}
    </div>
  );
}
