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

## Criterios actuales

- No hay auth implementada todavía.
- No hay tablas ni queries de negocio integradas todavía.
- El `service role` es opcional por ahora.
- La ruta `GET /api/health/supabase` sirve para verificar conectividad básica con el proyecto.

## Siguiente paso recomendado

1. Completar `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Definir si el proyecto usará auth email/password, magic link o social login.
3. Incorporar helpers SSR/cookies cuando se implemente sesión real.
