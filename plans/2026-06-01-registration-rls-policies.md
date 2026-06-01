# Plan — Registration RLS Policies

Estado: IMPLEMENTADO
Prioridad: P1
Fecha: 2026-06-01

## Objetivo

Agregar únicamente las policies y superficie SQL necesarias para el primer flujo de registro sobre el esquema inicial ya aplicado.

## Alcance

- Crear `supabase/migrations/002_registration_policies.sql`.
- Documentar las nuevas policies en `src/content/docs/database-schema.md`.
- Actualizar el índice de planes si corresponde.

## Nota importante

El requisito "public can read active promoter codes and names only" no se puede resolver solo con RLS sobre la tabla, porque RLS filtra filas y no columnas. La solución segura de esta migración es agregar una vista pública limitada a `code` y `name` de promotores activos.

## Verificación

1. `npm run lint`
2. `npm run build`
