---
id: mecanicas-3d
type: diseno
status: bucle-de-mision-jugable
updated: 2026-11-15
tags: [orbita, diseno, mecanicas, nasa, 3d]
---
# Mecánicas: diseño del traje y salida EVA

Es la respuesta del juego al reto [Space Mission Design Game](../04-Ciencia/REQUISITOS-NASA.md): diseñar con recursos limitados, simular, evaluar con un informe que une las decisiones con el resultado, fallar de forma recuperable y rediseñar. El terreno y los objetivos están en [niveles](NIVELES.md).

## Bucle

1. **Diseño:** en la consola eliges batería, propulsor, antena e instrumentos. La evaluación en vivo muestra masa, energía para objetivos, reserva, margen de movimiento, altura de salto, alcance de enlace y qué objetivos quedan imposibles.
2. **Salida:** exploras con ese traje; cada acción gasta batería.
3. **Fin:** transmites desde la terminal (completa) o la batería toca la reserva y LUMA te repliega (datos parciales).
4. **Informe:** objetivos logrados, causa de cada pendiente y desglose de la batería. Además ([debrief.ts](../../src/core/debrief.ts), [informe](../../src/ui/screens/sortie-report.tsx)):
   - **Gráfico de energía:** la batería a lo largo de la salida, con la reserva, los objetivos numerados, las zonas de gasto (frío ❄, polvo ≋, sol ☀), las pérdidas de enlace y el momento en que se tocó la reserva.
   - **Decisión → resultado:** cada pieza del traje con lo que produjo en esta salida (p. ej. «Batería estándar · 85 u. → llegó a la reserva en 4:10»).
   - **Frente al intento anterior:** qué piezas cambiaron y cómo cambiaron objetivos, energía, duración y resultado.
   - **Qué probar ahora:** hasta tres propuestas por reglas fijas (instrumento que faltó, más batería, kit, antena, batería menor si sobró energía, propulsor sin usar, margen escaso). Las que proponen un traje lo dan dentro del límite de masa y se cargan con un botón; el jugador sigue saliendo por la esclusa. No cambian progreso ni recompensas.
5. **Rediseño o repetición.** Los intentos se guardan en el navegador.

## Componentes (valores de juego)

Fuente: [suit.ts](../../src/core/suit.ts). Límite de masa: 28 kg.

| Pieza | Opciones |
| --- | --- |
| Batería | Ligera 50 u. / 4 kg · Estándar 85 u. / 8 kg · Extendida 120 u. / 14 kg |
| Propulsor | Ninguno (sin doble salto) · Compacto: doble salto 6 u., 5 kg · Potente: doble salto 4 u., dash 30 % más largo, 9 kg |
| Antena | Corta 70 m / 1 kg · Media 100 m / 3 kg · Larga 130 m / 6 kg |
| Instrumentos | Cámara espectral (escanear), 2 kg · Taladro (recuperar), 4 kg · Kit de reparación (reparar a mitad de coste), 3 kg |

Propuestas prearmadas, ambas viables:

- **Ligera:** batería estándar, propulsor compacto, antena media y los tres instrumentos; 25 kg.
- **Científica:** batería extendida, propulsor compacto, antena media, cámara y taladro; 28 kg.

## Consumo

| Concepto | Coste |
| --- | --- |
| Soporte vital | 0,08 u./s siempre |
| Desplazamiento | +0,08 u./s al moverse |
| Dash | 5 u. |
| Doble salto | Según propulsor |
| Objetivos | 4 u. por punto de `power` de la misión (relé 24 u., o 12 con kit) |
| Cráter en sombra | +0,6 u./s por frío |
| Reserva de retorno | 6 u.; ninguna acción puede gastarla, solo caminar de vuelta |

Masa: cada kg por encima de 14 baja un 1,5 % la velocidad de salto (mínimo 60 %).

## Reglas de diseño

- Sin el instrumento necesario el objetivo no se completa, y el informe lo atribuye a esa decisión.
- Siempre existe al menos un diseño que completa la misión. Una prueba comprueba que ambas propuestas cubren los objetivos, la reserva y tres minutos de soporte vital y desplazamiento.
- El fallo nunca bloquea: el informe ofrece rediseñar o repetir.
- Todo valor es una simplificación educativa y la interfaz lo dice.

## Pendiente

- Ajustar el equilibrio con partidas reales del propietario.
- Comprobar con jugadores que las propuestas del informe se entienden y no se perciben como la única respuesta.
