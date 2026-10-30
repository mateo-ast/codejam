export interface Viaje {
  paradas: number[];
  distancia: number;
  premium: number;
}

export interface MetricasViaje {
  distancia: number;
  minutosPremium: number;
  duracion: number;
}

export type MovimientoGlobal =
  | {
      tipo: "relocate";
      origen: number;
      indice: number;
      destino: number;
      posicion: number;
    }
  | {
      tipo: "dosOpt";
      a: number;
      b: number;
      corteA: number;
      corteB: number;
    };

export interface Presupuesto {
  restante: number;
}
