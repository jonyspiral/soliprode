---
title: "Flujo corto de activación del Pase Solidario"
description: "Resumen operativo del flujo principal de activación con Mercado Pago Checkout Pro."
lastUpdated: "2026-06-06"
---

# Flujo corto de activación del Pase Solidario

## Camino principal

1. CTA sticky o link interno lleva a `/activar-pase`.
2. Si el usuario no tiene sesión, login/OAuth usa `next=/activar-pase`.
3. `/activar-pase` es la superficie principal de conversión.
4. El botón `Pagar y activar mi Pase` llama a `POST /api/payments/mercadopago/create-preference`.
5. El backend crea o reutiliza `payment_attempts` y devuelve la URL de Checkout Pro.
6. Mercado Pago vuelve por `/pago/success`, `/pago/pending` o `/pago/failure`.
7. La activación final depende del webhook o del sync server-side; el retorno no marca `paid` por sí solo.

## Reglas de verdad

- `participations.payment_status = 'paid'` sigue siendo la fuente de verdad de `Jugador activo`.
- La recaudación confirmada se calcula solo con `participations.entry_price` de participaciones `paid`.
- `payment_attempts` conserva la trazabilidad de cada intento de checkout.
- No se usa ni se introduce tabla `contributions`.

## Compatibilidad

- La ruta pública nueva es `/pago/*`.
- `/payment/*` sigue viva como compatibilidad.
- `APP_URL` puede actuar como base pública server-side, manteniendo compatibilidad con `NEXT_PUBLIC_BASE_URL`.

## Bloqueos suaves vigentes

- Pronósticos, crear Team y sumarse a Team empujan a `/activar-pase` cuando el usuario está registrado sin Pase activo.
- La navegación básica y los previews siguen visibles.
