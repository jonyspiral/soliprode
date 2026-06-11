---
title: "Admin recovery email"
description: "Flujo manual de recuperación por email desde Admin con Brevo."
---

## Objetivo

- Enviar tandas manuales desde `/admin`.
- No usar campañas masivas ni automatizaciones.
- Usar `participations.payment_status` como fuente de verdad.

## Estados incluidos

- `pending`
- `payment_started`
- `payment_pending`
- `rejected`

## Estado separado

- `manual_review`

Queda visible en Admin, pero fuera del flujo de envío.

## Infraestructura

- Brevo transactional con:
  - `BREVO_API_KEY`
  - `BREVO_SENDER_NAME`
  - `BREVO_SENDER_EMAIL`
- Storage privado en:
  - `admin_email_send_logs`
- Las plantillas viven en helpers server-side compartidos.
- Los envíos reales salen por Brevo y quedan logueados por destinatario.

## Guardrails

- No toca `communities`.
- No usa `contributions`.
- No modifica checkout, webhooks ni pagos.
- `manual_review` queda fuera del envío.
- Brevo corta por server-side si la tanda supera `40`.
- Hay anti-duplicado de 24 horas por perfil + plantilla.
- El send exige confirmación explícita en `/admin`.
