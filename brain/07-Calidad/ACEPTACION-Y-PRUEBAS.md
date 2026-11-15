---
id: aceptacion-pruebas
type: calidad
status: c1-y-referencia-comprobados
updated: 2026-11-14
tags: [orbita, pruebas]
---
# Aceptación y pruebas

## Preparación documental

- Enlaces locales y navegación del vault resuelven.
- IDs de notas únicos y metadatos coherentes.
- Estado distingue entregado, propuesto y pendiente.
- No hay secretos, partidas ni contenido privado.
- Los Issues reflejan la fase permitida y las dependencias.

## Demo

| Área | Escenario de aceptación |
| --- | --- |
| Planificación | Cambiar instrumentos modifica restricciones y resultado esperado. |
| Ciclo | Planificar, desplegar, explorar, resolver incidencia, regresar y ver informe. |
| Movimiento | Profundidad, colisiones e interacción funcionan en bordes y obstáculos. |
| Progresión | Repetir una entrega o recargar no duplica recompensas. |
| Guardado | Restaurar un hito conserva estado; importar datos dañados no borra una partida válida. |
| Compañero | Reacciona a un hallazgo y conserva decisiones; sin IA sigue la historia. |
| Red | Se puede completar la región cargada al perder conexión. |
| Idioma y controles | Español e inglés, foco de teclado y texto legible; escribir no mueve al personaje. |
| Ciencia | Datos consultables y simplificaciones reconocibles. |
| Pilotaje | Frenar respecto al objetivo, acoplar y reintentar con asistencia visible. |
| Crucero | Acelerar, pausar y reanudar sin duplicar consumo de recursos. |
| Historia local | Recuperar un registro parcial de Aurora, reparar el enlace y entregarlo cierra la demo; no declara el rescate global ni completa el capítulo. |

El kit usa el runner de Node para las reglas y Playwright para el recorrido de usuario. Las pruebas de la demo completa siguen sujetas a su alcance.

## Rendimiento

Objetivos: 60 FPS en el equipo de referencia, opción de 30 FPS; carga inicial comprimida menor a 15 MB; memoria de pestaña menor a 500 MB.

Registrar navegador, resolución, GPU utilizada, escena, duración y resultado. Medir recorrido normal y escena exigente; no presentar una captura de un contador como prueba sostenida.

## Campaña

Jugadores nuevos deben probar orientación, legibilidad, progresión, repetición, dificultad y duración. Ajustar cuotas de contenido con evidencia.

Comprobar las 24 principales y sus dependencias, las cuatro condiciones de cierre y la libertad de orden en Luna/Marte. No exigir opcionales para pasar.

Verificar cuatro paletas de LUMA con señales accesibles, traducción escrita sin red, ausencia de spoilers en respuestas y persistencia de sus acontecimientos. La exploración posterior no depende de su presencia o chat.

### Narrativa y rescate — spoilers

- Las 24 principales tienen acción, condición de cierre y aporte a una pista, ruta o capacidad de rescate.
- La cadena AUR-E01–AUR-E07 coincide con la [historia principal](../02-Diseno/HISTORIA-PRINCIPAL.md). Una pieza recogida sin autenticar no abre la revelación siguiente.
- Probar las seis permutaciones de C2-M03/M04/M05 y ambos órdenes de C3-M04/M05. El informe final revela los mismos hechos; antes no aparecen conclusiones futuras en diario, diálogos o IA.
- La cápsula prueba un envío de supervivientes en el pasado; el mensaje marciano conserva fecha; la presencia viva se confirma al llegar. El juego distingue esos niveles de certeza.
- C3-M06 y C4-M01 rechazan una carga sin plazas, soporte de vida o reservas suficientes para los supervivientes y quienes ya viajan. La logística sale de Marte y regresa a Tierra después de la extracción.
- C4-M03 verifica a la hermana y al manifiesto completo; M04 no cierra con alguien fuera de la nave. Una lista vacía no acredita éxito.
- C4-M05 salva al protagonista por el sacrificio de LUMA, con los rescatados ya seguros. La despedida escrita usa recuerdos existentes y ocurre una vez.
- C4-M06 exige recibir a todas las personas del manifiesto en destino terrestre. Entregar muestras por sí solo no completa la campaña.
- Esperar en menús o explorar secundarias no mata a LUMA o a Aurora. Los riesgos ordinarios permiten recuperación y no sustituyen el desenlace.
- Recargar en los límites de evacuación, despedida y recepción conserva el estado. El epílogo reconoce rescate y pérdida, y mantiene los pendientes mediante nuevas expediciones.

### Integración actual de los cuatro capítulos

- `tests/core/campaign.test.ts` analiza el alcance de los puntos y la red de anclajes para todas las variantes y simula dos diseños a lo largo de las 24 principales. Comprueba combustible, manifiesto, orden de pruebas y restauración sin un salto de etapa.
- `tests/e2e/campaign.spec.ts` abre el juego en Chrome, mueve al astronauta con teclado hasta Control, gira con el ratón, usa pantalla completa y abre el diario en inglés. Prueba un fallo de pilotaje y atraviesa las etapas 3D de inicio a fin. Usa los controles de prueba del motor para alcanzar y accionar los POI en la prueba de recorrido y adelantar el tiempo fijo de las maniobras. Incluye conversación voluntaria, compuerta final, recarga tras la despedida, 24 misiones, siete pruebas y una salida posterior con Control.
- En Primera luz, comprobar flexión de rodillas durante el paso y el aterrizaje, elevación en el salto y gesto del codo al usar la terminal. Verificar el saludo en la estación y la transición de recogida a validada en el diario para AUR-E01 y AUR-E02. Las dos rutas de EVA deben permitir llegar al acople lunar con reserva. La partida del capítulo se reanuda aparte de la campaña y permite archivar cuatro encargos y 15 hallazgos.
- Cada destino debe verificarse también con juego manual continuo y los modelos del equipo. Registra la duración, navegación sin ayudas de prueba, rutas alternativas, estabilidad de fotogramas y lectura en los dos idiomas. Comprueba la voz cuando el propietario incorpore las grabaciones.

**Resultado en `codex/campana-completa`.** El build de producción, 37 pruebas de reglas y 14 recorridos de Chrome pasaron, incluidas las referencias orbital, lunar y marciana. Quedan el recorrido manual continuo, la medición sostenida en el equipo objetivo y la revisión con los modelos y grabaciones definitivos.
