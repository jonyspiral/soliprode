---
title: "Roadmap - Notificaciones PWA"
description: "Roadmap futuro para notificaciones PWA, email y WhatsApp en SoliProde."
lastUpdated: "2026-06-03"
---

# Roadmap - Notificaciones PWA

## Decisión

Las notificaciones quedan como feature de fase 2.

Primero SoliProde debe completar:

- fixture real cargado;
- carga de pronósticos;
- pago con Mercado Pago funcionando;
- activación paid confiable;
- ranking individual;
- ranking de grupos;
- Admin operativo para partidos y resultados.

Después se evaluará implementar notificaciones.

## Canales posibles

### Push PWA

Requiere:

- manifest PWA;
- service worker;
- Push API;
- pedir permiso al usuario;
- guardar suscripciones push;
- VAPID keys o proveedor equivalente;
- considerar soporte en iPhone para web app agregada a pantalla de inicio.

### Email

Más simple para MVP extendido.

Útil para:

- recordar cierre de pronósticos;
- pagos pendientes;
- resultados.

### WhatsApp

Potente para conversión y viralidad.

Requiere revisar:

- costos;
- plantillas;
- reglas de WhatsApp Business.

## Casos de uso futuros

- Recordatorio antes de que cierre un partido.
- "Hoy juega Argentina, cargá tus pronósticos."
- Aviso de partido cerrado.
- Aviso de resultado cargado.
- Aviso de puntos sumados.
- Aviso de cambio en ranking individual.
- Aviso de cambio en ranking de grupo.
- Recordatorio para terminar inscripción.
- Invitación a completar equipo de 11.

## Modelo futuro sugerido

### Tabla futura: `push_subscriptions`

Campos posibles:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid references auth.users(id) on delete cascade`
- `endpoint text not null`
- `p256dh text not null`
- `auth text not null`
- `user_agent text`
- `created_at timestamptz default now()`
- `revoked_at timestamptz`

### Tabla futura opcional: `notification_events`

Campos posibles:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid references auth.users(id)`
- `event_type text not null`
- `payload jsonb`
- `channel text not null`
- `status text not null`
- `scheduled_at timestamptz`
- `sent_at timestamptz`
- `created_at timestamptz default now()`

## Regla de prioridad

No implementar notificaciones antes de que el juego principal esté sólido.

Orden recomendado:

1. Fixture.
2. Pronósticos.
3. Pago.
4. Activación paid.
5. Ranking.
6. Grupos.
7. Admin.
8. Notificaciones.

## Copy futuro posible

- Activá notificaciones para que no se te pase ningún partido.
- Falta poco para que cierre el pronóstico.
- Ya cargamos el resultado. Mirá cuántos puntos sumaste.
- Tu grupo subió en el ranking.
- Terminá tu inscripción para competir por premios.

## Fuera de alcance actual

Este roadmap no habilita implementación inmediata.

No tocar todavía:

- push;
- service worker;
- manifest;
- backend de notificaciones;
- Supabase para suscripciones;
- proveedores externos;
- UI de permisos.
