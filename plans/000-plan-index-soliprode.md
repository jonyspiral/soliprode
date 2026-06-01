# Índice Maestro de Planes — SoliProde

Fecha: 2026-06-01
Alcance: `plans/`, `src/content/docs/`, `.antigravity-context.md`, `AGENTS.md`, `README.md`

Objetivo: centralizar los planes activos y evitar duplicados mientras SoliProde pasa de bootstrap a producto.

## Reglas de uso

1. Antes de crear un plan nuevo, revisar este índice.
2. Si el tema ya existe, actualizar el plan vivo.
3. Todo plan debe incluir:
   - estado,
   - prioridad,
   - próxima acción,
   - criterio de cierre.

## Planes

| Tema | Archivo | Área | Estado | Resumen | Prioridad | Próxima acción | Owner sugerido |
|---|---|---|---|---|---|---|---|
| Bootstrap base del producto | `plans/000-plan-index-soliprode.md` | Gobierno técnico | IMPLEMENTADO | Repo inicial con app base, docs y estructura de agentes | P0 | Mantener este índice como entrada obligatoria | Agente técnico |
| Esquema inicial Supabase | `plans/2026-06-01-initial-supabase-schema.md` | Datos / plataforma | IMPLEMENTADO | Migración base con tablas, índices, RLS y documentación | P1 | Evolucionar auth, participaciones y rankings sobre este esquema | Agente técnico |

## Backlog sugerido todavía no planificado

- Autenticación y modelo de sesión.
- Catálogo de partidos y predicciones.
- Rankings globales y por grupo.
- Comunidades y oficinas.
- Admin operacional.
- Integración con Supabase.
