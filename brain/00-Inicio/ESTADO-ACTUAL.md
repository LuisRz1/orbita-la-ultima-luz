---
id: estado-actual
type: estado
status: campana-3d-integrada-local
updated: 2026-11-14
tags: [orbita, continuidad]
---
# Estado actual

## Punto de continuación

La rama de trabajo local **codex/campana-completa** parte de **feat/3d** en **ca6687e**. Entra por **Jugar campaña de Aurora** o por `/?campana`. La ruta jugable incluye las 24 principales de los cuatro capítulos, desde el complejo terrestre hasta la recepción de Aurora y las expediciones posteriores. La referencia lunar Nácar se mantiene en la portada y la referencia Phaser en `/?legacy`.

El registro del progreso serializa las maniobras, los informes y el orden AUR-E01–AUR-E07. La evacuación registra a las tres personas del manifiesto. La despedida de LUMA ocupa su propio punto de guardado. Texto y subtítulos de campaña en español e inglés. El propietario aporta los modelos que está creando y la voz de LUMA. El reproductor lee un manifiesto local de clips.

Para revisar [Primera luz](../02-Diseno/CAPITULOS/C1-PRIMERA-LUZ.md) desde el comienzo abre `/?campana&primera-luz`. Esta partida usa una ranura independiente. La cápsula y el diario muestran dos momentos por evidencia, recuperación y validación. El astronauta articula las extremidades, compensa giros y amortigua las caídas en el controlador compartido.

## Qué jugar

| Capítulo | Apertura | Qué debes resolver | Entrega |
| --- | --- | --- | --- |
| Primera luz | Complejo terrestre, control y diseño de misión. | Ascenso y acople, revisión de cápsula, protección y traductor de LUMA, EVA con línea y registrador. | AUR-E01/E02, transferencia y acople lunar. |
| Bajo otro cielo | Elección de alunizaje y salida con traje en Nácar. | Base, tres observaciones, bitácora, caché, medición en sombra e índice del relé. | Informe orbital con AUR-E03 y rumbo a Marte. |
| El mundo rojo | Corrección de ruta, crucero, acople y descenso. | Hábitat, geología, navegación, relé y circuito de reserva. | AUR-E04/E05, reabastecimiento y carga de rescate aprobada. |
| Lo que queda de la luz | Aproximación a Bennu con plazas y reservas. | Anclajes, reencuentro, manifiesto, embarque, desconexión y despedida. | Regreso a Tierra, AUR-E06/E07, recepción y epílogo. |

Los cuatro usan el mismo controlador y cámara, HUD, pantalla completa nativa y guardado. El [estándar obligatorio para agentes](../../AGENTS.md) exige entornos amplios con rutas alternativas, límites legibles y controles comunes. Los mapas descritos y las instrucciones de integración están en [Campaña 3D](../06-Produccion/CAMPANA-3D.md).

## Verificación

- Build de producción y 37 pruebas de reglas en Windows. Se validaron rutas peatonales, líneas de vida, dos perfiles de nave y el orden de las siete pruebas.
- 14 recorridos automatizados en Chrome. Se comprobaron teclado y ratón, pantalla completa, articulaciones al correr y aterrizar, gesto en la terminal y lectura en los dos idiomas. Primera luz se cerró por ambas rutas de EVA y se verificaron los cuatro encargos, los 15 hallazgos y la ranura independiente.
- Primera luz también se completó en tiempo real con teclado y ratón, asistencia de vuelo y la línea de sombra. Se recuperó el registrador, se volvió a la esclusa con 57,7 unidades de batería y se comprobó que la entrega lunar seguía archivada al recargar.
- El recorrido de las 24 principales cubre vuelo, crucero, compuerta final, guardado tras la despedida y recepción de Aurora. Usa el modo de prueba para alcanzar puntos de interés y avanzar las maniobras.
- El [registro de apertura de Cajamarca](../08-Bitacora/2026-11-14.md#apertura-en-cajamarca) y las especificaciones de historia se mantienen como referencia. Las trayectorias y ubicaciones son de un escenario educativo. Los datos científicos citados se distinguen de la simulación y la ficción.

## Siguiente integración

1. Probar con jugadores el recorrido manual completo, balance de autonomía, duración y rendimiento sostenido en el equipo objetivo. Las metas de 12–20 horas, 32 encargos y 120 hallazgos siguen siendo de producción.
2. Integrar los modelos y los clips del propietario usando [Campaña 3D](../06-Produccion/CAMPANA-3D.md). Verificar colisiones, cámara y sonido con los assets definitivos.
3. Revisar con el equipo la integración local y el [handoff](../08-Bitacora/HANDOFF-CAMPANA-3D.md). El propietario coordina commits y despliegue. Los Issues [C1](https://github.com/LuisRz1/nasa-orbita/issues/15), [C2](https://github.com/LuisRz1/nasa-orbita/issues/16), [C3](https://github.com/LuisRz1/nasa-orbita/issues/17) y [C4](https://github.com/LuisRz1/nasa-orbita/issues/18) conservan el seguimiento.
