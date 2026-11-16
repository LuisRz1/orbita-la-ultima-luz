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

La campaña conserva AUR-E01–AUR-E07, reabastecimiento marciano, manifiesto de los tres supervivientes y cierre en la Tierra. El guardado registra por separado la despedida y el regreso. Los textos están en español e inglés. La escena reproduce grabaciones con diálogo compatible; el manifiesto acepta clips adicionales.

En campo, V cambia entre tercera persona y visor, C centra, F activa pantalla completa y G activa una capacidad de LUMA cuando está disponible. La calidad inicial es automática, con aspecto ilustrado. Los ajustes permiten activar el aspecto realista y el posproceso.

## Verificación y continuidad

- Producción pública en [Vercel](https://orbita-la-ultima-luz.vercel.app/) y [rama de entrega en GitHub](https://github.com/LuisRz1/orbita-la-ultima-luz/tree/codex/entrega-juego).
- Build de producción, 99 pruebas de lógica y 35 de Chrome aprobadas. En la URL pública se verificaron los ajustes, el audio del prólogo, el visor con V, el acceso a Control con teclado y la persistencia al recargar.
- La batería de pruebas cubre los 24 hitos, ambas rutas de EVA de C1, la validación de las siete pruebas, la compuerta, la despedida, el manifiesto, el regreso y la reanudación. El recorrido automatizado usa posiciones y tiempo controlados.
- Falta medir duración, balance y fotogramas sostenidos en equipos objetivo con jugadores. Las cuotas ampliadas de exploración y el conjunto completo de voces siguen en producción.
- [Guía de integración](../06-Produccion/CAMPANA-3D.md) · [Handoff](../08-Bitacora/HANDOFF-CAMPANA-3D.md) · [Bitácora](../08-Bitacora/2026-11-15.md) · [Issue de campaña](https://github.com/LuisRz1/nasa-orbita/issues/13).
