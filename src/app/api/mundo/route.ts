import { connection, NextResponse } from "next/server";
import { leerDataset } from "@/lib/dataset";

export async function GET() {
  await connection();

  try {
    const { mundo } = await leerDataset();
    return NextResponse.json(mundo);
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer el dataset activo" },
      { status: 500 },
    );
  }
}
