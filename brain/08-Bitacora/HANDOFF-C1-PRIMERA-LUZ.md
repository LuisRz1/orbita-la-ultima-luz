---
id: handoff-c1-primera-luz
type: handoff
status: c1-jugable-en-rama
updated: 2026-11-14
tags: [orbita, continuidad, capitulo-1, integracion]
---
# Continuación de Primera luz

**Fecha:** 14 de noviembre de 2026. **Rama:** `feat/world-orbit` en [orbita-la-ultima-luz](https://github.com/LuisRz1/orbita-la-ultima-luz). **Seguimiento:** [EXP-C1](https://github.com/LuisRz1/nasa-orbita/issues/15) y [PREP-03](https://github.com/LuisRz1/nasa-orbita/issues/3). El propietario pidió desarrollar C1 mientras su equipo se encarga de C2; este cambio no reordena toda la producción de campaña.

## Probar el capítulo

Ejecutar `pnpm install --frozen-lockfile` y `pnpm dev`. Abrir la URL de Vite con `?world=orbit` o elegir **Órbita** desde el selector. El acceso normal a Luna se conserva.

1. Registrar el aviso de recuperación. Comparar **Propuesta ligera** y **Propuesta científica**; son viables y cada campo se puede editar. Probar la órbita de reconocimiento con lanzador compacto para ver la incompatibilidad.
2. Autorizar el lanzamiento. En cada maniobra, controles manuales del [plan de vuelo](../02-Diseno/VIAJE-ESPACIAL.md) o guía. No confirma hasta entrar, frenar y alinearse con combustible suficiente. La pérdida de corredor tiene informe y recuperación.
3. En el hábitat, transferir suministros, cotejar cápsula y abrir el compartimento. Preparar descanso y protección, calibrar el traductor y autenticar AUR-E01. LUMA usa la hoja dorada del kit; aparece por primera vez en su encuentro.
4. Elegir ruta de EVA. Registrar iluminación, recuperar el registrador y regresar a la esclusa. LUMA espera presurizado. Solo la autenticación en la esclusa concede AUR-E02.
5. Confirmar ruta viable, pilotar la salida, acelerar el crucero, acoplar en el nodo lunar, cerrar el informe y luego elegir **Continuar a la Luna**.

La referencia incluye seis principales, cuatro encargos opcionales y 15 hallazgos de diario. Son registros de tareas y observaciones del escenario, no 15 objetos o mapas distintos. La duración de 1,5–2 h sigue como meta de producción, no una duración medida.

## Integración con el equipo de Luna

- El arte, `src/worlds/moon.ts`, su CSS global, su esquema y su clave `c2-reference` quedan como estaban. Los estados persistidos de C1 viven en `orbita-chapters / c1-first-light`; los mapas y pruebas de C2 siguen en el kit v1.
- C1 guarda designación `c1-first-light`, telemetría de cada maniobra, horas de crucero, plan, región y pruebas. El crucero se cobra una sola vez; no se conserva una maniobra a medio segundo. La recarga devuelve al último control confirmado.
- [readLunarHandoff](../../src/worlds/orbit/storage.ts) devuelve `null` antes de archivar el informe. Luego devuelve un objeto v1 con cap. C1, entrada `C2-M01`, destino `lunar-node`, llegada segura, AUR-E01/AUR-E02, nave y LUMA protegido. La función solo lee, no cambia el guardado de Luna. El selector muestra la entrega como contexto; C2 conserva autoridad sobre descenso, pista marciana y AUR-E03.
- El acceso directo a Luna sigue siendo un ensayo disponible y no exige completar C1. Al combinar la campaña, el integrador puede consumir la entrega desde la entrada de C2 y conservar sus propias reglas; el diseño detallado del descenso sigue siendo de ese equipo.

## Evidencia y siguiente paso

Código en [src/worlds/orbit](../../src/worlds/orbit/OrbitChapter.tsx). Revisar [contraste con el enunciado](../04-Ciencia/REQUISITOS-NASA.md) y [pruebas de aceptación](../07-Calidad/ACEPTACION-Y-PRUEBAS.md). Los perfiles de vuelo, tasas de enlace y combustible son educativos, sin navegación real. No se activó IA ni multijugador. El siguiente paso es revisar el PR, completar C2 en su rama y ensayar su integración sin fusionar antes de tiempo.
