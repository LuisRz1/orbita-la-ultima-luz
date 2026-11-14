---
id: requisitos-nasa
type: requisitos
status: contraste-enunciado-c1
updated: 2026-11-14
tags: [orbita, nasa]
---
# Relación con NASA Space Apps 2026

Reto: [Space Mission Design Game](https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/).

Contraste del 14 de noviembre con el enunciado completo aportado por el propietario (antecedentes, objetivos y consideraciones). La [ficha del evento local de Athlone](https://hackathlone.com/challenges/space-mission-design-game) permite consultar también las recomendaciones y la lista de recursos. No contiene el calendario local del equipo de Cajamarca.

## Qué exige el reto y qué cambió

El objetivo central es un **juego interactivo para diseñar, gestionar, simular y evaluar una misión completa** en el que las decisiones de ingeniería compitan por recursos limitados. Antes del cambio, el kit dejaba comparar dos cargas de campo, pero no ofrecía diseño de nave, selección de órbita y lanzador, simulación de maniobras ni un informe que conectara esas decisiones.

La misión orbital [Primera luz](../02-Diseno/CAPITULOS/C1-PRIMERA-LUZ.md) cubre el ciclo desde el aviso de recuperación de Aurora hasta el informe en el nodo lunar. La campaña continúa después; el rescate completo no es una condición del cierre C1.

| Elemento del enunciado | En el juego | Cómo comprobarlo |
| --- | --- | --- |
| Objetivo y requisitos | M01 registra la búsqueda. Se elige rastrear el archivo o caracterizar la iluminación; cambia el mínimo científico y ambos requieren lector y observación solar. | Quitar el lector o dejar ciencia insuficiente bloquea la autorización con una explicación. |
| Nave, lanzador e instrumentos | Dos estructuras, sistemas de potencia y antenas; dos lanzadores, dos órbitas y cuatro instrumentos configurables. El equipo obligatorio de EVA y protección forma parte de masa, potencia y coste. | Comparar propuesta ligera y científica. Un lanzador incompatible o que no admite la masa bloquea el despegue. |
| Compromisos y recursos | Masa, kW, créditos, GB de memoria, tasa de enlace, ventanas, autonomía y combustible figuran con límites. La masa altera respuesta al empuje y los instrumentos generan datos al operar. | Montar lector de alta resolución y cámara en un diseño básico: revisar los fallos y resolverlos con potencia/enlace suficientes. |
| Órbita y tiempo | La altitud seleccionada cambia la estimación de pasadas y el encuentro. El crucero ofrece una ruta de ahorro y una rápida; se valida la autonomía y el margen de maniobra. | En el diseño ligero, el traslado de ahorro excede la autonomía. En el científico, puede autorizarse. |
| Simulación y operación | Ascenso, encuentro, acople, EVA, salida y aproximación controlables; el crucero acelera horas de juego. Se comprueba distancia, velocidad relativa, rumbo y reserva; los hitos quedan guardados. | Pilotar, activar asistencia, provocar una salida de corredor o recargar en crucero. La asistencia también consume combustible. |
| Análisis de resultado | Fallo recuperable con causa y telemetría. El informe final relaciona cargas, dato obtenido, ventana, tiempo y combustible con resultado y puntuación. Se puede rediseñar y repetir. | Terminar hasta el nodo lunar y comparar cada límite con el informe; el destino se entrega a Luna solo después de archivarlo. |
| Enseñanza y accesibilidad | Texto ES/EN, indicadores con etiqueta y símbolo, ayuda y controles de teclado/ratón. La interfaz enlaza referencias NASA y distingue modelo del escenario. | Probar selección accesible, frenado y asistencia, además de una configuración fallida y dos viables. |

Jugador individual, modo cooperativo de hasta cuatro, roles, dificultad, ranking, escenarios competitivos y otras variantes son **sugerencias**, no requisitos del texto. Esta entrega conserva un jugador. La colaboración del equipo de desarrollo usa módulos separados y no requiere implementar multijugador.

## Datos y referencias

La [sesión de NASA sobre diseño de misiones científicas](https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf#page=8) distingue los segmentos de lanzamiento, operación espacial, tierra y usuarios. Órbita los presenta como validación/ascenso, maniobras e instrumentos, enlace con Control e informe de datos. Esta es la adaptación del juego, no una certificación de diseño.

Se usa la [referencia NASA de observación en órbita baja](https://www.nasa.gov/missions/station/iss-research/observing-our-planet-from-low-earth-orbit/): altitud aproximada de 400 km y periodo aproximado de 90 minutos de la ISS. En [science.ts](../../src/worlds/orbit/science.ts), esos valores anclan el periodo circular estimado. Contar pasadas a partir de una ventana del juego limita el valor de observación del plan. El segundo escenario a 520 km, la ventana de enlace, las capacidades, los costes, la estación de Aurora y sus datos son **simulados**. Se usa también [navegación relativa](https://www.nasa.gov/isam/relative-navigation-system/) y [contraste de iluminación en EVA](https://science.nasa.gov/missions/hubble/dark-sky-bright-sun/) como referencias cualitativas. No se descargó un producto científico ni se calculó una trayectoria operativa.

## Estado de entrega

La alineación se comprobó en código con pruebas de reglas y recorridos de navegador; ver [aceptación](../07-Calidad/ACEPTACION-Y-PRUEBAS.md) y [transferencia del capítulo](../08-Bitacora/HANDOFF-C1-PRIMERA-LUZ.md). No equivale a validación oficial del jurado. El despliegue público jugable, el formulario y la hora de cierre interna de la sede siguen en seguimiento.

La [apertura comunicada en Cajamarca](../08-Bitacora/2026-11-14.md#apertura-en-cajamarca) se registró por separado del [calendario global](https://www.spaceappschallenge.org/2026/).
