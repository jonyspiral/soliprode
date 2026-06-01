# SoliProde

SoliProde es la base del **Prode Mundial Solidario 2026**.

Objetivo inicial: una PWA mobile-first para jugar el Mundial, competir en grupos y sostener una causa solidaria, con una base técnica simple de extender.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- `src/` directory
- alias `@/*`
- deploy compatible con Vercel

## Getting Started

Primero levantá el entorno local:

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Rutas base

- `/`
- `/login`
- `/dashboard`
- `/matches`
- `/rankings`
- `/groups`
- `/communities`
- `/admin`

## Estructura para agentes

Antes de trabajar en el repo:

1. Leer [AGENTS.md](AGENTS.md)
2. Leer [.antigravity-context.md](.antigravity-context.md)
3. Leer `src/content/docs/protocolo-agentes.md`
4. Leer `src/content/docs/docs-map.md`

## Estado actual

- Base visual y navegación compartida creadas.
- Landing inicial de SoliProde activa.
- Placeholders listos para las rutas principales.
- Sin auth, sin pagos, sin Supabase y sin lógica de negocio todavía.

## Deploy

El proyecto está preparado para desplegarse en Vercel. Antes de publicar cambios, seguir `src/content/docs/runbooks/deploy-main.md`.

## Próximos pasos sugeridos

- Definir auth y sesión.
- Modelar partidos y predicciones.
- Construir rankings, grupos y comunidades.
- Integrar Supabase cuando la base funcional esté cerrada.
