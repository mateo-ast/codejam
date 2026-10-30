# Algoritmo complejo del plan de reparto

Este documento explica **solo la estrategia Optimizado** (la que usa clustering y búsqueda local). La estrategia simple no se cubre acá.

---

## 1. Idea general

El algoritmo no intenta encontrar la solución perfecta. Hace esto:

1. Genera muchas formas distintas de agrupar los pedidos.
2. Ordena cada grupo con varias heurísticas.
3. Mejora el conjunto con búsquedas locales.
4. Arma planes con distintas cantidades de vehículos.
5. Simula todos los planes y se queda con el de menor costo.

Es una estrategia de **muchos candidatos + simulación exacta**: las heurísticas proponen, el simulador decide.

---

## 2. Flujo general

```text
1. Generar particiones
   ├─ Barrido angular
   ├─ K-medoides
   └─ Clarke-Wright

2. Construir cada viaje
   ├─ Vecino más cercano
   ├─ 2-opt intra-viaje
   ├─ Or-opt intra-viaje
   └─ Tratamiento premium

3. Mejora global
   ├─ 2-opt* entre viajes
   └─ Relocate entre viajes

4. Mejora local
   └─ Or-opt por viaje

5. Armar planes
   ├─ Un vehículo por viaje
   └─ Empaquetar viajes con DEPOSITO

6. Simular y elegir el mejor
```

---

## 3. Subalgoritmos, uno por uno

### 3.1 Barrido angular (sweep)

**Qué hace:**
- Ordena los pedidos por ángulo alrededor del depósito.
- Rota el orden para probar distintos puntos de corte.
- Divide la lista en `k` grupos contiguos.

**Qué resuelve:**
Agrupa pedidos que están “en la misma dirección” desde el depósito. Sirve para armar zonas compactas y radiales. Las rotaciones evitan depender de un único corte.

---

### 3.2 K-medoides

**Qué hace:**
- Elige `k` pedidos “representantes” (medoides).
- Asigna cada pedido al medoide más cercano.
- Recalcula cada medoide como el pedido que minimiza la distancia a los demás.
- Repite hasta estabilizar.

**Qué resuelve:**
Agrupa por cercanía real, sin depender del ángulo. Es útil cuando los pedidos no siguen un patrón radial.

---

### 3.3 Clarke-Wright (ahorros)

**Qué hace:**
- Empieza con un viaje por pedido.
- Calcula cuánto se ahorra al unir dos pedidos en la misma ruta.
- Fusiona primero los pares con mayor ahorro.

**Qué resuelve:**
Construye rutas compactas con buena distancia. Es una heurística clásica para reparto: une pedidos que conviene visitar juntos.

---

### 3.4 Vecino más cercano

**Qué hace:**
- Arranca en el depósito.
- En cada paso elige el pedido no visitado más cercano.
- Sigue hasta visitar todo el grupo.

**Qué resuelve:**
Da un orden inicial rápido y razonable para cada viaje. No es óptimo, pero es un buen punto de partida para las mejoras.

---

### 3.5 2-opt intra-viaje

**Qué hace:**
- Prueba invertir tramos de la ruta.
- Si el cambio reduce la distancia, lo acepta.
- Repite hasta que no mejora.

**Qué resuelve:**
Elimina cruces dentro de un mismo viaje. Es la mejora clásica para acortar rutas.

---

### 3.6 Or-opt intra-viaje

**Qué hace:**
- Toma bloques de 1 a 3 pedidos.
- Los mueve a otra posición de la misma ruta.
- También prueba el bloque invertido.

**Qué resuelve:**
Reacomoda pedidos que el 2-opt no puede mejorar. Complementa al 2-opt y deja la ruta más ordenada.

---

### 3.7 Premium-first

**Qué hace:**
- Separa los pedidos premium de los no premium.
- Arma primero el tramo premium con vecino más cercano.
- Después continúa con el resto.

**Qué resuelve:**
Adelanta los pedidos que pagan por llegar antes. Reduce los minutos premium, a cambio de posiblemente recorrer más distancia.

---

### 3.8 Relocate premium

**Qué hace:**
- Mueve pedidos de posición dentro del viaje.
- Evalúa el costo completo, incluyendo el término premium.
- Se queda con el orden más barato.

**Qué resuelve:**
Refina la ruta premium-first. Si adelantar un pedido premium no compensa, lo deja en un lugar mejor.

> La ruta premium-first y la ruta optimizada por distancia se comparan; gana la de menor costo.

---

### 3.9 2-opt* entre viajes (fase global)

**Qué hace:**
- Toma dos viajes.
- Los corta en dos posiciones.
- Intercambia las colas entre ellos.

```text
A = [a1, a2, a3, a4]
B = [b1, b2, b3]

Corte en A después de a2 y en B después de b1:

A' = [a1, a2, b2, b3]
B' = [b1, a3, a4]
```

**Qué resuelve:**
Mejora el reparto de pedidos **entre** viajes. El 2-opt normal solo reordena dentro de un viaje; este puede mover pedidos de un viaje a otro.

---

### 3.10 Relocate entre viajes (fase global)

**Qué hace:**
- Saca un pedido de un viaje.
- Lo inserta en la mejor posición de otro viaje.
- Si el viaje de origen queda vacío, lo elimina.

**Qué resuelve:**
Reequilibra los viajes y acerca cada pedido a la ruta donde conviene. También puede fusionar viajes cuando el costo fijo del vehículo no compensa mantenerlos separados.

> La fase global repite 2-opt* y relocate hasta que no encuentra mejoras o se queda sin presupuesto.

---

### 3.11 Or-opt local (fase local)

**Qué hace:**
- Después de la fase global, recorre cada viaje.
- Mueve bloques de 1 a 3 pedidos a otra posición.
- Si el viaje tiene premium, evalúa el costo premium-aware; si no, optimiza distancia.

**Qué resuelve:**
La fase global puede dejar los viajes internamente desordenados. Este Or-opt los vuelve a acomodar.

---

### 3.12 Un vehículo por viaje

**Qué hace:**
- Asigna cada viaje a un vehículo distinto.
- Todos arrancan en paralelo desde el depósito.

**Qué resuelve:**
Reduce el makespan y los minutos premium, porque los viajes no esperan a que otro vehículo termine. A cambio, paga más costo fijo de vehículos.

---

### 3.13 Empaquetar viajes en menos vehículos

**Qué hace:**
- Reparte varios viajes entre un mismo vehículo.
- Entre viaje y viaje inserta una parada `DEPOSITO`.
- Ordena los viajes con premium primero.
- Asigna cada viaje al vehículo con menor carga acumulada.

**Qué resuelve:**
Decide cuántos vehículos usar. Permite ahorrar costo fijo haciendo que un vehículo haga varias rutas, a cambio de más tiempo y de retrasar los pedidos que vienen después del `DEPOSITO`.

---

### 3.14 Simulación exacta

**Qué hace:**
- Recorre cada ruta parada por parada.
- Calcula distancia, tiempo, makespan, minutos premium y fallas.
- Devuelve el costo total real.

**Qué resuelve:**
Evita elegir un plan por una métrica aproximada. La decisión final siempre se toma con el costo real.

---

### 3.15 Selección del mejor plan

**Qué hace:**
- Descarta planes inválidos o incompletos.
- Entre los válidos, elige:
  1. menor costo total,
  2. menos vehículos usados,
  3. menor cantidad de rutas.

**Qué resuelve:**
Quedarse con el mejor candidato sin depender de una sola heurística.

---

## 4. Tabla resumen

| Subalgoritmo | Qué hace | Qué resuelve |
| --- | --- | --- |
| Barrido angular | Agrupa por ángulo y rota cortes | Clusters radiales y compactos |
| K-medoides | Agrupa por cercanía a representantes | Clusters centrados |
| Clarke-Wright | Fusiona rutas por ahorro | Rutas compactas |
| Vecino más cercano | Ordena por el pedido más cercano | Punto de partida rápido |
| 2-opt intra | Invierte tramos | Elimina cruces dentro de un viaje |
| Or-opt intra | Mueve bloques de 1 a 3 | Reacomoda pedidos |
| Premium-first | Adelanta premium | Reduce minutos premium |
| Relocate premium | Mueve pedidos dentro del viaje | Refina el costo premium |
| 2-opt* global | Intercambia colas entre viajes | Mejora el reparto entre viajes |
| Relocate global | Mueve pedidos entre viajes | Reequilibra y fusiona viajes |
| Or-opt local | Reordena cada viaje final | Limpia el desorden post-global |
| Un vehículo por viaje | Paraleliza viajes | Menos makespan y premium |
| Empaquetar con DEPOSITO | Junta viajes en menos vehículos | Ahorra costo fijo |
| Simulación exacta | Calcula el costo real | Evalúa sin aproximaciones |
| Selección | Compara y elige | Devuelve el mejor plan |

---

## 5. Qué conviene recordar

- **Las particiones** deciden *qué pedidos van juntos*.
- **La construcción** decide *en qué orden se visitan*.
- **La fase global** decide *cómo se reparten entre viajes*.
- **La fase local** decide *cómo queda el orden final de cada viaje*.
- **El armado** decide *cuántos vehículos se usan*.
- **La simulación** decide *qué plan gana*.

El algoritmo complejo no garantiza el óptimo: garantiza explorar muchas alternativas razonables y elegir la mejor según el costo real.

> Nota: el algoritmo conserva un plan base de un solo vehículo como red de seguridad, pero no forma parte de la lógica compleja explicada en este documento.
