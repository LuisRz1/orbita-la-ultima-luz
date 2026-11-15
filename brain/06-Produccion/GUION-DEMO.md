---
id: guion-demo
type: produccion
status: borrador-para-ensayo
updated: 2026-11-15
tags: [orbita, presentacion, nasa]
---
# Guion de la demo (2 minutos)

Para el vídeo o la presentación ante el jurado de Space Apps. El objetivo es que en dos minutos se vea el bucle completo del reto: **diseñar con recursos limitados → simular → evaluar con un informe que une decisión y resultado → rediseñar**, con datos de la NASA y la ficción separada.

## Preparación (antes de grabar)

- Navegador con un perfil limpio (sin guardados) o una ventana privada.
- Abrir `/?level=moon&demo`. La Luna es el capítulo más completo; `demo` abre todos los destinos sin tocar los guardados.
- Volumen de efectos y música al 60 %; idioma según el público (Ajustes).
- Ensayar una vez: la primera salida debe terminar en repliegue y la segunda en transmisión.
- Si el equipo no da fps estables, usar `&quality=low`.

## Guion

| Tiempo | En pantalla | Voz (ES) | Voice (EN) |
| --- | --- | --- | --- |
| 0:00–0:12 | Menú: título, los cuatro pasos y la ruta. | «Órbita es un juego de diseño de misiones. Tu hermana desapareció con la expedición Aurora; cada salida para buscarla es una misión con recursos limitados.» | "Órbita is a mission design game. Your sister vanished with the Aurora expedition; every sortie to find her is a mission with limited resources." |
| 0:12–0:35 | Nueva expedición. Puestos del módulo: batería estándar, propulsor, antena; en el banco, **quitar el taladro**. La barra superior marca en rojo la caché. | «Diseño el traje con un límite de 28 kilos. Más batería es más tiempo fuera, pero pesa y salto menos. Quito el taladro para ahorrar peso: la barra ya me avisa de que un objetivo será imposible.» | "I design the suit under a 28 kg limit. More battery means more time outside, but it is heavy and I jump lower. I drop the drill to save mass: the bar already warns that one objective becomes impossible." |
| 0:35–0:55 | EVA: brújula, LUMA, un objetivo, la sombra del cráter (❄), el panel de batería bajando. | «Cada segundo y cada acción gastan batería: el frío de la sombra, el dash, los instrumentos. La reserva solo sirve para volver caminando.» | "Every second and every action costs battery: the cold in the shadow, the dash, the instruments. The reserve can only be spent walking home." |
| 0:55–1:20 | Informe de repliegue: gráfico de energía, tabla decisión → resultado, propuesta «Lleva taladro». | «Fallar no bloquea. El informe une cada decisión con su resultado: aquí se ve cuándo toqué la reserva, que faltó el taladro y qué probar ahora, siempre dentro del límite de masa.» | "Failing never blocks you. The report links each decision to its result: when I hit the reserve, that the drill was missing, and what to try next, always within the mass limit." |
| 1:20–1:40 | «Probar esta propuesta» → salida rápida → transmisión → «frente al intento anterior». | «Cargo la propuesta, salgo y completo la misión. El informe compara con el intento anterior: qué pieza cambió y cómo cambió el resultado.» | "I load the proposal, head out and complete the mission. The report compares with the previous attempt: which part changed and how the result changed." |
| 1:40–1:55 | Menú → Ciencia: modelo y realidad. | «Cada mecánica se apoya en un dato de la NASA, con su fuente y una etiqueta: observación, simplificación o ficción.» | "Every mechanic stands on a NASA figure, with its source and a label: observation, simplification or fiction." |
| 1:55–2:00 | Ruta Órbita → Luna → Marte → Bennu. | «Cinco destinos, en español e inglés, en el navegador.» | "Five destinations, in Spanish and English, in the browser." |

## Para acortar el rodaje

Con `?debug` la consola del navegador expone `window.__orbita` (por ejemplo `__orbita.setEnergy(7)` para llegar antes a la reserva). Solo para grabar; no mostrarlo en pantalla.

## Qué no prometer

- No hay vuelos 3D entre destinos: el viaje se cuenta entre capítulos.
- La batería, la antena y los costes son valores de juego.
- Los fps en Intel Iris Xe no están medidos todavía.
