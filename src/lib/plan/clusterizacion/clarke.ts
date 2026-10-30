import { distanciaManhattan, type Punto } from "@/lib/geometria";
import { MAX_PEDIDOS_CLARKE } from "@/lib/plan/constantes";
import type { Pedido } from "@/types/mundo";

export function generarSnapshotsClarkeWright(
  pedidos: Pedido[],
  deposito: Punto,
  maxK: number,
): Map<number, Pedido[][]> {
  const snapshots = new Map<number, Pedido[][]>();
  const total = pedidos.length;

  if (total === 0) {
    snapshots.set(0, []);
    return snapshots;
  }

  if (total > MAX_PEDIDOS_CLARKE) return snapshots;

  let rutas: Pedido[][] = pedidos.map((pedido) => [pedido]);
  const rutaDe = new Map<number, Pedido[]>();
  for (const ruta of rutas) {
    for (const pedido of ruta) {
      rutaDe.set(pedido.id, ruta);
    }
  }

  const capturar = () => {
    if (rutas.length <= maxK && !snapshots.has(rutas.length)) {
      snapshots.set(
        rutas.length,
        rutas.map((ruta) => [...ruta]),
      );
    }
  };

  capturar();

  const ahorros: { a: Pedido; b: Pedido; ahorro: number }[] = [];
  for (let i = 0; i < total; i += 1) {
    for (let j = i + 1; j < total; j += 1) {
      const a = pedidos[i];
      const b = pedidos[j];
      const ahorro =
        distanciaManhattan(deposito, a) +
        distanciaManhattan(deposito, b) -
        distanciaManhattan(a, b);

      if (ahorro > 0) {
        ahorros.push({ a, b, ahorro });
      }
    }
  }

  ahorros.sort(
    (x, y) => y.ahorro - x.ahorro || x.a.id - y.a.id || x.b.id - y.b.id,
  );

  for (const { a, b } of ahorros) {
    const rutaA = rutaDe.get(a.id);
    const rutaB = rutaDe.get(b.id);

    if (!rutaA || !rutaB || rutaA === rutaB) continue;

    const aPrimero = rutaA[0].id === a.id;
    const aUltimo = rutaA[rutaA.length - 1].id === a.id;
    const bPrimero = rutaB[0].id === b.id;
    const bUltimo = rutaB[rutaB.length - 1].id === b.id;

    if ((!aPrimero && !aUltimo) || (!bPrimero && !bUltimo)) continue;

    let fusion: Pedido[];
    if (aUltimo && bPrimero) {
      fusion = [...rutaA, ...rutaB];
    } else if (aUltimo && bUltimo) {
      fusion = [...rutaA, ...[...rutaB].reverse()];
    } else if (aPrimero && bPrimero) {
      fusion = [...[...rutaA].reverse(), ...rutaB];
    } else {
      fusion = [...rutaB, ...rutaA];
    }

    rutas = rutas.filter((ruta) => ruta !== rutaA && ruta !== rutaB);
    rutas.push(fusion);

    for (const pedido of fusion) {
      rutaDe.set(pedido.id, fusion);
    }

    capturar();

    if (rutas.length === 1) break;
  }

  return snapshots;
}
