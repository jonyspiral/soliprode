---
title: "SoliProde UI/UX Implementation Contract"
description: "Contrato obligatorio para incorporar features sin romper foco, tono ni diseño."
lastUpdated: "2026-06-02"
---

# SoliProde UI/UX Implementation Contract

## Objetivo

Evitar que nuevas funcionalidades rompan el foco, el tono o el diseño de la app.

## Principios obligatorios

### 1. Una pantalla, una acción principal

Cada pantalla debe tener un CTA dominante.

No agregar múltiples banners compitiendo.

### 2. Juego primero, explicación después

Mostrar primero:

- próximo partido;
- pronóstico;
- puntos;
- ranking;
- grupo;
- pago si falta.

### 3. No usar banners para todo

Antes de crear un banner, evaluar si puede ser:

- una línea corta;
- un badge;
- un estado dentro de una card;
- una microcopy;
- una sección colapsable;
- un tooltip.

### 4. Cada estado debe empujar una acción

Incorrecto:

`Tu participación está pendiente.`

Correcto:

`Tus picks están guardados. Pagá para que compitan.`

### 5. No sobreinformar

Si una explicación no ayuda a jugar ahora, pagar ahora o entender el ranking ahora, debe ir secundaria o no mostrarse.

### 6. UI divertida y agradable

La experiencia debe invitar a:

- cargar picks;
- volver a ver ranking;
- competir con amigos;
- armar grupo;
- pagar para entrar en juego.

### 7. Mobile-first real

Todo cambio UI debe revisarse en `375px`.

Criterios:

- no overflow;
- no texto cortado;
- no cards gigantes;
- no logos fuera de escala;
- no columnas rotas.

### 8. Integrar features dentro de patrones existentes

No inventar una nueva card, banner o layout para cada función.

Reutilizar patrones como:

- CTA principal;
- status badge;
- game card;
- payment badge;
- match card;
- ranking row;
- compact info row.

### 9. Mercado Pago

Debe ser claro, visible y directo:

`Pagar con Mercado Pago.`

Pero no debe invadir la pantalla ni romper el foco del juego.

### 10. Solidaridad

Debe aparecer como refuerzo breve.

No debe desplazar el premio, el juego ni el ranking.

### 11. Admin no define la experiencia del jugador

No trasladar lenguaje administrativo al usuario.

## Checklist obligatorio antes de agregar UI nueva

Antes de agregar una nueva UI, responder:

1. ¿Cuál es la acción principal de esta pantalla?
2. ¿Este bloque ayuda a jugar, pagar o competir ahora?
3. ¿Puede ser más corto?
4. ¿Estoy agregando otro banner innecesario?
5. ¿Compite con el CTA principal?
6. ¿Se entiende en 3 segundos?
7. ¿Funciona en mobile `375px`?
8. ¿Respeta Athletic Social?
9. ¿Respeta Voice Contract?
10. ¿Estoy inventando un patrón nuevo sin necesidad?

## Regla

Si una feature necesita UI, primero debe ubicarse dentro de un patrón existente.

Si no existe patrón, proponerlo antes de implementarlo.
