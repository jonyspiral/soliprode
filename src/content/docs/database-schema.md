---
title: "Database Schema"
description: "Esquema inicial de base de datos para SoliProde en Supabase."
lastUpdated: "2026-06-01"
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

## Tablas

### `profiles`

Perfil extendido del usuario autenticado.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, referencia a `auth.users(id)` |
| `full_name` | `text` | Nombre completo opcional |
| `public_alias` | `text` | Alias público obligatorio |
| `whatsapp` | `text` | Contacto opcional |
| `email` | `text` | Copia opcional del email |
| `role` | `text` | Default `player` |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()`, con trigger |

### `promoters`

Promotores o referidores del torneo.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `code` | `text` | Único |
| `name` | `text` | Obligatorio |
| `profile_id` | `uuid` | FK opcional a `profiles` |
| `active` | `boolean` | Default `true` |
| `created_at` | `timestamptz` | Default `now()` |

### `communities`

Oficinas, comunidades o estructuras organizadoras.

### `groups`

Subgrupos competitivos, opcionalmente dentro de una comunidad.

### `participations`

Relación de inscripción de un perfil dentro del juego y sus ámbitos de competencia.

### `teams`

Catálogo de selecciones o equipos del Mundial.

### `matches`

Fixture del torneo con estado y score final cuando exista.

### `predictions`

Pronósticos partido a partido por usuario.

Restricción importante:
- `unique(profile_id, match_id)` para impedir duplicados.

### `bonus_predictions`

Pronósticos especiales por perfil, por ejemplo campeón y subcampeón.

Restricción importante:
- `unique(profile_id)` para permitir solo una fila por usuario.

### `rankings_cache`

Cache de rankings precalculados para lectura rápida por tipo y alcance.

## Relaciones principales

- `profiles.id -> auth.users.id`
- `promoters.profile_id -> profiles.id`
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

### Lectura autenticada propia

Se permite que usuarios autenticados lean solo sus propios registros en:

- `profiles`
- `participations`
- `predictions`

### Escritura autenticada propia

Se permite que usuarios autenticados inserten y actualicen solo sus propias filas en:

- `predictions`

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

Y solo para promotores activos.

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
- Los grants de la vista pública de promotores se endurecen en una migración correctiva separada para sincronizar repo y base real.

## Próximos pasos sugeridos

1. Agregar políticas adicionales cuando se definan administración y lectura privada de owners en grupos/comunidades no públicas.
2. Crear migraciones siguientes para vistas, funciones o materialización de rankings.
3. Recién después conectar este esquema con auth y UI.
