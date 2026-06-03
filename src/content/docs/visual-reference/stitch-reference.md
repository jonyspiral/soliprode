---
title: "Stitch Visual Reference for SoliProde"
description: "Traducción operativa de la referencia visual de Stitch a reglas concretas para desarrollo de SoliProde."
lastUpdated: "2026-06-02"
---

# Stitch Visual Reference for SoliProde

## Objetivo

Usar la referencia visual aprobada de Stitch como guía de clima visual, jerarquía y proporciones para futuros refactors de SoliProde.

Este documento no define una copia pixel-perfect.

Este documento traduce la referencia a reglas concretas de desarrollo.

## Cómo usar esta referencia

Antes de tocar UI o copy, revisar:

- `src/content/docs/contracts/voice-contract.md`
- `src/content/docs/contracts/athletic-social-design-contract.md`
- `src/content/docs/contracts/ui-ux-implementation-contract.md`
- `src/content/docs/ui-audit-2026-06-02.md`
- `src/content/docs/visual-reference/stitch-reference.md`

La imagen de Stitch define:

- clima visual;
- jerarquía de información;
- proporciones entre hero, cards, CTA y navegación;
- tono general de app mobile-first deportiva.

La imagen de Stitch no define:

- un layout fijo a copiar;
- datos ficticios obligatorios;
- gráficos falsos;
- fixture inventado;
- métricas no confirmadas.

## Pantallas de referencia

- Home
- Register
- Dashboard
- Rankings
- Matches

## Dirección visual general

- App mobile-first.
- Energía de Mundial.
- Juego social deportivo.
- Azul profundo tipo estadio como base.
- Amarillo/dorado para CTA principal, premios, urgencia y momentos destacados.
- Cards blancas compactas sobre fondo claro.
- Bordes sutiles, sombras leves, esquinas redondeadas.
- Bottom navigation simple.
- Header compacto con marca y avatar.

## Lectura visual transversal

La referencia muestra una app que:

- empuja a jugar;
- hace visible el estado competitivo;
- usa cards compactas y respiradas;
- evita bloques administrativos largos;
- mantiene foco claro entre hero, estado y CTA.

La composición más importante es:

1. marca y contexto de pantalla;
2. estado o mensaje principal;
3. acción dominante;
4. cards secundarias;
5. navegación inferior simple.

## Reglas por pantalla

### Home

- Hero fuerte.
- CTA principal claro.
- No usar métricas falsas como pozo o jugadores salvo datos reales.
- Si se muestra próximo partido, debe venir de datos reales.

Interpretación de Stitch:

- La Home puede tener una apertura más emocional y mundialista.
- El CTA principal debe dominar el primer scroll.
- Los bloques secundarios deben ser pocos y compactos.
- La solidaridad debe aparecer como refuerzo breve, nunca como bloque dominante.

### Register

- Formulario claro.
- Progreso simple.
- Una acción principal.
- Tono competitivo: sumate, jugá, entrá al Prode.
- Evitar tono institucional.

Interpretación de Stitch:

- El stepper debe ser simple y liviano.
- El formulario debe sentirse rápido, no burocrático.
- Los elementos de apoyo deben reforzar el ingreso al juego, no explicar operación.
- El CTA principal debe cerrar la pantalla con claridad.

### Dashboard

- Saludo fuerte.
- Estado competitivo claro.
- Mostrar puntos, posición o pronósticos solo si son reales.
- No usar charts falsos.
- No usar racha falsa.
- No usar próximos partidos mock.
- Priorizar CTA: cargar pronósticos, pagar o ver ranking según estado.

Interpretación de Stitch:

- El dashboard debe sentirse como panel del jugador, no como ficha administrativa.
- La apertura debe dejar claro si el usuario está compitiendo o qué le falta para entrar.
- El contenido secundario debe ordenarse detrás de una sola acción principal según estado.

### Rankings

- Ranking visual, social y competitivo.
- Destacar posición del usuario.
- Evitar bloqueos con demasiadas capas.
- Si el usuario no pagó, mostrar CTA claro para pagar.
- No esconder la acción principal debajo de explicación larga.

Interpretación de Stitch:

- La tabla debe ser protagonista.
- La posición del usuario debe verse rápido.
- El ranking tiene que sentirse vivo, social y comparativo.
- Si existe estado bloqueado, debe resolverse con una capa corta y una acción clara.

### Matches

- Pantalla directa para cargar pronóstico.
- Equipos, horario y cierre claros.
- Controles grandes y cómodos en mobile.
- Guardar pronóstico como CTA principal.
- Evitar explicar demasiado en estado vacío.

Interpretación de Stitch:

- El foco debe estar en el partido y en la acción de pronosticar.
- La información crítica es:
  - equipos,
  - horario,
  - tiempo de cierre,
  - estado del pronóstico.
- Los componentes deben ser táctiles, simples y rápidos.

## Reglas estrictas

- Una pantalla = una acción principal.
- No banners múltiples.
- No logos gigantes.
- Mercado Pago debe ser badge compacto.
- No UI SaaS administrativa.
- No sobreinformar.
- No inventar datos.
- No fixture falso.
- No métricas falsas.
- No copiar la imagen pixel-perfect.
- La imagen define clima visual, jerarquía y proporciones.

## Traducción operativa para futuros refactors

### Dashboard

Cuando se refactoree:

- abrir con saludo y estado competitivo real;
- mostrar un solo CTA dominante según estado;
- eliminar cualquier chart, racha o fixture mock;
- usar solo datos reales o no mostrar ese bloque.

### Matches

Cuando se refactoree:

- reducir notices y explicación en vacío;
- priorizar el partido, el cierre y la acción;
- usar cards de partido compactas;
- mantener el CTA de guardar como eje principal.

### Rankings

Cuando se refactoree:

- mostrar antes la tabla o la activación;
- reducir capas intermedias;
- destacar la posición del usuario;
- hacer que la acción principal se entienda en menos de 3 segundos.

## Relación con contratos existentes

La referencia Stitch no reemplaza contratos.

Se usa junto con:

- Voice Contract para tono y copy;
- Athletic Social Design Contract para sistema visual;
- UI/UX Implementation Contract para decisiones de jerarquía y patrones;
- UI Audit para saber dónde está hoy la deuda real.

## Regla final

Si una decisión visual futura contradice esta referencia, los contratos y la auditoría existente, primero se documenta la razón antes de implementarla.
