---
title: "Fixture Import"
description: "Importacion controlada de equipos y partidos reales del Mundial hacia Supabase."
lastUpdated: "2026-06-03"
---

# Fixture Import

Estado: preparado para carga real, pero sin datos incluidos en el repo.

## Regla base

Los partidos viven en Supabase, no en Markdown.

El CSV es solo el vehiculo de carga.

No usar este flujo para:

- inventar fixture;
- inventar equipos;
- inventar horarios;
- cargar demos tipo ARG vs BRA;
- probar con datos falsos en produccion.

## Archivos del flujo

- Importador: `scripts/fixture/import-fixture.mjs`
- Template: `scripts/fixture/worldcup-2026-group-stage.template.csv`

## Formato del CSV

Columnas obligatorias:

- `match_number`
- `stage`
- `round_name`
- `group_code`
- `group_position_home`
- `group_position_away`
- `home_team_name`
- `home_short_name`
- `home_fifa_code`
- `home_country_code`
- `home_flag_emoji`
- `away_team_name`
- `away_short_name`
- `away_fifa_code`
- `away_country_code`
- `away_flag_emoji`
- `starts_at`
- `prediction_closes_at`
- `venue`
- `city`
- `status`

Reglas del importador:

- `stage` debe ser `group_stage`.
- `round_name` debe ser `Fase de grupos`.
- `group_code` debe estar entre `A` y `L`.
- `starts_at` y `prediction_closes_at` deben ser ISO valido.
- `prediction_closes_at` debe ser menor o igual a `starts_at`.
- `status` inicial debe ser `scheduled`.
- local y visitante no pueden ser el mismo equipo.
- ambos equipos deben tener `flag_emoji`.
- ambos equipos deben tener `country_code` ISO alpha-2.
- no se permiten filas sin fecha u horario.
- no se permiten partidos sin grupo en fase de grupos.
- no se permiten duplicados por `match_number`.
- no se permiten duelos duplicados dentro del mismo grupo.
- no se permiten mas de 6 partidos por grupo.
- cada grupo debe traer exactamente 4 equipos y 6 partidos en el archivo.

## Como se guardan los datos

Equipos:

- upsert por `fifa_code`
- se guardan con `flag_emoji` para MVP
- `group_code` y `group_position` salen del CSV

Partidos:

- upsert por `match_number`
- se completan `group_code`, `starts_at`, `prediction_closes_at`, `venue`, `city`, `status`
- tambien se mantienen los aliases compatibles con la UI actual

El import no toca:

- resultados;
- pronosticos;
- rankings;
- scoring;
- pagos.

## Ejecucion

Dry-run de validacion:

```bash
node scripts/fixture/import-fixture.mjs --file scripts/fixture/worldcup-2026-group-stage.template.csv
```

Import real:

```bash
node scripts/fixture/import-fixture.mjs --file <ruta-al-csv-real> --apply --confirm-write
```

Regla de seguridad:

- sin `--apply --confirm-write`, el script no escribe;
- primero valida todo el archivo;
- si hay errores de validacion, aborta antes de escribir.

## Fuente de horarios

Las fechas y horarios deben venir de fuente oficial o verificada.

Se guardan como `timestamptz` en Supabase.

La UI mostrara horario local del usuario, pero la base debe guardar horario consistente y oficial.

## Equipos y grupos

- los equipos se separan por grupo o zona `A-L`;
- se usan `flag_emoji` para MVP;
- no se requieren assets externos de banderas en esta etapa.

## Admin visual

El Admin visual para cargar fixture queda para una etapa posterior.

Este documento solo deja listo el flujo de import controlado mientras la carga siga siendo operativa y manual.

## Recomendacion operativa

Antes de correr el import real:

1. validar el CSV contra fuente oficial;
2. correr dry-run;
3. revisar resumen de equipos y partidos creados o actualizados;
4. recien despues ejecutar `--apply --confirm-write`.
