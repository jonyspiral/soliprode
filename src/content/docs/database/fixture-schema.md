---
title: "Fixture Schema"
description: "Estructura de base para equipos, partidos, pronosticos y administracion del fixture real de SoliProde."
lastUpdated: "2026-06-03"
---

# Fixture Schema

Estado: estructura preparada para fixture real sin seed data, sin partidos falsos y sin horarios inventados.

Migracion principal:

- `supabase/migrations/009_fixture_schema_hardening.sql`

## Objetivo

Dejar Supabase listo para operar el Mundial con:

- equipos por grupo o zona;
- partidos con fecha, horario y cierre de pronostico;
- pronosticos por usuario;
- resultados publicados por admin;
- RLS para lectura publica, escritura propia y escritura admin;
- compatibilidad con scoring y ranking oficial actuales.

## Equipos

Tabla: `public.teams`

El proyecto ya tenia `teams` con `name`, `code` y `flag_url`. La migracion mantiene esos campos y agrega el contrato operativo:

- `short_name`
- `fifa_code`
- `country_code`
- `flag_emoji`
- `group_code`
- `group_position`
- `updated_at`

Reglas:

- `country_code` debe ser ISO alpha-2 en mayusculas.
- `fifa_code` queda como codigo deportivo FIFA.
- `group_code` acepta `A` a `L`.
- `flag_emoji` es la fuente MVP para bandera; no se requieren assets externos.
- No se carga ningun equipo real desde la migracion.

## Partidos

Tabla: `public.matches`

El proyecto ya tenia `matches` con `phase`, `group_name`, `starts_at`, `status`, `score_home` y `score_away`. La migracion conserva esos campos y agrega:

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

Decisiones de compatibilidad:

- `score_home` y `score_away` siguen siendo los campos que usa el scoring actual.
- `home_score` y `away_score` quedan como aliases sincronizados por trigger.
- `phase` y `group_name` siguen disponibles para UI existente.
- `round_name`, `stage` y `group_code` quedan como contrato nuevo para fixture real.

Reglas:

- `starts_at` es obligatorio y se guarda como `timestamptz`.
- `prediction_closes_at` es obligatorio y se guarda como `timestamptz`.
- Si no se define otro cierre, `prediction_closes_at` puede ser igual a `starts_at`.
- `status` contempla `scheduled`, `closed`, `live`, `finished` y `cancelled`.
- Se conserva `live` por compatibilidad con la UI actual.
- Para fase de grupos, usar `stage = 'group_stage'`; en ese caso `group_code` es obligatorio.
- No se permite `home_team_id = away_team_id`.
- Los scores deben ser enteros no negativos cuando existan.
- No se carga fixture desde la migracion.

## Pronosticos

Tabla: `public.predictions`

El contrato actual del proyecto usa:

- `profile_id`
- `match_id`
- `predicted_home`
- `predicted_away`
- `points`
- `locked_at`

La migracion agrega aliases sincronizados para el contrato futuro:

- `user_id`
- `predicted_home_score`
- `predicted_away_score`

Decision:

- `profile_id` sigue siendo la fuente canonica de la app porque `profiles.id` referencia `auth.users.id` y todo el scoring actual depende de ese campo.
- `user_id` queda sincronizado con `profile_id` para compatibilidad futura.
- No se agrega `is_official`: la oficialidad se deriva de `participations.payment_status`, `eligible_from` y la logica actual de ranking/scoring. Duplicarla en `predictions` crearia otra fuente de verdad.

Reglas:

- Un usuario solo puede tener un pronostico por partido.
- Se mantiene `unique(profile_id, match_id)`.
- Se agrega `unique(user_id, match_id)`.
- Los scores pronosticados deben ser enteros no negativos.
- Usuarios no pagos pueden guardar pronosticos.
- Usuarios no pagos no rankean oficialmente porque el ranking general filtra `participations.payment_status = 'paid'`.

## Cierre de pronosticos

Regla critica protegida server-side por RLS:

- solo se puede insertar, actualizar o borrar un pronostico si el usuario es dueno de la fila;
- el partido debe tener `status = 'scheduled'`;
- `now() < matches.prediction_closes_at`.

Esto evita depender de la UI para bloquear el cierre.

## Resultados

Decision: no se crea `match_results` por ahora.

Motivo:

- el scoring actual publica resultados directamente en `matches.score_home`, `matches.score_away` y `matches.status = 'finished'`;
- crear `match_results` ahora duplicaria la fuente de verdad;
- `home_score` y `away_score` quedan sincronizados como aliases para futuras integraciones.

Si en una etapa futura se requiere auditoria avanzada de carga de resultados, se puede crear `match_results` con `loaded_by`, `loaded_at` y `locked`.

## RLS y permisos

RLS queda activo en:

- `teams`
- `matches`
- `predictions`

Lectura:

- `teams`: lectura publica.
- `matches`: lectura publica.
- `predictions`: lectura propia autenticada.

Escritura:

- `teams`: escritura admin.
- `matches`: escritura admin.
- `predictions`: escritura propia antes del cierre.
- `predictions`: admin puede gestionar filas si corresponde.

Fuente de admin:

- `profiles.role = 'admin'`.

Las acciones administrativas del frontend siguen obligadas a verificar admin server-side antes de usar `service_role`.

## Grupos A-L y etapa futura

La base ya permite grupos `A` a `L` en equipos y partidos.

Queda pendiente para otra etapa:

- cargar fixture real;
- calcular standings de fase de grupos;
- puntos de tabla;
- diferencia de gol;
- mejores terceros;
- rondas finales;
- bracket automatico.

No se implementa bracket automatico en esta migracion.

## Admin visual pendiente

La base queda lista para que Admin pueda operar:

- listar equipos;
- crear y editar equipos;
- listar partidos;
- filtrar por grupo;
- crear y editar partidos;
- cargar resultado;
- cerrar partido;
- marcar partido finalizado;
- recalcular ranking desde las acciones existentes.

Pendiente: construir o ajustar la UI admin operativa para equipos y fixture real.
