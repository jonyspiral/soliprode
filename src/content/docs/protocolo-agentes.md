---
title: "Protocolo para Agentes (AI)"
description: "Reglas de convivencia y estándares técnicos para SoliProde."
lastUpdated: "2026-06-01"
indexable: false
---

# Protocolo para Agentes de SoliProde

Cuando múltiples agentes o herramientas trabajan en el mismo repositorio, la coherencia evita retrabajo y deriva. Este protocolo es obligatorio para cualquier IA que opere aquí.

## Arquitectura de Conocimiento del Proyecto

Antes de tocar cualquier cosa, todo agente debe entender estas capas:

| Capa | Archivo / Carpeta | Rol |
|---|---|---|
| Misión | `src/content/docs/protocolo-agentes.md` | Reglas de operación para cualquier agente. |
| Gatillo | `.antigravity-context.md` | Punto de entrada obligatorio. Estado actual, pendientes y snapshot de la última sesión. |
| Contexto persistente | `src/content/docs/` | Base de conocimiento técnica del proyecto. |
| Gobierno de planes | `plans/` | Planes activos, backlog y criterios de cierre por iniciativa. |

**Flujo obligatorio de entrada**:
1. Leer este protocolo.
2. Leer `.antigravity-context.md`.
3. Leer `src/content/docs/docs-map.md`.
4. Leer los documentos relevantes de `src/content/docs/` según la tarea.

## 0. Plan Antes de Codificar

Para cualquier tarea que involucre más de un archivo o un flujo nuevo, crear un plan antes de implementar.

### Qué es un plan

Un archivo Markdown que describe:
- contexto,
- archivos a crear o modificar,
- implementación propuesta,
- verificación end-to-end.

### Dónde se guardan los planes

Los planes se guardan en `plans/` dentro del repo.

### Cuándo no hace falta

- Typos o cambios de una línea.
- Ajustes triviales de copy.
- Cambios de documentación sin impacto técnico.

## 1. Regla de oro: leer primero, codificar después

Antes de proponer cambios estructurales:

- leer `.antigravity-context.md`,
- leer la documentación relevante,
- verificar si existe un plan vivo para ese tema.

## 2. Organización y extensibilidad

Este repo está en etapa inicial. La regla principal es no degradar la extensibilidad.

- No crecer `layout.tsx`, la landing o la shell compartida sin necesidad.
- Si una página empieza a mezclar presentación, navegación y datos, separar componentes o helpers.
- Mantener las rutas del App Router simples y enfocadas.

## 3. Stack y límites actuales

- Framework: Next.js App Router.
- Lenguaje: TypeScript.
- Estilos: Tailwind CSS.
- Deploy target: Vercel.
- PWA: manifest mínimo ya presente.
- Futuro previsto: Supabase, auth y base de datos.

### Restricciones actuales

- No implementar auth todavía.
- No implementar pagos.
- No implementar lógica de negocio definitiva.
- No introducir dependencias pesadas sin necesidad clara.

## 4. Git y trazabilidad

- Commits atómicos.
- Mensajes claros tipo `feat:`, `fix:`, `docs:`, `refactor:`.
- No hacer `force-push` a `main` sin autorización explícita.

## 5. Documentación mandataria

Cada cambio estructural debe dejar rastro en `src/content/docs/` y actualizar `.antigravity-context.md`.

Si la funcionalidad tocó más de un archivo, cambió una decisión arquitectónica o abrió una nueva superficie del producto, documentar sin esperar que el usuario lo pida.

## 6. Checklist de salida

Antes de cerrar una tarea, verificar:

1. ¿Leí `.antigravity-context.md` al inicio?
2. ¿Leí `src/content/docs/` relevante?
3. ¿Creé plan si el cambio lo requería?
4. ¿Mantengo la shell y las rutas extensibles?
5. ¿Documenté cambios estructurales?
6. ¿Validé con `npm run lint` y/o `npm run build` si aplica?
7. ¿Confirmé con el usuario antes de publicar o hacer acciones destructivas?
