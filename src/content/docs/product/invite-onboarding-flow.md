---
title: "Onboarding contextual por invitación"
description: "Flujo corto de entrada por promoter o Team social antes de activar el Pase."
lastUpdated: "2026-06-07"
---

# Onboarding contextual por invitación

Estado activo: implementado en Fase 3.

## Objetivo

Reducir fricción cuando un usuario entra por:

- link de promoter: `/?p=CODE`
- link de Team social existente: `/groups?code=INVITE`

La idea no es cerrar el onboarding completo ahí, sino detectar contexto, pedir el nick mínimo y seguir directo a `/activar-pase`.

## Superficies activas

- `/?p=CODE`
- `/groups?code=INVITE`
- `/entrar`
- `POST /api/onboarding/complete-invite`

## Reglas activas

- Si entra un invitado sin sesión por `p` o `code`, se redirige inmediatamente a `/login?next=...`.
- Si vuelve con sesión y sigue habiendo contexto de invitación, se deriva a `/entrar`.
- `/entrar` es una pantalla corta:
  - nick requerido
  - promoter detectado si vino por link de promoter
  - Team detectado si vino por link de capitán / group invite
  - CTA único: continuar y activar el Pase
- Al enviar el form:
  - se guarda `profiles.public_alias`
  - `participations.promoter_id` solo se completa si todavía está vacío
  - `participations.group_id` se completa si el usuario aceptó el Team detectado
  - si el usuario no está `paid`, el siguiente paso es `/activar-pase`

## Fuente de verdad y límites

- `participations.promoter_id` tiene prioridad sobre cualquier inferencia futura.
- `groups` sigue siendo el Team social.
- `teams` sigue siendo fixture.
- No se toca `communities`.
- No se agrega tabla nueva para invitaciones.

## Fallback de promoter en Team invite

`groups` no tiene `promoter_id` propio en schema hoy.

Mientras eso siga así, el flujo puede derivar promoter fallback desde:

- `groups.owner_profile_id`
- `promoters.profile_id`

Ese fallback solo se usa si la participación todavía no tiene `promoter_id`.

## Archivos principales

- `src/app/page.tsx`
- `src/app/groups/page.tsx`
- `src/app/entrar/page.tsx`
- `src/app/api/onboarding/complete-invite/route.ts`
- `src/lib/invite-flow.ts`
- `src/lib/invite-flow-server.ts`
- `src/lib/player/profile-setup.ts`

## QA mínima esperada

- guest `/?p=CODE` → `/login?next=...`
- guest `/groups?code=INVITE` → `/login?next=...`
- member `/?p=CODE` → `/entrar?p=CODE`
- member `/groups?code=INVITE` → `/entrar?group=INVITE`
- submit exitoso → `/activar-pase`
- promoter detectado persiste `participations.promoter_id`
- Team detectado persiste `participations.group_id`
