---
title: "QA Test Users"
description: "Usuarios de prueba controlados para SoliProde, sin mezclar cuentas reales ni secretos en el repo."
lastUpdated: "2026-06-03"
---

# QA Test Users

Objetivo: dejar una forma segura y repetible de probar `nonpaid`, `pending` y `paid` sin tocar usuarios reales.

## Usuarios QA reservados

- `qa+nonpaid@soliprode.com`
- `qa+pending@soliprode.com`
- `qa+paid@soliprode.com`

Regla:

- no usar otros emails para este flujo;
- no commitear contraseñas;
- no commitear `SUPABASE_SERVICE_ROLE_KEY`;
- no reutilizar usuarios reales para pruebas de fixture, pago o ranking.

## Qué representa cada estado

### `qa+nonpaid@soliprode.com`

- puede iniciar sesión;
- puede cargar pronósticos;
- sus pronósticos quedan guardados;
- no compite oficialmente todavía.

Estado esperado en `participations.payment_status`:

```text
pending
```

### `qa+pending@soliprode.com`

- puede iniciar sesión;
- ve estado de verificación;
- no figura como `paid`;
- todavía no entra al ranking oficial.

Estado esperado en `participations.payment_status`:

```text
payment_pending
```

### `qa+paid@soliprode.com`

- puede iniciar sesión;
- ve estado `Compitiendo`;
- no debería ver CTA principal de inscripción;
- puede cargar pronósticos como jugador ya activo.

Estado esperado en `participations.payment_status`:

```text
paid
```

## Script local recomendado

Archivo:

```text
scripts/qa/prepare-test-users.mjs
```

### Qué hace

- requiere `SUPABASE_SERVICE_ROLE_KEY`;
- crea o actualiza solo los tres emails QA reservados;
- asegura `auth.users`;
- asegura `profiles`;
- asegura `participations`;
- puede limpiar pronósticos QA si se lo pedís;
- no imprime secretos.

### Variables necesarias

Mínimas:

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Para contraseñas, elegir una de estas dos opciones:

Opción A:

```text
QA_TEST_USERS_PASSWORD
```

Opción B:

```text
QA_NONPAID_PASSWORD
QA_PENDING_PASSWORD
QA_PAID_PASSWORD
```

El script no inventa contraseñas y no las imprime.

### Comandos

Preparar los tres usuarios:

```bash
node scripts/qa/prepare-test-users.mjs
```

Preparar solo uno:

```bash
node scripts/qa/prepare-test-users.mjs --only=nonpaid
node scripts/qa/prepare-test-users.mjs --only=pending
node scripts/qa/prepare-test-users.mjs --only=paid
```

Preparar usuarios y además limpiar sus pronósticos:

```bash
node scripts/qa/prepare-test-users.mjs --reset-predictions
```

## Cómo identificar el auth user id

### Opción 1 — salida del script

El script devuelve un resumen JSON con:

- `email`
- `userId`
- `status`
- si el usuario auth se creó o ya existía

### Opción 2 — Supabase dashboard

Revisar:

```text
Supabase > Authentication > Users
```

Buscar por email QA y copiar el `user id`.

## Cómo dejar cada usuario en el estado correcto

### Nonpaid

El script deja:

- `profiles` presente;
- `participations.payment_status = 'pending'`;
- sin `paid_at`;
- sin `activated_at`.

### Pending

El script deja:

- `profiles` presente;
- `participations.payment_status = 'payment_pending'`;
- `payment_started_at` cargado;
- sin `paid_at`;
- sin `activated_at`.

### Paid

El script deja:

- `profiles` presente;
- `participations.payment_status = 'paid'`;
- `payment_started_at` cargado;
- `paid_at` cargado;
- `activated_at` cargado;
- `eligible_from` cargado.

## Cómo limpiar pronósticos de prueba

### Opción segura recomendada

```bash
node scripts/qa/prepare-test-users.mjs --reset-predictions
```

Ese borrado solo afecta `predictions` de los tres usuarios QA reservados.

### Regla

- no borrar pronósticos de usuarios reales;
- no hacer deletes abiertos por tabla completa;
- no reutilizar este cleanup fuera del prefijo `qa+...@soliprode.com`.

## Cómo evitar tocar usuarios reales

- el script solo trabaja con:
  - `qa+nonpaid@soliprode.com`
  - `qa+pending@soliprode.com`
  - `qa+paid@soliprode.com`
- no acepta emails arbitrarios;
- no borra usuarios auth;
- no toca cuentas fuera de esa lista.

## Validaciones QA mínimas

### `qa+nonpaid`

1. login;
2. entrar a `/matches`;
3. guardar pronóstico;
4. refrescar;
5. confirmar persistencia;
6. click en `Completar inscripción`;
7. confirmar que llega al checkout.

### `qa+pending`

1. login;
2. ver estado de verificación;
3. confirmar que no aparece como `Compitiendo`.

### `qa+paid`

1. login;
2. ver `Compitiendo`;
3. confirmar que no aparece CTA principal de inscripción;
4. cargar pronóstico.

## Notas operativas

- El checkout real sigue dependiendo de `MERCADOPAGO_ACCESS_TOKEN` server-side.
- `success`, `pending` y `failure` no activan `paid` por sí solos.
- La fuente de verdad sigue siendo webhook o verificación server-side.
