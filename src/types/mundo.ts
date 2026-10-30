export interface Mundo {
  grilla_ancho: number;
  grilla_alto: number;
  deposito_x: number;
  deposito_y: number;
  hora_salida: string;
  tiempo_servicio: number;
  tiempo_carga: number;
  min_por_cuadra: number;
  costo_por_cuadra: number;
  costo_por_vehiculo: number;
  costo_por_minuto_total: number;
  costo_por_falla: number;
}

export interface Pedido {
  id: number;
  x: number;
  y: number;
  peso: number;
}

export interface Vehiculo {
  id: string;
}

export type Parada = number | "DEPOSITO";

export interface Ruta {
  vehiculo: string;
  paradas: Parada[];
}

export interface Plan {
  rutas: Ruta[];
}

export interface Dataset {
  mundo: Mundo;
  vehiculos: Vehiculo[];
  pedidos: Pedido[];
}
