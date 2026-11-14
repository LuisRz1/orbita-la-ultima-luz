---
id: entorno
type: configuracion
status: kit-local-verificado
updated: 2026-11-14
tags: [orbita, herramientas]
---
# Entorno y herramientas

## Equipo de referencia

Inspección inicial del 11 de octubre de 2026: Ryzen 7 4800H, 8 núcleos/16 hilos; aproximadamente 16 GB de RAM; GTX 1650 Ti de 4 GB y gráfica Radeon integrada; Windows 10.

En esa inspección había aproximadamente 15 GB libres en C: y 117 GB en D:. Son una fotografía del momento, no valores monitorizados.

## Herramientas ya disponibles

Node 24.18.0, npm 11.6.2, pnpm 12.4.1, Git, GitHub CLI, Vercel CLI, Chrome y Obsidian. Se verificaron cuenta GitHub y acceso Vercel durante la investigación.

## Base de versiones investigada

Phaser 4.2.1; Vite 8.3.4; TypeScript 7.0.2; React 19.3.0; Zustand 5.0.15; Zod 4.6.6; Dexie 4.4.6; AI SDK 7.0.137; Vitest 5.0.3; Playwright 1.64.0.

Las anteriores son referencias de octubre. El kit fijó Phaser 4.2.1, Vite 8.3.8, TypeScript 7.0.2, React 19.3.1, Zod 4.6.7, Dexie 4.4.7 y Playwright 1.65.1 con Node 24.18.0 y pnpm 12.4.1. No requiere cuentas, backend, credenciales ni IA. Se probó Chrome existente; los comandos de integración están en [kit](KIT-DE-MUNDOS.md).

## Instalación futura

Usar dependencias locales y Tiled/LibreSprite desde sus distribuciones oficiales. Preferir D: para herramientas portables y cachés. Reutilizar Chrome para comprobaciones cuando sea compatible.

No modificar configuración global ni desinstalar herramientas existentes para preparar el proyecto. No instalar modelos locales pesados para LUMA.

## Abrir hoy

Ejecuta `pnpm install --frozen-lockfile` y `pnpm dev` desde la raíz; abre la URL local de Vite. Para el catálogo PNG no se requiere instalar un editor de arte. La documentación puede abrirse como bóveda seleccionando brain.
