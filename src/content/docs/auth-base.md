---
title: "Auth Base"
description: "Primer flujo real de registro y login con Supabase Auth para SoliProde."
lastUpdated: "2026-06-01"
---

# Auth Base

Estado: registro y login básicos implementados con Supabase Auth sobre Next.js App Router.

## Alcance actual

- Registro con email y password.
- Inserción de `profiles` después del signup.
- Inserción de `participations` con `payment_status = 'pending'`.
- Login con email y password.
- Dashboard protegido por sesión.

## Archivos clave

| Archivo | Rol |
|---|---|
| `src/app/register/actions.ts` | Alta de usuario, perfil y participación |
| `src/app/login/actions.ts` | Login con email/password |
| `src/lib/supabase/server.ts` | Cliente SSR con cookies |
| `src/lib/supabase/middleware.ts` | Refresh de sesión y guards de ruta |
| `src/proxy.ts` | Entrada de proxy de sesión en Next 16 |
| `src/app/dashboard/page.tsx` | Pantalla protegida con lectura de perfil y participación |

## Límites actuales

- No hay recuperación de contraseña.
- No hay pagos.
- No hay creación real de comunidades o grupos desde el formulario.
- No hay uso activo del service role key en el flujo auth.
