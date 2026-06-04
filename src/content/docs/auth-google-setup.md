---
title: "Google Auth Setup"
description: "Configuración externa mínima para usar Google Login con Supabase Auth en SoliProde."
lastUpdated: "2026-06-04"
---

# Google Auth Setup

Objetivo: dejar a SoliProde con Google Login como camino preferido y email/password como alternativa secundaria del MVP.

## Supabase

En Supabase Auth hay que dejar configurado:

- habilitar provider `Google`;
- cargar `Google Client ID`;
- cargar `Google Client Secret`;
- desactivar confirmación obligatoria de email para el MVP, para que el registro con email no bloquee el avance del jugador;
- configurar `Site URL`;
- configurar `Redirect URLs`.

### Ruta en Supabase

Para revisar la confirmación de email del MVP:

`Supabase Auth > Providers > Email`

Ahí conviene validar con negocio si `Confirm email` sigue prendido. Para el MVP recaudable, la recomendación actual es dejarlo desactivado para no mandar al jugador a un callejón sin salida.

### Site URL recomendada

```text
https://www.soliprode.com
```

### Dominio canónico

- `https://www.soliprode.com` debe ser el origen canónico.
- `https://soliprode.com/*` debe redirigir con `308` a `https://www.soliprode.com/*`.
- No mezclar apex y `www` en producción para evitar sesiones partidas entre origins.

### Redirect URLs mínimas

```text
https://www.soliprode.com/auth/callback
http://localhost:3000/auth/callback
```

Opcionalmente conviene agregar también:

```text
https://soliprode.com/auth/callback
```

## Google Cloud

Crear un `OAuth Client ID` de tipo `Web Application`.

### Authorized JavaScript origins

```text
https://www.soliprode.com
http://localhost:3000
```

### Authorized redirect URI

No es el callback de la app directa, sino el callback que Supabase te muestra para Google provider dentro del dashboard de Auth.

Usar exactamente la URI de callback del provider Google indicada por Supabase.

## Pantalla de consentimiento

Configurar la pantalla de consentimiento en Google Cloud con lo mínimo necesario para el MVP.

### Scopes mínimos

```text
openid
email
profile
```

## Variables

Variables relevantes para este flujo:

- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` o `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Regla de producto del MVP

- Google Login es el camino preferido.
- Email/password sigue disponible como alternativa.
- La validación fuerte para competir no es el correo: es el pago.
- Si Supabase todavía obliga confirmación de email, el copy no debe frenar ni sonar bloqueante.

## promoter_code en OAuth

La atribución de promotor se preserva así:

- si el usuario llega con `?p=CODIGO` o `?promoter=CODIGO`, el front guarda ese código antes de ir a Google;
- al volver por `/auth/callback`, el bootstrap lo asocia a la participación si todavía no tenía promotor cargado;
- en login y registro queda un input opcional compacto `Promotor` como fallback manual;
- si ya existe atribución previa por link/cookie/sesión, el input manual no la sobrescribe;
- si el valor manual es inválido, no rompe el flujo de alta o login.

## Checklist de validación

1. `Continuar con Google` aparece en login.
2. `Crear cuenta con Google` aparece en registro.
3. Google redirige a Supabase/Google sin romper auth actual.
4. `/auth/callback` intercambia `code` por `session`.
5. El usuario vuelve a `/dashboard` o al `next` correcto.
6. `promoter_code` no se pierde si venía por URL.
7. El login con email sigue funcionando.
8. El registro con email no queda bloqueado por copy de confirmación.
