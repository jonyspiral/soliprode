# AGENTS.md — SoliProde

Este archivo es la entrada corta para cualquier agente IA que trabaje en este repositorio.
No reemplaza la documentación técnica: apunta al contexto correcto antes de tocar código.

## Bootstrap obligatorio

Antes de modificar código:

1. Leer `.antigravity-context.md`.
2. Leer `src/content/docs/protocolo-agentes.md`.
3. Si la tarea incluye publicación, leer `src/content/docs/runbooks/deploy-main.md`.
4. Leer `src/content/docs/docs-map.md`.
5. Leer la documentación del área afectada en `src/content/docs/`.

## Regla crítica

No convertir páginas o layouts compartidos en monolitos.

Si el cambio parece simple pero cae sobre la shell, navegación o landing, no resolver agregando más código inline si ya existe una responsabilidad reusable. Extraer componente, helper o sección primero, y recién después aplicar el cambio.

## Gobierno de planes

Antes de crear un nuevo plan en SoliProde, revisar `plans/000-plan-index-soliprode.md`.
Si el tema ya existe, actualizar el plan vigente en vez de crear uno duplicado.
Todo plan debe tener estado, prioridad, próxima acción y criterio de cierre.

## Archivos sensibles

Antes de modificar cualquiera de estos archivos, justificar el cambio y revisar el impacto estructural:

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/components/app-shell.tsx`
- `src/app/globals.css`

## Criterio de intervención

- Si un cambio suma más de 80-100 líneas a un archivo sensible, extraer módulo.
- Si toca shell, navegación global, autenticación futura, rankings o modelo de datos, crear plan previo.
- Mantener compatibilidad externa primero; limpieza interna después.
- Preferir refactors sin cambio funcional antes de cambios de comportamiento.
- Documentar cambios estructurales en `src/content/docs/`.
- Para publicar a `main`, seguir el runbook canónico `src/content/docs/runbooks/deploy-main.md` y reportar evidencia mínima: `commit` + URL del run/deploy + estado.

## Plan de referencia

La política base vive en:

- `plans/000-plan-index-soliprode.md`
- `src/content/docs/protocolo-agentes.md`
