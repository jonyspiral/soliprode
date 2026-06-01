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
| Policies de registro | `plans/2026-06-01-registration-rls-policies.md` | Datos / seguridad | IMPLEMENTADO | Policies mínimas para perfil, participación, comunidades y grupos del flujo de registro | P1 | Continuar con auth y writes reales apoyados en estas policies | Agente técnico |
| Correctivo de vista promoters y bonus policies | `plans/2026-06-01-corrective-promoter-view-and-bonus-policies.md` | Datos / seguridad | IMPLEMENTADO | Alinea grants de la vista pública y policies propias de bonus_predictions | P1 | Construir el flujo de bonus predictions sobre esta base | Agente técnico |
| Correctivo de grants públicos de lectura | `supabase/migrations/004_fix_public_read_grants.sql` | Datos / seguridad | IMPLEMENTADO | Alinea los grants SQL de `teams`, `matches` y `rankings_cache` con sus policies públicas RLS | P1 | Aplicar la migración en Supabase para habilitar lectura pública efectiva | Agente técnico |
| Correctivo de grants autenticados de runtime | `supabase/migrations/005_fix_authenticated_runtime_grants.sql` | Datos / seguridad | IMPLEMENTADO | Alinea los grants SQL del rol `authenticated` con las policies RLS ya definidas para bootstrap de perfil, participación y módulos interactivos | P0 | Aplicar la migración en Supabase para estabilizar login, registro y writes del usuario | Agente técnico |

## Backlog sugerido todavía no planificado

- Autenticación y modelo de sesión.
- Catálogo de partidos y predicciones.
- Rankings globales y por grupo.
- Comunidades y oficinas.
- Admin operacional.
- Integración con Supabase.
