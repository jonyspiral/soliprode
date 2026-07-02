# Índice Maestro de Planes — SoliProde

Fecha: 2026-06-01
Alcance: `plans/`, `src/content/docs/`, `.antigravity-context.md`, `AGENTS.md`, `README.md`

Objetivo: centralizar los planes activos y evitar duplicados mientras SoliProde pasa de bootstrap a producto.

## Reglas de uso

1. Antes de crear un plan nuevo, revisar este índice.
2. Si el tema ya existe, actualizar el plan vivo.
3. Todo plan debe incluir:
   - estado,
   - prioridad,
   - próxima acción,
   - criterio de cierre.

## Planes

| Tema | Archivo | Área | Estado | Resumen | Prioridad | Próxima acción | Owner sugerido |
|---|---|---|---|---|---|---|---|
| Bootstrap base del producto | `plans/000-plan-index-soliprode.md` | Gobierno técnico | IMPLEMENTADO | Repo inicial con app base, docs y estructura de agentes | P0 | Mantener este índice como entrada obligatoria | Agente técnico |
| Esquema inicial Supabase | `plans/2026-06-01-initial-supabase-schema.md` | Datos / plataforma | IMPLEMENTADO | Migración base con tablas, índices, RLS y documentación | P1 | Evolucionar auth, participaciones y rankings sobre este esquema | Agente técnico |
| Policies de registro | `plans/2026-06-01-registration-rls-policies.md` | Datos / seguridad | IMPLEMENTADO | Policies mínimas para perfil, participación, comunidades y grupos del flujo de registro | P1 | Continuar con auth y writes reales apoyados en estas policies | Agente técnico |
| Correctivo de vista promoters y bonus policies | `plans/2026-06-01-corrective-promoter-view-and-bonus-policies.md` | Datos / seguridad | IMPLEMENTADO | Alinea grants de la vista pública y policies propias de bonus_predictions | P1 | Construir el flujo de bonus predictions sobre esta base | Agente técnico |
| Correctivo de grants públicos de lectura | `supabase/migrations/004_fix_public_read_grants.sql` | Datos / seguridad | IMPLEMENTADO | Alinea los grants SQL de `teams`, `matches` y `rankings_cache` con sus policies públicas RLS | P1 | Aplicar la migración en Supabase para habilitar lectura pública efectiva | Agente técnico |
| Correctivo de grants autenticados de runtime | `supabase/migrations/005_fix_authenticated_runtime_grants.sql` | Datos / seguridad | IMPLEMENTADO | Alinea los grants SQL del rol `authenticated` con las policies RLS ya definidas para bootstrap de perfil, participación y módulos interactivos | P0 | Aplicar la migración en Supabase para estabilizar login, registro y writes del usuario | Agente técnico |
| MVP recaudable | `plans/soliprode-mvp-recaudable-plan.md` | Producto / operación | PROPUESTO | Define qué falta para poder cobrar inscripciones reales, con Mercado Pago online-first, activación competitiva, competencia por premios y operación de grupos/promotores | P0 | Desglosar este plan en entregables técnicos y confirmar decisiones comerciales pendientes | Producto + agente técnico |
| Home promo floor and countdown | `plans/2026-06-03-home-promo-floor-and-countdown.md` | Home / conversión | ACTIVO | Ajusta el piso comercial visible de pozo y jugadores, y agrega countdown promocional único de campaña en Home | P0 | Validar Home, `lint` y `build`, y dejar la convención de campaña documentada | Producto + agente técnico |
| Contratos UI de SoliProde | `plans/soliprode-ui-contracts-implementation-plan.md` | Producto / diseño / gobierno | ACTIVO | Formaliza contratos obligatorios de voz, diseño Athletic Social y UI/UX para frenar drift visual y de copy | P1 | Ejecutar auditoría de UI actual página por página contra estos contratos | Producto + agente técnico |
| Refactor de Perfil e identidad publica | `plans/2026-06-04-profile-public-identity-refactor.md` | Perfil / identidad / UI | ACTIVO | Separa participacion y cuenta, y alinea el nick publico entre Profile, Ranking y Team | P1 | Implementar helpers de identidad publica, refactorizar `/profile` y validar runtime | Producto + agente técnico |
| Admin email send y alternativas gratuitas por tandas | `plans/2026-06-10-admin-email-send-and-batch-alternatives.md` | Admin / outreach / operación | PROPUESTO | Define lo que falta para pasar de drafts manuales a envío controlado por tandas de hasta 40 correos, con comparación de alternativas gratuitas | P1 | Elegir provider inicial y cerrar contrato de envío, trazabilidad y anti-duplicado antes de implementar send real | Producto + agente técnico |
| Pase de equipo / cupos prepagos | `plans/2026-06-13-team-pass-prepaid-slots.md` | Teams / pagos / admin | ACTIVO | Agrega compra de cupos prepagos para Team sin bots y con claim posterior por cuentas reales | P0 | Implementar schema, checkout paralelo, claim flow y visibilidad para capitán/admin | Producto + agente técnico |
| Roadmap de notificaciones PWA | `src/content/docs/roadmap/pwa-notifications-roadmap.md` | Producto / post-MVP | DOCUMENTADO | Define Push PWA, email y WhatsApp como fase futura, fuera del MVP inmediato | P2 | No implementar hasta terminar fixture, pronósticos, pagos, rankings, grupos y Admin | Producto + agente técnico |

## Regla visual obligatoria

Antes de modificar UI, layout, copy visual o componentes, consultar primero:

- `src/content/docs/design-system-athletic-social.md`
- `src/content/docs/contracts/athletic-social-design-contract.md`

## Regla de copy obligatoria

Antes de modificar headlines, CTA, mensajes de auth, pago, dashboard o onboarding, consultar primero:

- `src/content/docs/voice-and-copy-soliprode.md`
- `src/content/docs/contracts/voice-contract.md`
- `src/content/docs/contracts/ui-ux-implementation-contract.md`

La voz activa del producto es competitiva, directa, futbolera y orientada a premio. No se debe volver a tono institucional o administrativo.

La dirección visual activa del producto es `Athletic Social` de Stitch. No se deben resolver pantallas o componentes aislados ignorando ese sistema visual.

## Backlog sugerido todavía no planificado

- Comunidades y oficinas post-MVP.
- Automatización de cobro con Mercado Pago.
- Bonus predictions.
- Reportería operativa y comercial.
- Liquidación interna de promotores.
- Notificaciones PWA, email y WhatsApp como fase futura documentada.
