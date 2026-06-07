---
title: "Prompt social post-pago"
description: "Gate corto después de confirmar el Pase para decidir si el usuario quiere armar un Team."
lastUpdated: "2026-06-07"
---

# Prompt social post-pago

Estado activo: implementado en Fase 4.

## Objetivo

Después de confirmar `payment_status = 'paid'`, el usuario no siempre tiene Team social.

En vez de dejarlo caer directo a una pantalla neutra, se consulta una sola vez si quiere armar un Team.

## Superficie activa

- `/despues-del-pago`

## Regla server-side

- si no hay sesión: `/login?next=/despues-del-pago`
- si la participación actual no está `paid`: `/activar-pase`
- si la participación actual está `paid` y ya tiene `group_id`: `/dashboard`
- si la participación actual está `paid` y no tiene `group_id`: mostrar prompt

## Copy activo

- título: `¿Querés armar un Team?`
- texto: `Invitá a tus amigos, compañeros o familia y compitan juntos por la gloria.`
- CTA primaria: `Quiero`
- CTA secundaria: `No quiero`

## Destinos

- `Quiero` → `/groups`
- `No quiero` → `/dashboard`

## Integración con retornos de pago

`/pago/*` y `/payment/*` no muestran este prompt por query params.

Solo derivan a `/despues-del-pago` cuando ya existe confirmación real:

- sync aprobado
- o participación actual ya `paid`

## Límites

- no toca webhook
- no toca `communities`
- no cambia la fuente de verdad: sigue siendo `participations.payment_status = 'paid'`
- si el usuario ya quedó asociado a un `group` desde onboarding por invitación, no ve prompt y va directo al panel
