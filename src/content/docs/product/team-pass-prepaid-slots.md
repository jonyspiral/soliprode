---
title: "Pase de equipo / cupos prepagos"
description: "Contrato operativo para comprar, reclamar y visualizar cupos prepagos de Team sin bots."
lastUpdated: "2026-06-13"
---

# Pase de equipo / cupos prepagos

## Objetivo

Permitir que un Capitán compre varios cupos prepagos para su Team sin crear bots, perfiles automáticos ni jugadores ficticios.

## Reglas activas

- Un Capitán puede comprar `N` cupos para su Team.
- La compra aprobada genera invitaciones prepagas pendientes.
- Un cupo pendiente no crea jugador real.
- Un cupo pendiente no pronostica.
- Un cupo pendiente no suma puntos.
- Un cupo pendiente no aparece como Jugador activo.
- Cada cupo se activa solo cuando una cuenta real lo reclama.
- Al reclamarlo, la cuenta real queda `paid` y asociada al `group_id` del Team comprador.
- El ranking individual y de Teams sigue sumando solo jugadores reales con `payment_status = 'paid'`.

## Fuente de verdad

| Concepto | Fuente |
|---|---|
| Jugador activo real | `participations.payment_status = 'paid'` |
| Pertenencia real al Team | `participations.group_id` |
| Compra agregada de cupos | `team_passes` |
| Invitaciones prepagas individuales | `team_invites` |
| Intento de checkout | `payment_attempts` |

## Modelo nuevo

### `team_passes`

- una fila por compra aprobada de cupos;
- referencia al Team, al Capitán comprador y al `payment_attempt`;
- guarda `total_slots`, `used_slots` y `status`.

### `team_invites`

- una fila por cupo prepago individual;
- guarda código, Team, comprador, usuario que reclamó y timestamps;
- estados:
  - `pending`
  - `claimed`
  - `expired`

## Checkout

- El checkout individual existente sigue vivo.
- El pase de equipo usa un checkout paralelo:
  - `POST /api/payments/mercadopago/create-team-pass-preference`
- `payment_attempts` ahora distingue:
  - `checkout_kind = 'individual_pass'`
  - `checkout_kind = 'team_pass'`
- Para `team_pass`, el intento también guarda:
  - `team_slots_quantity`
  - `target_group_id`

## Aprobación server-side

Cuando Mercado Pago confirma un `payment_attempt` con `checkout_kind = 'team_pass'`:

1. no se crean bots;
2. no se crean participaciones nuevas;
3. se crea una fila en `team_passes`;
4. se crean `N` filas `team_invites` con códigos únicos;
5. el Capitán ve esos links/códigos en `/groups`.

## Claim de cupo prepago

Cuando un usuario autenticado reclama un código `slot` válido:

1. se valida que el cupo siga `pending`;
2. se toma la participación principal real del usuario;
3. si ya está `paid`, no consume el cupo;
4. si no está `paid`, su `participation` pasa a:
   - `payment_status = 'paid'`
   - `payment_provider = 'team_pass'`
   - `group_id = team_id del invite`
5. el invite pasa a `claimed`;
6. se recalcula `used_slots` del `team_pass`.

## UI activa

### Capitán en `/groups`

- ve resumen de:
  - `Pases comprados`
  - `Cupos usados`
  - `Jugadores activos`
  - `Cupos disponibles`
- puede abrir checkout para comprar cupos;
- puede copiar o compartir links de invitación pendientes.

### Invitado con cupo prepago

- entra por `/groups?slot=CODE`;
- si no tiene sesión, pasa por login;
- si no está `paid`, puede reclamar su cupo prepago;
- no vuelve al flujo normal de pago para ese cupo.

### Admin

- ve resumen de compras, usados y pendientes en `/admin`.

## Restricciones explícitas

- No crear bots.
- No crear perfiles automáticos.
- No sumar puntos con cupos vacíos.
- No alterar scoring por fuera del uso normal de `participations.payment_status = 'paid'`.
- No reemplazar el checkout individual.

## Nota operativa de Supabase

Si el proyecto tiene activado el modelo nuevo de Data API donde las tablas nuevas no quedan expuestas automáticamente, `team_passes` y `team_invites` pueden requerir habilitación explícita en Data API además de sus `GRANT` y RLS.
