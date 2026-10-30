import { connection, NextResponse } from "next/server";
import { guardarPlan, leerDataset, leerPlan } from "@/lib/dataset";
import { generarPlanSimple } from "@/lib/plan";

export async function GET() {
  await connection();

  try {
    const plan = await leerPlan();
    return NextResponse.json(plan);
  } catch {
    return NextResponse.json(null);
  }
}

export async function POST() {
  await connection();

  try {
    const dataset = await leerDataset();
    const plan = generarPlanSimple(dataset);
    await guardarPlan(plan, dataset);
    return NextResponse.json(plan);
  } catch {
    return NextResponse.json(
      { error: "No se pudo generar el plan" },
      { status: 500 },
    );
  }
}
