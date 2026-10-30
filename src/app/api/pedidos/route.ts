import { connection, NextResponse } from "next/server";
import { leerDataset } from "@/lib/dataset";

export async function GET() {
  await connection();

  try {
    const { pedidos } = await leerDataset();
    return NextResponse.json(pedidos);
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer el dataset activo" },
      { status: 500 },
    );
  }
}
