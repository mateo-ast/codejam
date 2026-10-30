Guía del problema base
QuickDrop: el plan de reparto
Tu equipo es una consultora que desarrolla software para
QuickDrop, una empresa de logística de última milla. Cada
mañana reciben pedidos, una flota y la ubicación del depósito,
y necesitan un plan de reparto. No se busca la solución
óptima: se busca una estrategia razonable, justificada y bien

# El mundo

Una grilla de 20 × 20 cuadras; coordenadas enteras de 0 a 19.
Distancia Manhattan: |x1 - x2| + |y1 - y2| cuadras.
Todos los vehículos salen del depósito a la hora_salida y terminan en el depósito (la vuelta final no se escribe en el plan).
Tiempos en minutos enteros; horas como "HH:MM" .
Leé todo del archivo mundo . El depósito, los costos, la velocidad y los tiempos pueden cambiar de un dataset a otro, incluida la ubicación del depósito. Un programa que suponga el depósito en (0,0) va a perder puntos.

# Los datos de entrada

Cada dataset trae tres archivos, en JSON y en CSV (los mismos campos): mundo , pedidos y vehiculos . La especificación completa está en el repo, en ESPECIFICACION.md .

mundo
{ "grilla_ancho": 20, "grilla_alto": 20,
"deposito_x": 0, "deposito_y": 0,
"hora_salida": "08:00",
"tiempo_servicio": 5, "tiempo_carga": 10,
"min_por_cuadra": 3,
"costo_por_cuadra": 3,
"costo_por_vehiculo": 60,
"costo_por_minuto_total": 1,
"costo_por_falla": 200 }
En CSV: clave,valor , una fila por campo.
pedidos
id,x,y,peso
1,15,8,12
2,6,14,4
vehiculos
id
V1
V2
Un campo opcional puede faltar, valer null o estar vacío. Si un archivo trae campos que tu programa no conoce, ignoralos.

# Lo que entregás: el plan

Tu programa lee el dataset y escribe el plan: para cada vehículo, la lista ordenada de
paradas, con un id de pedido o la palabra DEPOSITO (volver al depósito e iniciar un
nuevo viaje).
{ "rutas": [
{ "vehiculo": "V1",
"paradas": [2, 1, 10, "DEPOSITO", 8, 3] },
{ "vehiculo": "V2", "paradas": [4, 9, 7] }
] }
vehiculo,parada
V1,2
V1,1
V1,10
V1,DEPOSITO
...

Un plan es inválido (vale 0 en ese dataset) si usa un vehículo que no existe, repite un
vehículo, incluye un pedido que no existe o repite un pedido. Un pedido que no aparece
en el plan no lo invalida: falla.
5 Ejemplo de salida: una ruta ineficiente
Para que veas exactamente el formato que esperamos, este plan reparte un dataset de 25
pedidos con 2 vehículos: V1 lleva 23 pedidos, en orden de número, y V2 lleva los 2
restantes. Es válido, pero cruza la ciudad una y otra vez: no lo copies, usalo solo para
ver la forma.

## El plan en JSON

{ "rutas": [
{"vehiculo": "V1", "paradas": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
19, 20, 21, 22, 23] },
{ "vehiculo": "V2", "paradas": [24, 25] }
] }

# Lo que responde el simulador

Plan válido
COSTO TOTAL: 2641
distancia 430 cuadras × 3 = 1290
vehículos 2 usados (costo fijo) = 120
tiempo 1231 min × 1 = 1231
fallas 0 × 200 = 0
Entregas: 25/25 entregados · 0 sin asignar
El plan entrega todo, pero cuesta caro: tu programa tiene que encontrar uno mejor.

# Cómo se simula y cuánto cuesta

Para cada vehículo, desde el depósito a la hora_salida : viajar a una parada tarda cuadras × min_por_cuadra ; entregar ocupa tiempo_servicio minutos; una parada DEPOSITO tarda tiempo_carga minutos; al final vuelve al depósito.
costo = costo_por_cuadra × distancia total (cuadras, todos los vehículos)

- costo fijo de cada vehículo usado
- costo_por_minuto_total × makespan (minutos hasta que vuelve el último vehículo)
- costo_por_falla × pedidos que fallan

Menor es mejor. Hay más vehículos de los estrictamente necesarios: decidir cuántos usar es parte del problema.

# clientes premium

Algunos clientes pagan por recibir antes. Ahora importa no solo entregar, sino cuándo.

## Qué cambia

Los pedidos pueden traer el campo premium (booleano; si falta, es falso).
El mundo trae costo_por_minuto_premium (por defecto 1).
El costo suma un término nuevo: por cada pedido premium entregado, los minutos desde
la hora_salida hasta que empieza su entrega.

- costo_por_minuto_premium × Σ minutos desde la salida hasta la entrega de cada premium entregado

Formato
{ "id": 2, "x": 6, "y": 14, "peso": 4, "premium": true }
id,x,y,peso,premium
1,15,8,12,0
2,6,14,4,1
En CSV, los booleanos van como 1 / 0 (también se aceptan true / false y si / no ).
