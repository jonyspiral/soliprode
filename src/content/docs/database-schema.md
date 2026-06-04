---
title: "Database Schema"
description: "Esquema inicial de base de datos para SoliProde en Supabase."
lastUpdated: "2026-06-04"
---

# Database Schema

Estado: esquema inicial preparado. El objetivo de esta etapa es dejar la base relacional, índices y RLS listos sin conectar todavía UI, auth aplicada ni lógica de negocio completa.

## Migración inicial

- Archivo: `supabase/migrations/001_initial_schema.sql`

## Migración de registro

- Archivo: `supabase/migrations/002_registration_policies.sql`
- Objetivo: habilitar el primer flujo de registro con policies mínimas sobre `profiles`, `participations`, `communities` y `groups`.

## Migración correctiva

- Archivo: `supabase/migrations/003_harden_promoter_view_and_bonus_policies.sql`
- Objetivo: endurecer grants de `public.active_promoters_public` y versionar las policies propias de `bonus_predictions`.

## Migración correctiva de grants públicos

- Archivo: `supabase/migrations/004_fix_public_read_grants.sql`
- Objetivo: alinear los `grant select` de `teams`, `matches` y `rankings_cache` con las policies públicas de lectura ya definidas por RLS.

## Migración correctiva de grants autenticados

- Archivo: `supabase/migrations/005_fix_authenticated_runtime_grants.sql`
- Objetivo: alinear los `grant` SQL del rol `authenticated` con las policies RLS ya definidas para `profiles`, `participations`, `communities`, `groups`, `predictions` y `bonus_predictions`.

## Migración de fixture real

- Archivo: `supabase/migrations/009_fixture_schema_hardening.sql`
- Objetivo: extender `teams`, `matches` y `predictions` para soportar fixture real, zonas A-L, cierre server-side de pronósticos y administración segura sin cargar datos falsos.
- Documento específico: `src/content/docs/database/fixture-schema.md`.

## Migración de contrato admin para Promoters

- Archivo: `supabase/migrations/011_promoters_admin_contract.sql`
- Objetivo: normalizar `promoters` como entidad propia de Admin, con `status`, datos de contacto y `updated_at`, sin convertir Promoter en usuario autenticado.

## Tablas

### `profiles`

Perfil extendido del usuario autenticado.

Contrato activo de producto:

- `public_alias` es el nick de juego que se muestra en Profile, Ranking, Team y Plantel.
- `full_name` y `email` quedan como datos administrativos de cuenta.
- `whatsapp` sigue siendo opcional y editable como dato de contacto.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, referencia a `auth.users(id)` |
| `full_name` | `text` | Nombre completo opcional |
| `public_alias` | `text` | Nick de juego / alias público obligatorio |
| `whatsapp` | `text` | Contacto opcional |
| `email` | `text` | Copia opcional del email |
| `role` | `text` | Default `player` |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()`, con trigger |

### `promoters`

Promoters internos del torneo. No son usuarios del sistema, no tienen login y viven solo dentro de Admin.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `code` | `text` | Único |
| `name` | `text` | Obligatorio |
| `email` | `text` | Opcional |
| `whatsapp` | `text` | Opcional |
| `status` | `text` | `active` o `inactive` |
| `notes` | `text` | Opcional, uso interno |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()`, con trigger |

Notas activas:

- `profile_id` y `active` pueden seguir existiendo por compatibilidad histórica, pero ya no son el contrato operativo principal.
- la atribución comercial y el ranking usan `participations.promoter_id` como fuente de verdad.

### `communities`

Oficinas, comunidades o estructuras organizadoras.

### `groups`

Subgrupos competitivos, opcionalmente dentro de una comunidad.

### `participations`

Relación de inscripción de un perfil dentro del juego y sus ámbitos de competencia.

### `teams`

Catálogo de selecciones o equipos del Mundial.

Campos nuevos de fixture real:

- `short_name`
- `fifa_code`
- `country_code`
- `flag_emoji`
- `group_code`
- `group_position`

Nota de lenguaje:
- `group_code` se mantiene como campo tecnico.
- La UI de fixture muestra `Zona A`, `Zona B`, etc. para no confundir con grupos de jugadores.

### `matches`

Fixture del torneo con estado y score final cuando exista.

Campos nuevos de fixture real:

- `match_number`
- `round_name`
- `stage`
- `group_code`
- `prediction_closes_at`
- `venue`
- `city`
- `home_score`
- `away_score`
- `result_locked`

Nota de compatibilidad:
- `score_home` y `score_away` siguen siendo los campos que usa el scoring actual.
- `home_score` y `away_score` quedan sincronizados como aliases.
- `group_code` sigue igual internamente; en labels visibles de fixture se presenta como `Zona`.

### `predictions`

Pronósticos partido a partido por usuario.

Restricción importante:
- `unique(profile_id, match_id)` para impedir duplicados.
- `user_id`, `predicted_home_score` y `predicted_away_score` quedan como aliases sincronizados del contrato actual.
- No se agrega `is_official`: la oficialidad sigue derivada de `participations.payment_status` y `eligible_from`.

### `bonus_predictions`

Pronósticos especiales por perfil, por ejemplo campeón y subcampeón.

Restricción importante:
- `unique(profile_id)` para permitir solo una fila por usuario.

### `rankings_cache`

Cache de rankings precalculados para lectura rápida por tipo y alcance.

## Relaciones principales

- `profiles.id -> auth.users.id`
- `communities.owner_profile_id -> profiles.id`
- `groups.community_id -> communities.id`
- `groups.owner_profile_id -> profiles.id`
- `participations.profile_id -> profiles.id`
- `participations.promoter_id -> promoters.id`
- `participations.community_id -> communities.id`
- `participations.group_id -> groups.id`
- `matches.home_team_id -> teams.id`
- `matches.away_team_id -> teams.id`
- `predictions.profile_id -> profiles.id`
- `predictions.match_id -> matches.id`
- `bonus_predictions.profile_id -> profiles.id`
- `bonus_predictions.champion_team_id -> teams.id`
- `bonus_predictions.runner_up_team_id -> teams.id`
- `rankings_cache.profile_id -> profiles.id`

## Índices

La migración agrega índices útiles para:

- claves foráneas,
- búsquedas por `status`,
- lecturas por `starts_at`,
- lookup de rankings por `ranking_type + scope_id + position`,
- consultas de predicciones por `match_id`.

No se agrega seed data en esta etapa.

## RLS inicial

RLS queda habilitado en todas las tablas.

### Lectura pública

Se permite `select` público en:

- `teams`
- `matches`
- `rankings_cache`

Motivo: son tablas de lectura del torneo o resultados agregados visibles para todos.

Importante:
- además de la policy RLS, estas tablas necesitan `grant select` a `anon` y `authenticated`;
- la migración `004_fix_public_read_grants.sql` corrige ese punto para evitar errores `permission denied` aun cuando la policy exista.

### Lectura autenticada propia

Se permite que usuarios autenticados lean solo sus propios registros en:

- `profiles`
- `participations`
- `predictions`

### Escritura autenticada propia

Se permite que usuarios autenticados inserten y actualicen solo sus propias filas en:

- `predictions`

Regla adicional desde `009_fixture_schema_hardening.sql`:

- el usuario solo puede crear, editar o borrar su propio pronóstico si el partido está `scheduled` y `now() < matches.prediction_closes_at`;
- esta regla vive en RLS y no depende de la UI.

Importante:
- además de la policy RLS, el rol `authenticated` necesita privilegios SQL explícitos para ejercer esas lecturas y escrituras;
- la migración `005_fix_authenticated_runtime_grants.sql` normaliza esos `grant` para las tablas operativas del runtime autenticado y evita errores de bootstrap como "la sesión se abrió, pero no pudimos verificar tu perfil".

### Sin escritura pública

No se agregan políticas de escritura pública en ninguna tabla.

## Policies de registro

La segunda migración agrega solo el mínimo necesario para el primer flujo de alta.

### `profiles`

- `authenticated users can insert own profile`
- `authenticated users can update own profile`

Regla: el usuario autenticado solo puede insertar o editar la fila cuyo `id = auth.uid()`.

### `participations`

- `authenticated users can insert own participations`
- `authenticated users can update own pending participations`

Regla: el usuario autenticado solo puede crear participaciones propias y solo puede editar participaciones propias cuyo `payment_status = 'pending'`.

### `communities`

- `public can read public communities`
- `authenticated users can insert own communities`
- `owners can update own communities`

Regla: lectura pública únicamente cuando `visibility = 'public'`. La escritura queda reservada al owner.

### `groups`

- `public can read public groups`
- `authenticated users can insert own groups`
- `owners can update own groups`

Regla: mismo criterio de visibilidad pública y ownership que en comunidades.

### `promoters`

RLS sola no permite exponer solo algunas columnas; filtra filas, no columnas.

Por eso la migración agrega:

- vista `public.active_promoters_public`

La vista expone únicamente:

- `code`
- `name`

Y solo para Promoters con `status = 'active'`.

La migración correctiva posterior endurece los grants de la vista con:

- `revoke all` para `anon`
- `revoke all` para `authenticated`
- `grant select` explícito para `anon`
- `grant select` explícito para `authenticated`

De ese modo la superficie pública queda reducida a lectura explícita solamente.

### `bonus_predictions`

La migración correctiva agrega o refresca estas policies:

- `authenticated users can read own bonus predictions`
- `authenticated users can insert own bonus predictions`
- `authenticated users can update own bonus predictions`

Regla: cada usuario autenticado solo puede leer, crear o editar la fila cuyo `profile_id = auth.uid()`.

## Decisiones de esta etapa

- Se usa `gen_random_uuid()` en todas las PK que no dependen de `auth.users`.
- Se usan `created_at default now()` en tablas de dominio.
- Se agregan triggers de `updated_at` donde ese campo existe.
- Se dejan checks básicos en `role`, `visibility`, `payment_status`, `match status` y scores no negativos.
- La lectura pública limitada de promotores activos se resuelve con vista, no con RLS directa sobre columnas.
- `Promoter` no se modela como usuario autenticado: no tiene password, login ni credenciales.
- La fuente de verdad del ranking y la recaudación de Promoters vive en `participations.promoter_id`.
- Los grants de la vista pública de promotores se endurecen en una migración correctiva separada para sincronizar repo y base real.
- Los grants SQL del rol `authenticated` se corrigen en una migración dedicada para que las policies RLS ya definidas sean utilizables desde el cliente autenticado sin ir corrigiendo tabla por tabla en producción.

## Próximos pasos sugeridos

1. Agregar políticas adicionales cuando se definan administración y lectura privada de owners en grupos/comunidades no públicas.
2. Crear migraciones siguientes para vistas, funciones o materialización de rankings.
3. Recién después conectar este esquema con auth y UI.
