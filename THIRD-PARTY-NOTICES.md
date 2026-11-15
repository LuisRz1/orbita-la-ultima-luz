# Atribuciones y materiales de terceros

La copia local contiene documentación y arte original del kit. No incluye sprites de otros juegos, datasets científicos descargados, logotipos oficiales ni la imagen privada aportada como referencia.

Las reseñas enlazadas y la información de NASA/JPL/PDS pertenecen a sus respectivos titulares o se distribuyen según las condiciones de cada recurso. Enlazar una fuente no incorpora su licencia a este repositorio.

Al incorporar un recurso durante la fase autorizada, registrar:

| Recurso | Autor/institución | URL original | Licencia o condiciones | Modificaciones | Ubicación |
| --- | --- | --- | --- | --- | --- |
| Código de dependencias | Respectivos autores | Registros y versiones en el lockfile | Licencia distribuida con cada paquete | Uso sin copiar sprites de terceros | `node_modules` y dependencias compiladas |
| Ideas de render (uniformes compartidos, parcheo de materiales con ganchos, volumen de sombras centrado en el espectador) | Valle Morta contributors | https://github.com/Leonxlnx/valle-morta | MIT, Copyright (c) 2026 Valle Morta contributors | Reimplementado en TypeScript; no se copian recursos ni audio | `src/engine/shared.ts`, `src/engine/lighting.ts` |

Para datos científicos añadir además identificador del producto, versión, unidades, fecha de consulta y transformaciones. Consultar [fuentes científicas](brain/04-Ciencia/FUENTES.md).

Cada contribuidor debe confirmar los derechos del recurso concreto. No aplicar automáticamente MIT o CC BY a materiales ajenos.
