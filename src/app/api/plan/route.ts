import { connection, NextResponse } from "next/server";
import {
  ErrorDataset,
  guardarResultado,
  leerDataset,
  leerResultado,
} from "@/lib/dataset";
import { generarPlan } from "@/lib/plan";
import type { Estrategia } from "@/types/mundo";

function esEstrategia(valor: string | null): valor is Estrategia {
  return valor === "simple" || valor === "cluster";
}

export async function GET() {
  await connection();

  try {
    return NextResponse.json(await leerResultado());
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo leer el plan guardado",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  await connection();

  try {
    const estrategia =
      new URL(request.url).searchParams.get("estrategia") ?? "cluster";

    if (!esEstrategia(estrategia)) {
      return NextResponse.json(
        { error: `Estrategia desconocida: "${estrategia}"` },
        { status: 400 },
      );
    }

    const dataset = await leerDataset();
    const resultado = generarPlan(dataset, estrategia);

    if (!resultado.simulacion.valido) {
      return NextResponse.json(
        {
          error: "El plan generado es inválido",
          errores: resultado.simulacion.errores,
        },
        { status: 422 },
      );
    }

    await guardarResultado(resultado, dataset);

    return NextResponse.json(resultado);
  } catch (error) {
    if (error instanceof ErrorDataset) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "No se pudo generar el plan" },
      { status: 500 },
    );
  }
}
