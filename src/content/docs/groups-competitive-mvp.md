---
title: "Grupos competitivos MVP"
description: "Reglas y superficie técnica de la Épica D para grupos competitivos en SoliProde."
lastUpdated: "2026-06-02"
---

# Grupos competitivos MVP

Estado: implementado como segunda competencia del MVP, sin comunidades.

## Alcance de esta etapa

- Crear grupo desde `/groups`.
- Unirse a grupo con `invite_code` o link corto.
- Persistir un único grupo por jugador usando `participations.group_id`.
- Mostrar grupo principal actual.
- Exponer ranking interno del grupo.
- Marcar `DT del grupo`.
- Exponer ranking de grupos por promedio.
- Distinguir `preview` vs `habilitado` con regla de `11+` activos.

## Decisiones activas

- En este MVP, un jugador soporta un solo grupo.
- Ese grupo único equivale al grupo principal.
- Unirse al último grupo reemplaza el grupo principal anterior.
- `DT del grupo` = jugador `paid` con más puntos oficiales dentro del grupo.
- El ranking interno usa solo miembros `paid`.
- Los miembros pendientes siguen visibles para mostrar grupos en formación.
- El ranking de grupos promedia solo puntos oficiales de miembros `paid`.
- `11+` activos/pagos = grupo habilitado para competencia oficial.

## Fuente de verdad

- Pertenencia al grupo principal: `participations.group_id`
- Datos del grupo: `groups`
- Puntos oficiales del jugador: `rankings_cache` con `ranking_type = 'general'`

No se agregó una tabla nueva de membresías ni una cache separada de ranking grupal en esta etapa.

## Superficie implementada

| Archivo | Rol |
|---|---|
| `src/app/groups/page.tsx` | UI principal de grupos, ranking interno y ranking de grupos |
| `src/app/groups/actions.ts` | Server actions para crear grupo y unirse con código |
| `src/lib/groups/competition.ts` | Lectura agregada de miembros, DT y leaderboard grupal |

## Reglas visibles del producto

- Si el usuario no tiene grupo, ve estado vacío y CTA para crear o unirse.
- Si crea un grupo, ese grupo queda como principal automáticamente.
- Si entra con código a otro grupo, ese nuevo grupo pasa a ser principal.
- Si no está `paid`, puede pertenecer al grupo pero todavía no suma en la tabla oficial.
- Si el grupo tiene menos de `11` activos, aparece como `preview`.
- Si llega a `11` o más activos, aparece como `habilitado`.

## Fuera de alcance preservado

- Comunidades
- Bonus predictions
- Premio grupal avanzado
- Liquidación de promotores
- Cambios extra de auth
- Cambios extra de pagos salvo bug bloqueante
