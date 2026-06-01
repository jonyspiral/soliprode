# Plan — Initial Supabase Schema

Estado: IMPLEMENTADO
Prioridad: P1
Fecha: 2026-06-01

## Objetivo

Preparar el esquema inicial de base de datos de SoliProde en Supabase sin conectar todavía UI, auth aplicada ni lógica de negocio.

## Alcance

- Crear migración inicial en `supabase/migrations/001_initial_schema.sql`.
- Documentar tablas, relaciones, índices y políticas RLS.
- Actualizar docs map y gatillo de sesión.

## Fuera de alcance

- Seed data.
- Conexión de pantallas al esquema.
- Flujos reales de autenticación, pagos o rankings.

## Entregables

1. Migración SQL con tablas, índices, defaults y RLS.
2. Documento `src/content/docs/database-schema.md`.
3. Actualización de `src/content/docs/docs-map.md`.

## Verificación

1. Revisar consistencia del SQL.
2. Ejecutar `npm run lint`.
3. Ejecutar `npm run build`.
