# Google OAuth Branding

Objetivo: reducir la fricción visual del login con Google y evitar que el flujo se sienta ajeno a SoliProde.

## Qué quedó implementado en el repo

- El login con Google se dispara desde:
  - `src/components/auth/login-form.tsx`
  - `src/components/auth/register-form.tsx`
- Ambos usan `supabase.auth.signInWithOAuth({ provider: "google" })`.
- El `redirectTo` queda centralizado en `src/lib/auth/oauth.ts` y apunta a:
  - `${baseUrl}/auth/callback?next=...`
- La vuelta branded de OAuth vive en:
  - `src/app/auth/callback/page.tsx`
  - `src/components/auth/auth-callback-screen.tsx`
- El canje server-side del `code` y el bootstrap de cuenta viven en:
  - `src/app/api/auth/oauth-callback/route.ts`

## Configuración externa requerida

### A. Google Cloud / Google Auth Platform

Configurar la app OAuth con branding real:

- App name: `SoliProde`
- Logo oficial: `public/soliprode-logo.svg` o versión aprobada por Google
- Support email correcto
- Homepage URL del dominio final de SoliProde
- Privacy Policy URL
- Terms URL
- Authorized domains del dominio final
- Completar verificación de branding si Google la solicita

Esto es lo que permite que Google muestre `SoliProde` o el dominio correcto en vez de una identidad técnica.

### B. Supabase Auth

Revisar en `Auth > URL Configuration`:

- `Site URL` debe apuntar al dominio final de SoliProde
- `Redirect URLs` deben incluir:
  - `https://www.soliprode.com/auth/callback`
  - y cualquier otro dominio real que use producción

Si se quiere evitar que Google muestre el subdominio técnico de Supabase, evaluar `custom domain` para Auth, por ejemplo:

- `https://auth.soliprode.com`

### C. Google OAuth Client

Revisar `Authorized redirect URIs`.

Estado técnico actual típico de Supabase:

- `https://qlldglsdgjjekoiorvbc.supabase.co/auth/v1/callback`

Estado ideal con custom domain:

- `https://auth.soliprode.com/auth/v1/callback`

## Notas

- El repo ya evita forzar `prompt=consent` o `prompt=select_account`.
- No se cambiaron project keys ni variables obligatorias de Supabase.
- Si `NEXT_PUBLIC_BASE_URL` no está configurada, el cliente usa `window.location.origin` como fallback para armar `redirectTo`.
