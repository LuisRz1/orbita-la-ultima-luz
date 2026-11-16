---
id: estado-actual
type: estado
status: entrega-integrada
updated: 2026-11-15
tags: [orbita, continuidad]
---
# Estado actual

## Entrega del 15 de noviembre

La rama **codex/entrega-juego** une **main** (visor, prólogo, audio y expediciones del equipo) con **codex/campana-completa** (campaña de 24 misiones, planificación, vuelo, crucero y rescate). Las ramas de órbita, 3D y la actualización de Marco están en el historial de la entrega.

La portada abre configuración. **Jugar Primera luz** inicia el capítulo con su guardado independiente y permite pasar al nodo lunar de la campaña. **Campaña de Aurora** reanuda la historia y **Expedición lunar** abre la muestra de diseño de traje e informe.

En partidas nuevas se juega primero la despedida de la hermana en la Tierra, de civil. El prólogo original cuenta el salto de meses y da paso a Control. LUMA aparece en la estación después de cotejar la cápsula y habla tras calibrar su traductor. La campaña conecta Tierra y órbita, Luna, Marte, Bennu y regreso a la Tierra con una cinemática al cerrar cada capítulo.

La campaña conserva AUR-E01–AUR-E07, reabastecimiento marciano, sacrificio de LUMA y manifiesto de los tres supervivientes. El guardado registra los hitos y las cinemáticas por separado. Los textos y las grabaciones incorporadas están en español e inglés. Las tomas pendientes se detallan en el [guion de LUMA](../05-Arte/GUION-LUMA.md).

En campo, V cambia entre tercera persona y visor, C centra, F activa pantalla completa y G activa una capacidad de LUMA cuando está disponible. La calidad inicial es automática, con aspecto ilustrado. Los ajustes permiten activar el aspecto realista y el posproceso.

## Verificación y continuidad

- Producción pública en [Vercel](https://orbita-la-ultima-luz.vercel.app/) y [rama de entrega en GitHub](https://github.com/LuisRz1/orbita-la-ultima-luz/tree/codex/entrega-juego).
- Build de producción, 100 pruebas de lógica y 35 de Chrome aprobadas. Se probó la despedida inicial con teclado, el prólogo, la aparición de LUMA tras el cotejo, la carga de audio al calibrar el traductor y la reanudación antes y después de las transiciones.
- La batería de pruebas cubre los 24 hitos, ambas rutas de EVA de C1, la validación de las siete pruebas, la compuerta, la despedida, el manifiesto, el regreso y la reanudación. El recorrido automatizado usa posiciones y tiempo controlados.
- Falta medir duración, balance y fotogramas sostenidos en equipos objetivo con jugadores. Las cuotas ampliadas de exploración y el conjunto completo de voces siguen en producción.
- [Guía de integración](../06-Produccion/CAMPANA-3D.md) · [Handoff](../08-Bitacora/HANDOFF-CAMPANA-3D.md) · [Bitácora](../08-Bitacora/2026-11-15.md) · [Issue de campaña](https://github.com/LuisRz1/nasa-orbita/issues/13).
