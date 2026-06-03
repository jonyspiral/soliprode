---
title: "Athletic Social Design Contract"
description: "Contrato obligatorio de dirección visual y jerarquía UI para SoliProde."
lastUpdated: "2026-06-02"
---

# Athletic Social Design Contract

## Origen

Dirección visual elegida desde Stitch.

## Principio

SoliProde debe sentirse como una app mobile-first de juego social deportivo: competitiva, clara, energética y agradable.

## Personalidad visual

La UI debe ser:

- deportiva;
- social;
- mundialista;
- compacta;
- dinámica;
- premium accesible;
- con tensión de ranking y premio.

## Paleta conceptual

- Azul profundo / estadio.
- Amarillo-dorado para premio, urgencia y CTA principal.
- Blanco limpio para respiración.
- Grises suaves para estructura.
- Acentos deportivos medidos.

## Jerarquía visual

Orden de prioridad:

1. Acción principal.
2. Estado del jugador.
3. Juego: partidos, picks, puntos, ranking.
4. Pago si falta.
5. Solidaridad breve.
6. Detalles operativos.

## Reglas de CTA

- CTA principal grande, claro y visible.
- Dorado/amarillo para la acción principal.
- Un solo CTA dominante por pantalla.
- CTA secundario sobrio.
- No competir visualmente con múltiples botones del mismo peso.

## Reglas de cards

Las cards deben ser:

- compactas;
- con bordes sutiles;
- con sombras leves;
- con esquinas redondeadas;
- sin exceso de texto;
- sin cards gigantes para explicar estados simples.

## Reglas de assets y logos

- Los logos nunca son protagonistas salvo marca SoliProde.
- Mercado Pago debe ser badge compacto, no card grande.
- Máximo recomendado para logo Mercado Pago:
  - `max-width: 140px`
  - `max-height: 32px`
  - `object-contain`
- Si un asset rompe layout, se reemplaza por texto hasta corregirlo.

## Mobile

Diseñar primero para `375px`.

Reglas:

- Sin overflow horizontal.
- Sin textos cortados.
- Sin columnas frágiles.
- Sin `absolute positioning` innecesario.
- Bottom nav no debe tapar contenido.
- Header y banners compactos.

## Prohibido

- Logos gigantes.
- Banners múltiples.
- Cards institucionales largas.
- UI tipo SaaS administrativa.
- Componentes que no respeten el tono deportivo.
- Mocks falsos como fixture real.
- Métricas no confirmadas.
- Solidaridad como bloque dominante.

## Regla

Toda nueva UI debe respetar este contrato.
