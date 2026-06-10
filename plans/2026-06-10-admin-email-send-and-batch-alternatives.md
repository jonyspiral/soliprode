---
title: "Admin email send y alternativas gratuitas por tandas"
description: "Cerrar lo que falta para pasar de drafts manuales a envío controlado desde Admin, con tandas máximas de 40 correos."
lastUpdated: "2026-06-10"
---

# Plan — Admin email send y alternativas gratuitas por tandas

Estado: PROPUESTO
Prioridad: P1
Fecha: 2026-06-10
Próxima acción: elegir el canal inicial de envío y cerrar el contrato de seguridad, confirmación humana y trazabilidad antes de tocar el botón de send.
Criterio de cierre: `/admin` puede enviar una tanda manual de hasta 40 correos a registrados sin Pase en estados reintentables, con confirmación explícita, logs por destinatario, reintentos controlados, protección anti-duplicado, y validación real de extremo a extremo sin tocar checkout, webhook ni communities.

## Contexto

Hoy SoliProde ya puede preparar borradores manuales de Gmail desde Admin para:

- `pending`
- `payment_started`
- `payment_pending`
- `rejected`

Y deja `manual_review` separado del flujo de outreach.

Eso resuelve la preparación manual, pero todavía no resuelve el envío real controlado desde producto.

## Objetivo

Pasar de `drafts only` a `send controlado` sin abrir una newsletter masiva ni una automatización agresiva.

La unidad operativa buscada es:

- selección manual desde `/admin`
- lote chico
- máximo `40` correos por tanda
- confirmación humana antes de enviar
- trazabilidad por destinatario
- capacidad de pausar, reintentar y auditar

## Alcance

- `/admin`
- server actions y/o API route admin-only para envío
- storage seguro de credenciales/tokens
- logs de envío y anti-duplicado
- provider adapter para Gmail o alternativa gratuita
- documentación operativa mínima

## Fuera de alcance

- `communities`
- checkout
- webhooks de pago
- reconciliación de Mercado Pago
- campañas masivas
- newsletters
- automatizaciones por cron
- base Spiral

## Requisitos faltantes para habilitar envío real

### 1. Acción de envío separada de la creación de borradores

Hace falta un flujo explícito distinto de `Crear borradores Gmail`:

- botón separado: `Enviar tanda ahora`
- confirmación previa con cantidad exacta
- bloqueo si la selección supera `40`
- preview de plantilla elegida y asunto final

### 2. Límite duro de lote

Hace falta imponer en server-side:

- máximo `40` destinatarios por ejecución
- rechazo si la selección incluye perfiles duplicados
- rechazo si hay destinatarios sin email

No alcanza con esconderlo en UI. Tiene que validarse en la acción server-side.

### 3. Logs de envío, no solo logs de drafts

Hoy el flujo de drafts necesita complementarse con un log específico por envío real:

- `sent`
- `failed`
- `skipped_duplicate`
- `blocked_manual_review`
- `provider_message_id`
- timestamp real de envío
- admin que disparó la tanda
- plantilla usada

También hace falta guardar el resultado por destinatario, no solo el resumen del lote.

### 4. Idempotencia y guardas anti-duplicado de envío

Antes de permitir send real, hace falta una regla operativa clara:

- no reenviar la misma plantilla al mismo perfil dentro de una ventana configurable
- dejar bypass manual solo para admins
- si hay bypass, que quede auditado

La guarda actual de drafts no alcanza como contrato final de envío.

### 5. Estado visible del lote

Admin necesita ver:

- cuántos se enviaron
- cuántos fallaron
- cuántos se omitieron
- por qué falló cada destinatario

Si no, el primer error parcial vuelve opaco el sistema.

### 6. Confirmación humana fuerte

Antes del send real, hace falta una confirmación operativa:

- cantidad a enviar
- plantilla
- mailbox o provider emisor
- aclaración de que la acción es irreversible

Para este producto, no conviene hacer send con un solo click.

### 7. Adaptador de provider de envío

El envío no debería quedar acoplado a Gmail API directamente en la UI.

Hace falta un adapter con contrato único:

- `prepareBatch`
- `sendBatch`
- `mapProviderError`
- `resolveDailyLimits`

Eso permite empezar con Gmail y cambiar a Brevo, Resend o Mailjet sin romper `/admin`.

### 8. Ruta de envío separada de `manual_review`

`manual_review` debe seguir fuera del lote.

Antes de send real, hace falta endurecer:

- filtro server-side que excluya `manual_review`
- filtro server-side que excluya `paid`
- filtro server-side que excluya perfiles sin participación elegible

### 9. Trazabilidad de remitente

Hace falta definir y persistir:

- mailbox emisor activo
- nombre visible del remitente
- `reply-to`
- dominio o identidad verificada si el provider lo exige

Sin esto, el envío queda frágil o inconsistente.

### 10. Observabilidad mínima

Antes de habilitar la acción:

- logs estructurados por lote
- logs por destinatario
- conteo de errores por provider
- flag de dry-run o test mode para QA

### 11. QA real de extremo a extremo

No alcanza `lint` + `build`.

Hace falta probar:

1. selección de 1 destinatario
2. selección de 40 destinatarios
3. bloqueo al intentar 41
4. perfil sin email
5. perfil `manual_review`
6. perfil que ya recibió la misma plantilla dentro de la ventana anti-duplicado
7. error del provider
8. resultado parcial con éxitos y fallas

## Alternativas gratuitas o casi gratuitas para tandas de hasta 40 correos

Referencia operativa revisada el 2026-06-10. Conviene revalidar pricing antes de activar producción.

### Opción A — Gmail API con mailbox real del admin

Ventajas:

- costo incremental cero si ya existe el mailbox
- reutiliza la base OAuth ya iniciada por el flujo de drafts
- sirve bien para tandas chicas y manuales

Riesgos:

- límites diarios dependen de la cuenta Gmail/Workspace
- deliverability y reputación quedan atadas al mailbox humano
- menos cómodo para auditoría y rebotes

Encaje:

- muy buen primer paso si la operación real es manual y el volumen queda en `<= 40` por tanda

### Opción B — Resend Free

Estado revisado el 2026-06-10:

- free con `100 emails/day` y `3,000/month`

Ventajas:

- API limpia para transactional email
- mejor separación entre producto y mailbox humano
- suficiente para una tanda diaria chica

Riesgos:

- exige dominio/remitente bien configurado
- si el equipo quiere varias tandas el mismo día, puede quedarse corto

Encaje:

- buena opción si SoliProde quiere un sender técnico dedicado y un límite barato pero claro

### Opción C — Brevo Free

Estado revisado el 2026-06-10:

- free con `300 emails/day`

Ventajas:

- más margen diario que Resend Free
- sirve tanto para transactional como para campañas chicas
- tolera mejor varias tandas manuales en un mismo día

Riesgos:

- superficie algo más de marketing/CRM que developer-first
- integración inicial más pesada que Resend

Encaje:

- la mejor alternativa gratuita si el objetivo es varias tandas manuales de `<= 40` sin pensar en upgrade inmediato

### Opción D — Mailjet Free

Estado revisado el 2026-06-10:

- free con `200 emails/day` y `6,000/month`

Ventajas:

- margen diario suficiente para varias tandas
- API/SMTP y features razonables para lote chico

Riesgos:

- plan free más limitado en features avanzadas
- menos simple de operar que Gmail drafts/manual-first

Encaje:

- alternativa intermedia razonable si se prioriza cupo diario sobre minimalismo

## Recomendación de implementación

### Camino recomendado

1. Mantener Gmail drafts como camino manual seguro de fase 1.
2. Implementar primero `send controlado` sobre Gmail API solo para tandas de hasta `40`.
3. Diseñar el provider adapter desde el inicio.
4. Si el equipo necesita más de una o dos tandas al día, migrar el adapter a Brevo Free.

### Recomendación de fallback

Si el sender humano no es aceptable para operación:

1. saltar directo a Brevo Free
2. usar sender dedicado
3. conservar el mismo batch limit de `40`
4. mantener confirmación humana desde Admin

## Implementación propuesta

1. Crear plan de datos para `email_send_logs` o equivalente de envío real por destinatario.
2. Agregar adapter de provider desacoplado del flujo Gmail actual.
3. Crear acción server-side `sendManualRecoveryBatchAction`.
4. Imponer límite server-side de `40`.
5. Agregar pantalla/resumen de confirmación previa al send.
6. Mostrar resultado por destinatario en `/admin`.
7. Añadir modo de prueba para QA interno.
8. Documentar operación y guardrails en `src/content/docs/`.

## Decisiones pendientes

- si el remitente inicial será Gmail humano o sender técnico de dominio
- si el reply-to debe caer en una casilla personal o shared inbox
- ventana exacta de anti-duplicado
- si el bypass admin queda habilitado desde el día 1
- si el primer sender productivo será Gmail, Brevo o Resend

## Verificación de cierre

1. `npm run lint`
2. `npm run build`
3. prueba manual o automatizada del lote de `1`, `40` y `41`
4. evidencia de logs por destinatario
5. evidencia de confirmación humana previa
6. evidencia de un envío real exitoso a cuentas de prueba
