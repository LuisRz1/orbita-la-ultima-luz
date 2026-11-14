---
id: plantilla-mundo
type: plantilla
status: vigente
updated: 2026-11-14
tags: [orbita, plantilla, mundos]
---
# Ficha de entrega de un mundo

**Destino y capítulo:** · **Responsable:** · **Issue:** · **Rama/commit:** · **Versión del kit:** 1

**Alcance:** ensayo o campaña; qué está implementado y qué queda fuera.

**Entrada:** región y punto de llegada; condición previa; evidencia ya validada; reservas; equipo; estado de LUMA; texto ES/EN.

**Operación:** describe riesgo y cómo se comunica sin depender del color. Usa una tabla como esta:

| ID estable | Casilla (x,y) | Acción común | Costo | Requisitos | Principal/opcional | Resultado ES/EN |
| --- | --- | --- | --- | --- | --- | --- |
| … | … | scan / salvage / service / upload | … | … | … | … |

**Retorno e informe:** punto de retorno, pruebas obligatorias, reservas, evento final, evidencia/estado que sí puede conceder, qué desbloquea y qué no. Si es campaña, indica los hitos recibidos por el capítulo siguiente. Define cómo recuperar un fallo y desde qué casilla se reanuda.

**Arte:** PNGs reutilizados y nuevos; ruta, licencia, escala, origen y captura. Distingue ciencia, simplificación y ficción.

**Verificación:**

- [ ] El mapa se abre con la interfaz común y el punto seguro es transitable.
- [ ] Se llega a las acciones desde casillas libres y se puede volver con la reserva requerida por el kit.
- [ ] Completar el objetivo remoto o sin requisitos no funciona.
- [ ] Completar la ruta principal sin opcionales funciona con ambas cargas.
- [ ] Español e inglés, controles, guardado y reanudación coinciden con la referencia.
- [ ] No se revelan hechos futuros ni se usa una salida o un menú paralelo.
- [ ] Captura, resultado de tests, limitaciones y siguiente tarea en el PR.

Empieza con la [guía de integración](../06-Produccion/KIT-DE-MUNDOS.md) y el [contrato](../03-Arquitectura/ADR/ADR-005.md).
