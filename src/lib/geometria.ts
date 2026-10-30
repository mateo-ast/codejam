export interface Punto {
  x: number;
  y: number;
}

export function distanciaManhattan(a: Punto, b: Punto): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
