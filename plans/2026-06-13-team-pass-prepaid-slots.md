# Plan — Pase de equipo / cupos prepagos

Fecha: 2026-06-13
Estado: ACTIVO
Prioridad: P0
Área: Teams / pagos / admin

## Objetivo

Permitir que un capitán compre varios cupos prepagos para su Team sin crear bots ni jugadores automáticos.

## Reglas activas

- `participations.payment_status = 'paid'` sigue definiendo `Jugador activo`.
- Un cupo prepago sin reclamar no crea perfil, no pronostica y no suma puntos.
- El ranking individual y de Teams sigue derivando solo de jugadores reales activos.
- `participations.group_id` sigue siendo la pertenencia real al Team.
- Mercado Pago individual no se reemplaza; el pase de equipo agrega un checkout paralelo con metadata explícita.

## Superficie a tocar

- Nuevas tablas para pases de equipo e invitaciones prepagas.
- Metadata nueva sobre `payment_attempts` para distinguir checkout individual vs team pass.
- Runtime de pagos para crear checkout de team pass y finalizarlo server-side al aprobarse.
- Claim flow autenticado para activar un cupo prepago sobre una cuenta real.
- UI en `/groups` para capitán.
- Resumen operativo en `/admin`.
- Documentación de la nueva regla.

## Fuera de alcance

- Bots o perfiles automáticos.
- Refactor grande de auth.
- Reemplazo del checkout individual.
- Cambios de scoring o ranking fuera del consumo normal de `paid`.
- Cambios de Mercado Pago fuera del metadata y la nueva preferencia de team pass.

## Verificación

- `npm run lint`
- `npm run build -- --webpack`
- Validación manual de tipos y rutas

## Criterio de cierre

- Capitán puede iniciar checkout de cupos para su Team.
- La aprobación crea cupos prepagos pendientes sin crear jugadores.
- Un usuario real autenticado puede reclamar un cupo y quedar `paid` + asociado al Team.
- `/groups` muestra comprados/usados/pendientes e invitaciones.
- `/admin` muestra resumen operativo de pases de equipo.
