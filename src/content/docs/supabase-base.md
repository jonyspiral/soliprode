---
title: "Supabase Base"
description: "Base de integración de Supabase preparada para SoliProde."
lastUpdated: "2026-06-01"
---

# Supabase Base

Estado actual: SoliProde ya tiene la capa mínima para integrar Supabase sin haber activado todavía auth ni lógica de negocio.

## Variables esperadas

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_PASSWORD=
```

## Archivos base

| Archivo | Rol |
|---|---|
| `src/lib/supabase/config.ts` | Lee y centraliza variables de entorno |
| `src/lib/supabase/client.ts` | Cliente browser con `anon key` |
| `src/lib/supabase/server.ts` | Cliente server con `anon key` y helper opcional de `service role` |
| `src/app/api/health/supabase/route.ts` | Healthcheck mínimo del proyecto Supabase |
| `supabase/migrations/001_initial_schema.sql` | Primera migración del esquema |
| `src/content/docs/database-schema.md` | Documentación del esquema inicial |

## Criterios actuales

- No hay auth implementada todavía.
- No hay tablas ni queries de negocio integradas todavía.
- El `service role` es opcional por ahora.
- La ruta `GET /api/health/supabase` sirve para verificar conectividad básica con el proyecto.

## Siguiente paso recomendado

1. Completar `NEXT_PUBLIC_SUPABASE_ANON_KEY` o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. Definir si el proyecto usará confirmación de email obligatoria o login inmediato después del signup.
3. Extender el flujo hacia pagos, comunidades, grupos y bonus predictions.
