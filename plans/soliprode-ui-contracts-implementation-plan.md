# SoliProde UI Contracts Implementation Plan

Fecha: 2026-06-02
Estado: ACTIVO
Prioridad: P1
Próxima acción: usar estos contratos como prerequisito de cualquier tarea futura de UI o copy y ejecutar la auditoría página por página
Criterio de cierre: contratos referenciados en la documentación viva, auditoría inicial completada y backlog de refactor visual priorizado sin abrir rediseño total

## Objetivo

Adoptar contratos explícitos de tono, system design y UI/UX como regla de trabajo para futuras implementaciones.

## Alcance

- `src/content/docs/contracts/voice-contract.md`
- `src/content/docs/contracts/athletic-social-design-contract.md`
- `src/content/docs/contracts/ui-ux-implementation-contract.md`
- `src/content/docs/visual-reference/stitch-reference.md`
- `src/content/docs/docs-map.md`
- `plans/000-plan-index-soliprode.md`
- `.antigravity-context.md`

## Fuera de alcance

- No implementar nuevas features.
- No tocar backend.
- No tocar Supabase.
- No tocar pagos.
- No tocar scoring.
- No tocar rankings.
- No tocar grupos.
- No rediseñar páginas todavía.

## Fase 1 — Documentación

Crear y consolidar:

1. Voice Contract.
2. Athletic Social Design Contract.
3. UI/UX Implementation Contract.

Luego:

- linkearlos en `docs-map`;
- linkearlos en el índice de planes;
- referenciarlos en `.antigravity-context.md`.
- sumar referencia visual Stitch como guía de clima visual y proporciones.

Estado: IMPLEMENTADO.

## Fase 2 — Auditoría rápida de UI actual

Sin rediseñar todavía, listar páginas con riesgo:

| Página | Acción principal actual | Ruido visual detectado | Copy fuera de tono | Componentes a simplificar | Prioridad |
|---|---|---|---|---|---|
| Home | Crear cuenta y jugar / volver al juego | hero y bloques secundarios pueden volver a competir si se siguen agregando cards | medio | hero, bloque de inscripción, apoyo solidario | P0 |
| Login | Continuar con Google / entrar con email | riesgo de sumar explicaciones o banners extra | bajo | hero auth, estados de error, soporte OAuth | P0 |
| Register | Crear cuenta con Google / registrarme con email | stepper y formulario pueden inflarse rápido | medio | stepper, bloques auxiliares, promoter code | P0 |
| Dashboard | pagar o seguir jugando según estado | demasiadas métricas/cards pueden volverlo administrativo | alto | hero de estado, métricas, panel de activación, cuenta | P0 |
| Matches | cargar pronósticos | riesgo de ruido entre fixture, picks y estados | medio | match card, prediction input, empty states | P1 |
| Rankings | ver tabla | riesgo de explicaciones largas o métricas falsas | medio | podium, ranking row, estados vacíos | P1 |
| Profile | cerrar sesión / editar datos básicos | puede duplicarse con dashboard y volverse administrativa | medio | cuenta, datos básicos, logout | P2 |
| Admin | publicar / confirmar acciones operativas | por naturaleza puede contaminar patrones del jugador | alto | admin cards, alerts, tables, action rows | P1 |

Estado: IMPLEMENTADO.

Artefacto:

- `src/content/docs/ui-audit-2026-06-02.md`

## Fase 3 — Componentes base a proteger

Patrones oficiales a definir y luego proteger:

- `PrimaryCTA`
- `SecondaryCTA`
- `StatusBadge`
- `PaymentBadge`
- `MatchCard`
- `PredictionInput`
- `RankingRow`
- `GameHero`
- `CompactInfoCard`
- `EmptyState`
- `AdminPanelCard`

No implementarlos todavía. Solo dejar la lista como dirección oficial.

Estado: DOCUMENTADO.

## Fase 4 — Regla para futuras tareas Codex

Todo prompt futuro que toque UI debe incluir:

Antes de tocar UI o copy, revisar:

- `src/content/docs/contracts/voice-contract.md`
- `src/content/docs/contracts/athletic-social-design-contract.md`
- `src/content/docs/contracts/ui-ux-implementation-contract.md`
- `src/content/docs/ui-audit-2026-06-02.md`
- `src/content/docs/visual-reference/stitch-reference.md`

Estado: ACTIVO.

Nota:

- La referencia Stitch guía jerarquía y proporciones.
- No habilita copiar pantallas pixel-perfect ni inventar datos para parecerse al mock.

## Fase 5 — Refactor visual posterior

Cuando backend principal esté conectado, hacer polish por página en este orden:

1. Home
2. Login/Register
3. Dashboard
4. Matches
5. Rankings
6. Groups
7. Profile
8. Admin

No hacer ahora un rediseño total.

Estado: PENDIENTE.

## Decisión estratégica

- No esperar a terminar backend para cuidar UI.
- No rediseñar todo ahora.
- Mantener UI estable y agradable durante todo el desarrollo.

## Regla de continuidad

El siguiente paso después de este plan no es rediseñar.

El siguiente paso debe ser una auditoría de UI actual contra estos contratos, página por página, para tener un mapa claro de qué corregir sin romper todo.
