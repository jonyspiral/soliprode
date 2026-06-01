# Plan — Corrective Promoter View And Bonus Policies

Estado: IMPLEMENTADO
Prioridad: P1
Fecha: 2026-06-01

## Objetivo

Sincronizar el repositorio con el parche manual ya aplicado en base para endurecer grants de la vista pública de promotores y formalizar las policies de `bonus_predictions`.

## Alcance

- Crear `supabase/migrations/003_harden_promoter_view_and_bonus_policies.sql`.
- Actualizar documentación del esquema.
- Actualizar índice de planes.

## Fuera de alcance

- Cambios de UI.
- Auth aplicada.
- Seed data.
- Cambios destructivos de tablas o datos.

## Verificación

1. `npm run lint`
2. `npm run build`
