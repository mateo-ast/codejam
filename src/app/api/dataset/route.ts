import { connection, NextResponse } from "next/server";
import {
  ErrorDataset,
  guardarDataset,
  leerDataset,
  parsearDataset,
} from "@/lib/dataset";

async function archivoDe(
  formData: FormData,
  nombre: string,
): Promise<File | null> {
  const valor = formData.get(nombre);
  if (valor instanceof File && valor.size > 0) {
    return valor;
  }
  return null;
}

export async function GET() {
  await connection();

  try {
    const dataset = await leerDataset();
    return NextResponse.json(dataset);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo leer el dataset",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  await connection();

  try {
    const formData = await request.formData();
    const [archivoMundo, archivoPedidos, archivoVehiculos] = await Promise.all([
      archivoDe(formData, "mundo"),
      archivoDe(formData, "pedidos"),
      archivoDe(formData, "vehiculos"),
    ]);

    if (!archivoMundo || !archivoPedidos || !archivoVehiculos) {
      return NextResponse.json(
        { error: "Faltan archivos: subí mundo, pedidos y vehículos" },
        { status: 400 },
      );
    }

    const dataset = parsearDataset(
      await archivoMundo.text(),
      await archivoPedidos.text(),
      await archivoVehiculos.text(),
    );

    await guardarDataset(dataset);

    return NextResponse.json(dataset);
  } catch (error) {
    if (error instanceof ErrorDataset) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "No se pudo cargar el dataset" },
      { status: 500 },
    );
  }
}
