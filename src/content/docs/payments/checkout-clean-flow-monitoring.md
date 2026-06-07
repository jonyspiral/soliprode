---
title: "Checkout Clean Flow Monitoring"
description: "Runbook operativo para monitorear el flujo corto de activación con Mercado Pago después del lanzamiento."
lastUpdated: "2026-06-07"
---

# Checkout Clean Flow Monitoring

Objetivo: medir el rendimiento real del flujo corto `login -> /activar-pase -> Checkout Pro -> webhook/sync -> paid` antes de abrir caminos alternativos como transferencia manual.

## Regla de producto vigente

- no agregar transferencia manual todavía;
- primero medir este checkout limpio con tráfico real;
- el indicador principal es bajar `Registrados sin Pase`.

## Fuente de verdad

- jugador activo: `participations.payment_status = 'paid'`
- recaudación confirmada: `SUM(participations.entry_price)` solo de participaciones `paid`
- trazabilidad de checkout: `payment_attempts`

## Qué mirar todos los días

### 1. Conversión principal

- `Registrados`
- `Sin Pase`
- `Pagos pendientes`
- `Jugadores activos`
- `Conversión registro -> Pase activo`
- `Recaudación confirmada`

Superficie recomendada:

- `/admin`

## Cómo leer esos números

### Señal sana

- `Sin Pase` baja o se mantiene estable con crecimiento de registrados
- `Jugadores activos` sube
- `Conversión` sube o se sostiene
- `Pagos pendientes` no se acumula más de lo razonable

### Señal de fricción

- sube `Registrados` pero `Sin Pase` también sube
- `payment_started` crece más rápido que `paid`
- `Pagos pendientes` se estanca durante horas
- la recaudación no acompaña el crecimiento de registrados

## Corte operativo mínimo

### Cada mañana

1. Revisar `/admin`.
2. Comparar `Sin Pase`, `Pagos pendientes`, `Jugadores activos` y `Recaudado` contra el día anterior.
3. Si `Pagos pendientes` sube, revisar webhook y sync antes de tocar UI o copy.

### Cada tarde

1. Revisar otra vez `/admin`.
2. Confirmar que los intentos nuevos están llegando a `payment_attempts`.
3. Confirmar que los `approved` terminan en `participations.payment_status = 'paid'`.

## Diagnóstico rápido por síntoma

### Muchos `Sin Pase`

Mirar:

- `/activar-pase`
- CTA sticky
- login con `next=/activar-pase`
- `payment_attempts.status`

Lectura:

- si casi no hay `payment_attempts`, la fricción está antes del checkout
- si hay muchos `payment_started` pero pocos `paid`, la fricción está dentro o después del checkout

### Muchos `Pagos pendientes`

Mirar:

- webhook de Mercado Pago
- `/api/payments/mercadopago/reconcile-payment`
- `payment_attempts.status`

Lectura:

- si el provider todavía informa `pending` o `in_process`, no tocar activación
- si el provider ya aprobó y la participación no pasó a `paid`, revisar sync/webhook

### Muchos `payment_started` y pocos `paid`

Mirar:

- abandono real en Checkout Pro
- medios de pago ofrecidos por Mercado Pago
- retornos `success` / `pending` / `failure`

Lectura:

- no asumir bug de backend de entrada
- primero separar abandono de usuario vs falla de confirmación

## Queries manuales recomendadas

### Estado principal por participación

```sql
select
  payment_status,
  count(*) as total
from participations
group by payment_status
order by total desc;
```

### Intentos recientes de checkout

```sql
select
  created_at,
  status,
  amount,
  external_reference,
  provider_payment_id,
  provider_preference_id
from payment_attempts
where provider = 'mercadopago'
order by created_at desc
limit 50;
```

### Recaudación confirmada

```sql
select
  coalesce(sum(entry_price), 0) as confirmed_revenue_ars
from participations
where payment_status = 'paid';
```

### Conversión simple

```sql
select
  count(*) as registered,
  count(*) filter (where payment_status = 'paid') as active,
  count(*) filter (where payment_status in ('payment_started', 'payment_pending', 'manual_review')) as pending_like,
  count(*) filter (where payment_status <> 'paid') as without_pass
from participations;
```

## Pendientes externos todavía abiertos

No bloquean la aprobación funcional del slice, pero siguen pendientes:

- webhook `pending` real de Mercado Pago
- consentimiento real de Google
- pago sandbox/manual completo en Checkout Pro

## Qué no hacer todavía

- no sumar transferencia manual por ansiedad operativa
- no cambiar la fuente de verdad de `participations`
- no activar `paid` desde retornos del navegador
- no abrir dashboards paralelos que contradigan `/admin`

