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
  costo_por_minuto_premium: number;
  costo_por_falla: number;
}

export interface Pedido {
  id: number;
  x: number;
  y: number;
  peso: number;
  premium: boolean;
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

export type Estrategia = "simple" | "cluster";

export interface DetalleRuta {
  vehiculo: string;
  paradas: Parada[];
  distancia: number;
  minutos: number;
  horaRegreso: string;
  entregas: number;
  premiumEntregados: number;
  minutosPremium: number;
}

export interface Simulacion {
  costoTotal: number;
  distancia: number;
  vehiculosUsados: number;
  makespan: number;
  entregados: number;
  premiumEntregados: number;
  minutosPremium: number;
  sinAsignar: number;
  valido: boolean;
  errores: string[];
  detalle: {
    costoDistancia: number;
    costoVehiculos: number;
    costoMinutos: number;
    costoPremium: number;
    costoFallas: number;
  };
  detalleRutas: DetalleRuta[];
}

export interface ResultadoPlan {
  plan: Plan;
  simulacion: Simulacion;
  estrategia: Estrategia;
  k: number | null;
}
