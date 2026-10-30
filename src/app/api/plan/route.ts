import { connection, NextResponse } from "next/server";
import { guardarResultado, leerDataset, leerResultado } from "@/lib/dataset";
import { generarPlan } from "@/lib/plan";
import type { Estrategia } from "@/types/mundo";

function esEstrategia(valor: string | null): valor is Estrategia {
  return valor === "simple" || valor === "cluster";
}

export async function GET() {
  await connection();

  try {
    const resultado = await leerResultado();
    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json(null);
  }
}

export async function POST(request: Request) {
  await connection();

  try {
    const estrategia =
      new URL(request.url).searchParams.get("estrategia") ?? "simple";

    if (!esEstrategia(estrategia)) {
      return NextResponse.json(
        { error: `Estrategia desconocida: "${estrategia}"` },
        { status: 400 },
      );
    }

    const dataset = await leerDataset();
    const resultado = generarPlan(dataset, estrategia);
    await guardarResultado(resultado, dataset);

    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json(
      { error: "No se pudo generar el plan" },
      { status: 500 },
    );
  }
}
