---
title: "Scoring Hotfix Operativo"
description: "Hotfix transicional para alimentar el ranking de SoliProde con partidos ya iniciados."
lastUpdated: "2026-06-11"
---

# Scoring Hotfix Operativo

Este hotfix usa `predictions.points` y `rankings_cache` existentes para alimentar el ranking urgente con partidos ya iniciados.

## Qué resuelve

- permite publicar resultados oficiales de fase regular desde Admin;
- recalcula `predictions.points` con la regla actual `5/3/0`;
- reconstruye `rankings_cache` con `ranking_type = 'general'`;
- deja el ranking de Teams leyendo el ranking general con configuración centralizada.

## Alcance actual

- scoring de partidos de fase regular;
- rebuild operativo para partidos `finished`;
- ranking individual desde `rankings_cache`;
- ranking de Teams con:
  - `TEAM_MIN_ACTIVE_PLAYERS = 7`
  - `TEAM_SCORING_MAX_PLAYERS = 11`

## Límites explícitos

Este hotfix no implementa todavía:

- ledger completo de scoring;
- KO / clasificado / penales;
- pronósticos especiales;
- mediana para ingreso tardío;
- desempates finales;
- modelo definitivo de trazabilidad por partido.

## Deuda técnica conocida

- `predictions.points` sigue siendo storage legacy/transicional;
- `rankings_cache` sigue siendo cache reconstruida, no ledger;
- la implementación definitiva debe migrar a:
  - `prediction_scores`
  - `special_prediction_scores`

## Regla de Teams en este hotfix

- un Team compite si tiene al menos `7` Jugadores activos;
- el puntaje del Team suma como máximo los mejores `11` Jugadores activos;
- si tiene entre `7` y `11` activos, suma todos;
- si tiene más de `11`, suma solo los mejores `11`.
