import { CheckCircle2 } from "lucide-react";

interface Props {
  mensaje: string;
}

export default function MensajeExito({ mensaje }: Props) {
  return (
    <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="size-4" />
      {mensaje}
    </p>
  );
}
