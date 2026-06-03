---
title: "Design System Athletic Social"
description: "Dirección visual obligatoria de SoliProde basada en Stitch."
lastUpdated: "2026-06-03"
---

# Athletic Social

## Nombre

Athletic Social.

## Origen

Dirección visual elegida desde Stitch para SoliProde.

## Principio

SoliProde debe sentirse como un prode competitivo, social y mobile-first, con foco en premio, ranking, Mundial, Team y Pase Solidario.

No es una plataforma institucional, ni una landing solidaria, ni un dashboard SaaS genérico.

## Paleta recomendada

- Azul profundo / estadio como color base.
- Amarillo-dorado para premio, CTA principal, urgencia y activación.
- Blanco limpio para contraste y legibilidad.
- Grises suaves para fondos secundarios, líneas y texto auxiliar.
- Acentos deportivos puntuales para estados, banderas y competencia.

## Uso de CTA

- CTA principal: grande, clara, amarillo/dorado, con peso visual dominante.
- CTA secundaria: sobria, contenida, sin competir con la principal.
- Mercado Pago: señal compacta solo donde corresponda. No debe ser CTA principal visible de Home.
- Las acciones importantes deben hablar en lenguaje directo:
  - jugá,
  - competí,
  - completá tu inscripción,
  - completá tu Pase Solidario,
  - sumá puntos.

## Marca y logos

- Logo principal de producto: `public/soliprode-logo.svg` en header y superficies de marca.
- Isotipo/pelota compacto: `public/soliprode-logo.svg` para estados chicos y loading.
- Badge reducido: `public/icon-192.png`.
- Favicon: `public/favicon.ico`.
- Apple/iconos PWA: `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`.

Las rutas productivas están centralizadas en `src/lib/brand-assets.ts`.

## Cards

- Bordes sutiles.
- Sombra leve.
- Esquinas redondeadas.
- Contenido compacto.
- Jerarquía fuerte entre título, dato principal y texto auxiliar.
- No usar cards gigantes, institucionales o con aire excesivo.

## Mobile

- La experiencia se diseña primero para mobile.
- No debe haber overflow horizontal.
- No deben romperse columnas ni grids en 375px.
- No usar logos grandes ni assets que empujen el layout.
- El contenido tiene que seguir siendo legible y accionable en pantallas chicas.

## Tono

El producto debe hablar en tono competitivo y directo:

- Jugá.
- Competí.
- Sumá puntos.
- Empujá a tu Team.
- Completá tu Pase Solidario.
- Aporte confirmado.

La solidaridad existe, pero como capa secundaria. Nunca debe tapar el núcleo del juego.

## Reglas prohibidas

- No usar métricas falsas.
- No mostrar fixture falso como si fuera real.
- No esconder el Pase Solidario cuando ya forma parte del MVP recaudable.
- No transformar SoliProde en plataforma solidaria antes que juego competitivo.
- No usar layouts institucionales o estilo ONG.
- No usar UI genérica de dashboard SaaS.
- No resolver componentes aislados ignorando la dirección visual global.
- No romper mobile por meter assets sin control.

## Regla de trabajo para futuros agentes

Antes de modificar cualquier pantalla, componente o layout visual de SoliProde, revisar primero este archivo:

`src/content/docs/design-system-athletic-social.md`

La referencia visual obligatoria es Athletic Social. Si una decisión visual entra en conflicto con esa dirección, debe priorizarse Athletic Social.
