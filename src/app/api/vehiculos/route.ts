import { connection, NextResponse } from "next/server";
import { leerDataset } from "@/lib/dataset";

export async function GET() {
  await connection();

  try {
    const { vehiculos } = await leerDataset();
    return NextResponse.json(vehiculos);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo leer el dataset activo",
      },
      { status: 500 },
    );
  }
}
