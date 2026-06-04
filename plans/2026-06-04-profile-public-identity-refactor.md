---
title: "Refactor de Perfil e identidad publica de juego"
description: "Separar participacion de juego y datos de cuenta, y alinear nick publico entre Profile, Ranking y Team."
lastUpdated: "2026-06-04"
---

# Refactor de Perfil e identidad publica de juego

Estado: ACTIVO
Prioridad: P1
Próxima acción: implementar helpers compartidos de identidad pública, refactorizar `/profile` y revalidar `Profile`, `Ranking`, `Dashboard` y `Team`.
Criterio de cierre: Profile muestra `Mi participación`, `Perfil de juego` y `Datos de cuenta`; `public_alias` queda tratado como nick de juego editable; la identidad pública se alinea en Profile, Ranking y Team sin tocar communities, pagos ni promoters.

## Contexto

La pantalla `Profile` actual mezcla identidad de juego con datos administrativos y usa copy ambiguo (`Tu cuenta` / `Cuenta`).

Además, la identidad pública del jugador vive hoy en `profiles.public_alias`, pero la UI no la trata de forma consistente como nick de juego.

## Alcance

- `src/app/profile/`
- `src/app/rankings/page.tsx`
- `src/lib/groups/competition.ts`
- `src/lib/home/player-hero-state.ts`
- `src/app/dashboard/page.tsx`
- helpers compartidos nuevos en `src/lib/`
- documentación viva e índice de planes

## Reglas activas

- `groups` sigue siendo el Team social.
- `teams` sigue siendo fixture del Mundial.
- No tocar `communities`.
- No tocar lógica real de pagos ni Promoters.
- Reutilizar `profiles.public_alias` como nick público salvo que una necesidad real obligue migración nueva.

## Implementación propuesta

1. Crear helpers de identidad pública y estado de participación para evitar lógica duplicada.
2. Refactorizar `/profile` a una pantalla mobile-first con card principal, avatar/fallback, CTA contextual y formularios de edición para nick y WhatsApp.
3. Reusar el helper de identidad pública en Ranking, Team y resúmenes donde el jugador aparece con nombre visible.
4. Actualizar la documentación mínima para dejar el contrato redescubrible.

## Verificación

- `npm run lint`
- `npm run build`
- chequeo manual de `/profile`, `/rankings`, `/groups` y `/dashboard`
