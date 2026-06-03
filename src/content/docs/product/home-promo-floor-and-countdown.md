---
title: "Home promo floor and countdown"
description: "Reglas activas de Home para pozo inicial, jugadores y countdown promocional."
lastUpdated: "2026-06-03"
---

# Home promo floor and countdown

## Objetivo

Mantener la Home como landing de conversión con tono competitivo, sin inventar métricas en vivo ni atar el countdown a cada usuario.

## Reglas activas

- `Pozo inicial` visible con piso de `300000 ARS`.
- `Jugadores` visible con piso de `60`.
- Si existen datos reales mayores, la Home muestra esos valores.
- Si no existen datos reales o son menores, la Home mantiene el piso comercial.
- No usar copy de tiempo real falso.

## Fuente de verdad técnica

- Helper: `src/lib/product/home-display.ts`
- Constantes:
  - `INITIAL_PRIZE_POOL_ARS = 300000`
  - `INITIAL_PLAYERS_COUNT = 60`

## Countdown promocional

- Config centralizada: `src/lib/product/promo-campaign.ts`
- Variable opcional: `NEXT_PUBLIC_PROMO_END_AT`
- Fallback actual del repo: `2026-06-06T23:59:59-03:00`
- El formato visible es `72h 00m 00s`.
- Cuando llega a cero, muestra `Precio promocional finalizado`.

## Alcance confirmado

- Solo Home y helpers visuales/producto.
- Sin cambios en pagos server-side, Mercado Pago backend, schema Supabase, scoring, rankings, fixture, grupos, Admin, Dashboard o Matches.
