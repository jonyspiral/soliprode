---
title: "Mercado Pago Production Checklist"
description: "Checklist operativo para habilitar y verificar el checkout online real de SoliProde en producción."
lastUpdated: "2026-06-03"
---

# Mercado Pago Production Checklist

Objetivo: dejar explícito qué falta para que el CTA `Completar inscripción` abra el checkout real en producción sin adivinar si el problema es UI, sesión o backend.

## Estado real al 2026-06-03

Hallazgo confirmado:

- `https://www.soliprode.com/api/payments/mercadopago/create-preference` respondió `503`
- payload:

```json
{
  "ok": false,
  "error": "El pago online todavia no esta configurado."
}
```

Conclusión:

- el botón `Completar inscripción` sí llega al backend;
- la sesión del usuario QA no era el problema;
- la route falla antes de crear `payment_attempt`;
- la causa operativa actual es falta de configuración server-side para Mercado Pago en producción.

## Qué usa hoy el backend

Archivo relevante:

```text
src/app/api/payments/mercadopago/create-preference/route.ts
```

La route hace este gate:

- si no existe `MERCADOPAGO_ACCESS_TOKEN`, devuelve `503`;
- si no hay usuario logueado, devuelve `401`;
- si existe participación y el token está configurado, crea `payment_attempt` y preferencia de Mercado Pago.

## Variables necesarias en producción

### Obligatorias

```text
NEXT_PUBLIC_BASE_URL
MERCADOPAGO_ACCESS_TOKEN
```

### Recomendadas / operativas

```text
MERCADOPAGO_WEBHOOK_SECRET
```

## Valores y rutas esperadas

### Dominio base

```text
NEXT_PUBLIC_BASE_URL=https://www.soliprode.com
```

### Webhook

Derivado por código:

```text
https://www.soliprode.com/api/payments/mercadopago/webhook
```

### Retornos de checkout

Derivados por código:

```text
https://www.soliprode.com/payment/success
https://www.soliprode.com/payment/pending
https://www.soliprode.com/payment/failure
```

La app agrega `external_reference` por query param, pero eso no activa `paid` por sí solo.

## Regla de verdad

No marcar `paid` desde:

- `success`
- `pending`
- `failure`
- query params del navegador

La fuente de verdad sigue siendo:

- webhook de Mercado Pago;
- o verificación server-side contra `payment_attempts` / provider.

## Qué validar cuando se carguen envs productivas

### 1. Usuario QA `nonpaid`

- login;
- entrar a `/matches`;
- click en `Completar inscripción`;
- confirmar que ya no aparece el `503`;
- confirmar redirección a checkout de Mercado Pago;
- confirmar creación de `payment_attempt`.

### 2. Persistencia backend

Verificar en Supabase:

- `payment_attempts` recibe una fila nueva;
- `provider = 'mercadopago'`;
- `status = 'created'` y luego `payment_started`;
- `external_reference` no se repite;
- `participations.payment_status` pasa como máximo a `payment_started` o `payment_pending`, nunca a `paid` por el cliente.

### 3. Retornos

- `success` no debe activar `paid` si no hay confirmación real;
- `pending` no debe activar `paid`;
- `failure` no debe activar `paid`.

### 4. Activación real

Solo queda aprobada cuando:

- el webhook confirma;
- o la verificación server-side confirma `approved`.

## Comprobación rápida recomendada

### Desde browser

- usuario QA `nonpaid`;
- `/matches`;
- click en `Completar inscripción`;
- observar request a:

```text
/api/payments/mercadopago/create-preference
```

### Resultado esperado

- `200` con `checkoutUrl`;
- redirección al checkout de Mercado Pago.

### Resultado actual observado el 2026-06-03

- `503`
- `El pago online todavia no esta configurado.`

## Qué no hacer

- no commitear access tokens;
- no exponer tokens en client components;
- no inventar una lógica paralela de pago;
- no activar `paid` desde el navegador;
- no usar usuarios reales para esta prueba.

## Próximo paso operativo

1. Cargar `MERCADOPAGO_ACCESS_TOKEN` en el entorno productivo real.
2. Confirmar `NEXT_PUBLIC_BASE_URL=https://www.soliprode.com`.
3. Verificar webhook apuntando a `/api/payments/mercadopago/webhook`.
4. Repetir QA con `qa+nonpaid@soliprode.com`.
5. Confirmar creación de `payment_attempt` y redirección al checkout.
