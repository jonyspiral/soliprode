---
title: "Documentación de SoliProde"
description: "Mapa principal de la documentación técnica y operativa del proyecto."
lastUpdated: "2026-06-07"
---

# Documentación de SoliProde

Propósito: mapa rápido para que humanos y agentes ubiquen contexto sin recorrer el repo a ciegas.

## Entradas rápidas

- Protocolo de agentes: `src/content/docs/protocolo-agentes.md`
- Gatillo de sesión: `.antigravity-context.md`
- Índice de planes: `plans/000-plan-index-soliprode.md`
- Plan MVP recaudable: `plans/soliprode-mvp-recaudable-plan.md`
- Runbook de publicación: `src/content/docs/runbooks/deploy-main.md`
- Sistema visual Athletic Social: `src/content/docs/design-system-athletic-social.md`
- Sistema de voz y copy: `src/content/docs/voice-and-copy-soliprode.md`
- Setup de Google Auth: `src/content/docs/auth-google-setup.md`
- Home promo floor and countdown: `src/content/docs/product/home-promo-floor-and-countdown.md`
- Onboarding contextual por invitación: `src/content/docs/product/invite-onboarding-flow.md`
- Prompt social post-pago: `src/content/docs/product/post-checkout-team-prompt.md`
- Pase de equipo / cupos prepagos: `src/content/docs/product/team-pass-prepaid-slots.md`
- Grupos competitivos MVP: `src/content/docs/groups-competitive-mvp.md`
- Fixture real y pronósticos: `src/content/docs/database/fixture-schema.md`
- Importación controlada del fixture: `src/content/docs/database/fixture-import.md`
- Usuarios QA de prueba: `src/content/docs/qa/test-users.md`
- Checklist productivo de Mercado Pago: `src/content/docs/payments/mercadopago-production-checklist.md`
- Flujo corto de activación: `src/content/docs/payments/activation-flow-short-checkout.md`
- Monitoreo post-lanzamiento del checkout: `src/content/docs/payments/checkout-clean-flow-monitoring.md`
- Recovery email desde Admin: `src/content/docs/admin-recovery-email.md`
- Roadmap de notificaciones PWA: `src/content/docs/roadmap/pwa-notifications-roadmap.md`
- Contratos de tono y UI: `src/content/docs/contracts/`
- Auditoría UI inicial: `src/content/docs/ui-audit-2026-06-02.md`
- Referencia visual Stitch: `src/content/docs/visual-reference/stitch-reference.md`

## Áreas actuales

| Área | Archivo |
|---|---|
| Gobierno de agentes | `src/content/docs/protocolo-agentes.md` |
| Deploy | `src/content/docs/runbooks/deploy-main.md` |
| Guía para nuevos agentes | `src/content/docs/agents/README.md` |
| Sistema visual Athletic Social | `src/content/docs/design-system-athletic-social.md` |
| Voice & copy de producto | `src/content/docs/voice-and-copy-soliprode.md` |
| Contrato de voz | `src/content/docs/contracts/voice-contract.md` |
| Contrato visual Athletic Social | `src/content/docs/contracts/athletic-social-design-contract.md` |
| Contrato de implementación UI/UX | `src/content/docs/contracts/ui-ux-implementation-contract.md` |
| Auditoría UI 2026-06-02 | `src/content/docs/ui-audit-2026-06-02.md` |
| Referencia visual Stitch | `src/content/docs/visual-reference/stitch-reference.md` |
| Setup externo de Google Auth | `src/content/docs/auth-google-setup.md` |
| Home promo floor and countdown | `src/content/docs/product/home-promo-floor-and-countdown.md` |
| Onboarding contextual por invitación | `src/content/docs/product/invite-onboarding-flow.md` |
| Prompt social post-pago | `src/content/docs/product/post-checkout-team-prompt.md` |
| Pase de equipo / cupos prepagos | `src/content/docs/product/team-pass-prepaid-slots.md` |
| Base Supabase | `src/content/docs/supabase-base.md` |
| Esquema de base de datos | `src/content/docs/database-schema.md` |
| Fixture real y pronósticos | `src/content/docs/database/fixture-schema.md` |
| Importación controlada del fixture | `src/content/docs/database/fixture-import.md` |
| Usuarios QA de prueba | `src/content/docs/qa/test-users.md` |
| Checklist productivo de Mercado Pago | `src/content/docs/payments/mercadopago-production-checklist.md` |
| Flujo corto de activación | `src/content/docs/payments/activation-flow-short-checkout.md` |
| Monitoreo post-lanzamiento del checkout | `src/content/docs/payments/checkout-clean-flow-monitoring.md` |
| Recovery email desde Admin | `src/content/docs/admin-recovery-email.md` |
| Base Auth | `src/content/docs/auth-base.md` |
| Grupos competitivos MVP | `src/content/docs/groups-competitive-mvp.md` |
| Roadmap de notificaciones PWA | `src/content/docs/roadmap/pwa-notifications-roadmap.md` |

## Contratos de producto, tono y UI

- Voice Contract: `src/content/docs/contracts/voice-contract.md`
- Athletic Social Design Contract: `src/content/docs/contracts/athletic-social-design-contract.md`
- UI/UX Implementation Contract: `src/content/docs/contracts/ui-ux-implementation-contract.md`
- Stitch Visual Reference: `src/content/docs/visual-reference/stitch-reference.md`

## Regla para cambios visuales

Antes de modificar UI, layout, copy visual o componentes de SoliProde, revisar primero:

- `src/content/docs/design-system-athletic-social.md`
- `src/content/docs/contracts/athletic-social-design-contract.md`

Y antes de tocar copy, CTA o tono de producto, revisar también:

- `src/content/docs/voice-and-copy-soliprode.md`
- `src/content/docs/contracts/voice-contract.md`

Y antes de agregar una nueva pantalla, card, banner o patrón visual:

- `src/content/docs/contracts/ui-ux-implementation-contract.md`
- `src/content/docs/ui-audit-2026-06-02.md`
- `src/content/docs/visual-reference/stitch-reference.md`

## Áreas esperadas a futuro

- Auth y sesiones.
- Partidos y predicciones.
- Pagos y activación.
- Rankings.
- Grupos y comunidades.
- Administración.
- Promotores y operación comercial.
- Integración con Supabase.
- Notificaciones PWA, email y WhatsApp como fase futura post-MVP.

## Roadmap futuro de notificaciones

Las notificaciones PWA están documentadas como fase futura en:

- `src/content/docs/roadmap/pwa-notifications-roadmap.md`

No forman parte del MVP inmediato y no deben implementarse hasta terminar fixture, pronósticos, pagos, activación paid, rankings, grupos y Admin.
