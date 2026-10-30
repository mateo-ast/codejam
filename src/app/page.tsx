import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10 sm:px-8">
      <header>
        <p className="text-sm font-medium text-sky-600 dark:text-sky-400">
          Code Jam · Problema 1
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          QuickDrop · el plan de reparto
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Cargá un dataset (mundo, pedidos y vehículos), mirá la grilla y generá
          el plan de entrega.
        </p>
      </header>

      <Dashboard />
    </main>
  );
}
